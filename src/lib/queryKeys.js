/**
 * Chaves da cache de dados. Usar SEMPRE estas funções (nunca arrays soltos)
 * para que a invalidação após criar/editar/eliminar actualize todas as páginas.
 *
 * Ex.: queryClient.invalidateQueries({ queryKey: queryKeys.suppliers.all })
 */
export const queryKeys = {
    suppliers: {
        all: ['suppliers'],
        list: () => ['suppliers', 'list'],
        classification: (id) => ['suppliers', 'classification', id],
    },
    categories: {
        all: ['categories'],
    },
    users: {
        all: ['users'],
        list: () => ['users', 'list'],
        permissions: (id) => ['users', 'permissions', id],
    },
    menus: {
        all: ['menus'],
    },
    quotationRequests: {
        all: ['quotation-requests'],
        list: () => ['quotation-requests', 'list'],
        detail: (id) => ['quotation-requests', 'detail', id],
    },
    quotationResponses: {
        all: ['quotation-responses'],
        list: (params = {}) => ['quotation-responses', 'list', params],
        detail: (id) => ['quotation-responses', 'detail', id],
    },
    acquisitions: {
        all: ['acquisitions'],
        list: () => ['acquisitions', 'list'],
        detail: (id) => ['acquisitions', 'detail', id],
    },
    products: {
        all: ['products'],
        list: (params = {}) => ['products', 'list', params],
        analytics: (id) => ['products', 'analytics', id],
    },
    auditLogs: {
        all: ['audit-logs'],
        list: (params = {}) => ['audit-logs', 'list', params],
    },
    deletionRequests: {
        all: ['deletion-requests'],
        list: () => ['deletion-requests', 'list'],
    },
    notifications: {
        all: ['notifications'],
        list: () => ['notifications', 'list'],
        unreadCount: () => ['notifications', 'unread-count'],
    },
    dashboard: {
        all: ['dashboard'],
    },
    reports: {
        all: ['reports'],
        summary: (params = {}) => ['reports', 'summary', params],
    },
};
