import { useCallback } from 'react';
import { keepPreviousData, useQuery as useTanstackQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryKeys';
import { toArray, unwrap, getPagination } from '../utils/apiHelpers';
import {
    suppliersAPI,
    categoriesAPI,
    usersAPI,
    menusAPI,
    quotationRequestsAPI,
    quotationResponsesAPI,
    acquisitionsAPI,
    productsAPI,
    auditLogsAPI,
    pendingDeletionsAPI,
    notificationsAPI,
    dashboardAPI,
    reportsAPI,
    permissionsAPI,
} from '../services/api';

/**
 * Hooks de dados partilhados (TanStack Query).
 *
 * Todos devolvem o resultado do useQuery: { data, isLoading, isFetching, isError,
 * error, refetch, dataUpdatedAt, ... }. As listas já vêm normalizadas para array,
 * por isso `data` nunca precisa de `.data || []` nas páginas.
 *
 * `options` é passado ao useQuery (ex.: { enabled: isAdmin, refetchInterval: 15000 }).
 */

/**
 * useQuery em que `isLoading` significa "ainda não há dados".
 * No TanStack, uma primeira carga em pausa (sem rede, ou novas tentativas suspensas
 * com o separador em segundo plano) tem isLoading=false e isError=false — as páginas
 * mostrariam "Sem registos" em vez do estado de carregamento.
 */
function useQuery(options) {
    const query = useTanstackQuery(options);
    const enabled = options.enabled !== false;
    return { ...query, isLoading: enabled && query.isPending && !query.isError };
}

const listQuery = (queryKey, fetcher, options) => ({
    queryKey,
    queryFn: async () => toArray(await fetcher()),
    ...options,
});

// ── Fornecedores ─────────────────────────────────────────────
export function useSuppliers(options) {
    return useQuery(listQuery(queryKeys.suppliers.list(), () => suppliersAPI.getAll(), options));
}

export function useSupplierClassification(id, options) {
    return useQuery({
        queryKey: queryKeys.suppliers.classification(id),
        queryFn: async () => unwrap(await suppliersAPI.getClassification(id)),
        enabled: id !== undefined && id !== null,
        staleTime: 5 * 60 * 1000,
        ...options,
    });
}

export function useCategories(options) {
    return useQuery(listQuery(queryKeys.categories.all, () => categoriesAPI.getAll(), {
        staleTime: 5 * 60 * 1000,
        ...options,
    }));
}

// ── Utilizadores e permissões ────────────────────────────────
export function useUsers(options) {
    return useQuery(listQuery(queryKeys.users.list(), () => usersAPI.getAll(), options));
}

export function useUserPermissions(userId, options) {
    return useQuery({
        queryKey: queryKeys.users.permissions(userId),
        queryFn: () => permissionsAPI.getUserPermissions(userId),
        enabled: userId !== undefined && userId !== null,
        ...options,
    });
}

export function useMenus(options) {
    return useQuery(listQuery(queryKeys.menus.all, () => menusAPI.getAll(), {
        staleTime: 5 * 60 * 1000,
        ...options,
    }));
}

// ── Cotações e aquisições ────────────────────────────────────
export function useQuotationRequests(options) {
    return useQuery(listQuery(queryKeys.quotationRequests.list(), () => quotationRequestsAPI.listAll(), options));
}

export function useQuotationResponses(params = {}, options) {
    return useQuery(listQuery(queryKeys.quotationResponses.list(params), () => quotationResponsesAPI.getAll(params), options));
}

export function useAcquisitions(options) {
    return useQuery(listQuery(queryKeys.acquisitions.list(), () => acquisitionsAPI.listAll(), options));
}

export function useDeletionRequests(options) {
    return useQuery(listQuery(queryKeys.deletionRequests.list(), () => pendingDeletionsAPI.listAll(), options));
}

// ── Listas paginadas no servidor ─────────────────────────────
/**
 * Produtos paginados no servidor. Mantém a página anterior visível enquanto
 * a seguinte carrega (sem "piscar" a tabela).
 * @returns data: { items: [], pagination: { currentPage, lastPage, total, perPage } | null }
 */
export function useProducts({ page = 1, search = '' } = {}, options) {
    const term = search.trim();
    return useQuery({
        queryKey: queryKeys.products.list({ page, search: term }),
        queryFn: async () => {
            const response = term ? await productsAPI.search(term, page) : await productsAPI.getAll(page);
            return { items: toArray(response), pagination: getPagination(response) };
        },
        placeholderData: keepPreviousData,
        ...options,
    });
}

/**
 * Logs de auditoria paginados no servidor.
 * @returns data: { items: [], pagination }
 */
export function useAuditLogs(params = {}, options) {
    return useQuery({
        queryKey: queryKeys.auditLogs.list(params),
        queryFn: async () => {
            const response = await auditLogsAPI.getAll(params);
            const payload = response?.data && !Array.isArray(response.data) && Array.isArray(response.data.data)
                ? response.data
                : response;
            return { items: toArray(payload), pagination: getPagination(payload) };
        },
        placeholderData: keepPreviousData,
        ...options,
    });
}

// ── Notificações ─────────────────────────────────────────────
export function useNotifications(options) {
    return useQuery(listQuery(queryKeys.notifications.list(), () => notificationsAPI.getAll(), options));
}

export function useUnreadNotificationsCount(options) {
    return useQuery({
        queryKey: queryKeys.notifications.unreadCount(),
        queryFn: async () => {
            const res = await notificationsAPI.getUnreadCount();
            if (typeof res === 'number') return res;
            const value = res?.count ?? res?.unread_count ?? res?.data?.count ?? res?.data?.unread_count ?? res?.data;
            return Number(value) || 0;
        },
        ...options,
    });
}

// ── Painel e relatórios ──────────────────────────────────────
export function useDashboard(options) {
    return useQuery({
        queryKey: queryKeys.dashboard.all,
        queryFn: async () => unwrap(await dashboardAPI.getData()),
        ...options,
    });
}

export function useReportSummary(params = {}, options) {
    return useQuery({
        queryKey: queryKeys.reports.summary(params),
        queryFn: async () => unwrap(await reportsAPI.getSummary(params)) || {},
        placeholderData: keepPreviousData,
        ...options,
    });
}

// ── Invalidação ──────────────────────────────────────────────
/**
 * Devolve uma função que marca uma ou mais áreas como desactualizadas,
 * forçando o refresh em todas as páginas que as mostram.
 *
 * Ex.: const invalidate = useInvalidate();
 *      invalidate(queryKeys.suppliers.all, queryKeys.dashboard.all);
 */
export function useInvalidate() {
    const queryClient = useQueryClient();
    return useCallback(
        (...keys) => Promise.all(keys.map((queryKey) => queryClient.invalidateQueries({ queryKey }))),
        [queryClient]
    );
}
