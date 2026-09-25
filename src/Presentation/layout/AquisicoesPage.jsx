import { useState, useEffect, useMemo, useCallback } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { createPortal } from "react-dom";
import { useQueryClient } from "@tanstack/react-query";
import { SlidersHorizontal, Eye, FileText, Truck, Plus, X, Trash2, ClipboardList, ShoppingCart } from "lucide-react";
import { quotationResponsesAPI, quotationRequestsAPI, acquisitionsAPI, pendingDeletionsAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { useConfirm } from "../../context/ConfirmContext";
import { useAcquisitions, useQuotationRequests, useInvalidate } from "../../hooks/queries";
import { useUrlFilters } from "../../hooks/useUrlFilters";
import { useSortedItems, useClientPagination } from "../../hooks/useTableData";
import { queryKeys } from "../../lib/queryKeys";
import { getErrorMessage, matchesSearch, unwrap } from "../../utils/apiHelpers";
import DashboardTableSkeleton from "../Components/DashboardTableSkeleton";
import ModalRevisarCotacao from "../Components/ModalRevisarCotacao";
import ModalPedirCotacao from "../Components/ModalPedirCotacao";
import ModalRespostasPedido from "../Components/ModalRespostasPedido";
import ModalSolicitarEliminacao from "../Components/ModalSolicitarEliminacao";
import ModalConfirmarEntrega from "../Components/ModalConfirmarEntrega";
import { isAwaitingDelivery, getDeliveryDeadlineInfo, DEADLINE_TONE_CLASSES } from "../../utils/acquisitions";
import SearchInput from "../Components/ui/SearchInput";
import RefreshButton from "../Components/ui/RefreshButton";
import FilterChips from "../Components/ui/FilterChips";
import Pagination from "../Components/ui/Pagination";
import SortableHeader from "../Components/ui/SortableHeader";
import { EmptyState, ErrorState, StaleDataBanner } from "../Components/ui/StateViews";

// Estados considerados "em curso" no separador Atividades em Curso
const IN_PROGRESS_STATUSES = ['sent', 'draft', 'pending', 'pending_review', 'open', 'published', 'active', 'in_progress', 'awaiting_delivery'];

const TABS = [
    { id: 'atividades', label: 'Atividades' },
    { id: 'aquisicoes', label: 'Atividades em Curso' },
    { id: 'concluidas', label: 'Atividades Concluídas' },
    { id: 'canceladas', label: 'Atividades Canceladas', danger: true },
    { id: 'lista_aquisicoes', label: 'Aquisições' },
];
const TAB_IDS = TABS.map((t) => t.id);

// Filtros no URL: ?tab=concluidas&q=...&estado=...&submissao=2026-01-31&entrega=...&sort=prazo&dir=desc&page=2
const FILTER_DEFAULTS = { tab: 'atividades', q: '', estado: '', submissao: '', entrega: '', sort: '', dir: '', page: 1, pageSize: 25 };
// Parâmetro de "deep link" que abre as respostas de um pedido: /aquisicoes?pedido=123
const PEDIDO_PARAM = 'pedido';

const STATUS_CONFIG = {
    draft: { label: 'Rascunho', class: 'bg-gray-50 text-gray-700 border-gray-100' },
    pending: { label: 'Pendente', class: 'bg-yellow-50 text-yellow-700 border-yellow-100' },
    submitted: { label: 'Submetida', class: 'bg-blue-50 text-blue-700 border-blue-100' },
    pending_review: { label: 'Pendente', class: 'bg-yellow-50 text-yellow-700 border-yellow-100' },
    in_review: { label: 'Em Revisão', class: 'bg-amber-50 text-amber-700 border-amber-100' },
    approved: { label: 'Aprovada', class: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
    rejected: { label: 'Rejeitada', class: 'bg-red-50 text-red-700 border-red-100' },
    revision_requested: { label: 'Revisão Solicitada', class: 'bg-purple-50 text-purple-700 border-purple-100' },
    needs_revision: { label: 'Revisão Necessária', class: 'bg-purple-50 text-purple-700 border-purple-100' },
    published: { label: 'Publicada', class: 'bg-blue-50 text-blue-700 border-blue-100' },
    sent: { label: 'Enviada', class: 'bg-blue-50 text-blue-700 border-blue-100' },
    open: { label: 'Em Curso', class: 'bg-blue-50 text-blue-700 border-blue-100' },
    active: { label: 'Ativa', class: 'bg-blue-50 text-blue-700 border-blue-100' },
    in_progress: { label: 'Em Progresso', class: 'bg-blue-50 text-blue-700 border-blue-100' },
    awaiting_delivery: { label: 'A Aguardar Entrega', class: 'bg-orange-50 text-orange-700 border-orange-100' },
    completed: { label: 'Concluída', class: 'bg-green-50 text-green-700 border-green-100' },
    cancelled: { label: 'Cancelada', class: 'bg-red-50 text-red-700 border-red-100' },
    delivered: { label: 'Entregue', class: 'bg-green-50 text-green-700 border-green-100' },
};
const getStatusLabel = (status) => STATUS_CONFIG[status]?.label || status || 'Desconhecido';

const getStatusBadge = (status) => {
    const config = STATUS_CONFIG[status] || { label: 'Desconhecido', class: 'bg-gray-50 text-gray-700 border-gray-100' };
    return (
        <span className={`inline-flex items-center whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-bold border ${config.class}`}>
            {config.label}
        </span>
    );
};

const pad3 = (id) => String(id).padStart(3, '0');

const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "N/A";
    return date.toLocaleDateString('pt-AO', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const formatFilterDate = (ymd) => {
    const [y, m, d] = String(ymd).split('-');
    return d && m && y ? `${d}/${m}/${y}` : ymd;
};

// Data (local) no formato YYYY-MM-DD; datas "puras" (sem hora) mantêm-se como estão
const toLocalYMD = (value) => {
    if (!value) return '';
    const str = String(value);
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
    const date = new Date(str);
    if (Number.isNaN(date.getTime())) return str.slice(0, 10);
    const p = (n) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`;
};
const matchesDay = (ymd, ...values) => !ymd || values.some((v) => v && toLocalYMD(v) === ymd);

const toTime = (value) => {
    if (!value) return null;
    const t = new Date(value).getTime();
    return Number.isNaN(t) ? null : t;
};

const getSupplierName = (s) => s?.company_name || s?.commercial_name || s?.legal_name || '';
const getAcqSupplierName = (acq) => getSupplierName(acq.supplier) || `Fornecedor #${acq.supplier_id}`;
const getAcqReference = (acq) => acq.reference_number || `ACQ-${pad3(acq.id)}`;
const getAcqPpReference = (acq) => acq.quotation_request?.activity_description || acq.quotation_request?.reference || '';
const getActivityPpRef = (act) => act.reference || act.activity_description || '';
const getActivitySystemRef = (act) => {
    const ppRef = getActivityPpRef(act);
    return (act.reference_number && act.reference_number !== ppRef)
        ? act.reference_number
        : (act.id != null ? `CT-${pad3(act.id)}` : '');
};
const getAcquisitionRequestId = (acq) => acq.quotation_request_id ?? acq.quotation_request?.id;

// Ordenação da tabela de aquisições (a das atividades depende do estado efectivo → useMemo)
const ACQUISITION_SORT = {
    id: (a) => Number(a.id) || 0,
    actividade: (a) => a.quotation_request?.title || '',
    referencia: getAcqPpReference,
    fornecedor: getAcqSupplierName,
    prevista: (a) => toTime(a.expected_delivery_date),
    real: (a) => toTime(a.actual_delivery_date),
    estado: (a) => getStatusLabel(a.status),
};

const thClass = "px-6 py-5 text-left text-[10px] font-black uppercase tracking-widest";
// Tabela de aquisições tem mais colunas: espaçamento mais compacto
const thClassCompact = "px-4 py-5 text-left text-[10px] font-black uppercase tracking-widest";
const thStyle = { color: 'var(--color-text-muted)' };

export default function AquisicoesPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [searchParams, setSearchParams] = useSearchParams();
    const { isAdmin } = useAuth();
    const toast = useToast();
    const confirm = useConfirm();
    const invalidate = useInvalidate();

    const { filters, setFilter, setFilters, resetFilters, countActive } = useUrlFilters(FILTER_DEFAULTS);
    const activeTab = TAB_IDS.includes(filters.tab) ? filters.tab : 'atividades';
    const isAcquisitionsTab = activeTab === 'lista_aquisicoes';
    const activeFilterCount = countActive(['tab']);
    const panelFilterCount = [filters.estado, filters.submissao, filters.entrega].filter(Boolean).length;
    const [isFiltersVisible, setIsFiltersVisible] = useState(() => panelFilterCount > 0);

    // Dados (cache partilhada com o Painel e restantes páginas)
    const acquisitionsQuery = useAcquisitions();
    const requestsQuery = useQuotationRequests();
    const acquisitions = useMemo(() => acquisitionsQuery.data ?? [], [acquisitionsQuery.data]);
    const atividades = useMemo(() => requestsQuery.data ?? [], [requestsQuery.data]);

    // Modal states
    const [selectedResponse, setSelectedResponse] = useState(null);
    const [isRevisarModalOpen, setIsRevisarModalOpen] = useState(false);
    const [isViewingAcquisition, setIsViewingAcquisition] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    // Aquisição cuja entrega está a ser confirmada: { acquisition, title }
    const [deliveryTarget, setDeliveryTarget] = useState(null);

    // Activity modal states
    const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
    const [activityName, setActivityName] = useState("");
    const [activityReference, setActivityReference] = useState("");
    const [isCotacaoModalOpen, setIsCotacaoModalOpen] = useState(false);
    const [currentActivityName, setCurrentActivityName] = useState("");
    const [currentActivityReference, setCurrentActivityReference] = useState("");

    // Pedido cujas respostas estão abertas (no URL → sobrevive a F5 e pode ser partilhado)
    const pedidoId = searchParams.get(PEDIDO_PARAM);
    const openPedido = useCallback((id) => {
        if (id == null) return;
        setSearchParams((prev) => {
            const next = new URLSearchParams(prev);
            next.set(PEDIDO_PARAM, String(id));
            return next;
        }, { replace: true });
    }, [setSearchParams]);
    const closePedido = useCallback(() => {
        setSearchParams((prev) => {
            const next = new URLSearchParams(prev);
            next.delete(PEDIDO_PARAM);
            return next;
        }, { replace: true });
    }, [setSearchParams]);

    // Aquisição por pedido (para o estado efectivo das atividades)
    const acquisitionByRequest = useMemo(() => {
        const map = new Map();
        for (const acq of acquisitions) {
            const reqId = getAcquisitionRequestId(acq);
            if (reqId != null && !map.has(String(reqId))) map.set(String(reqId), acq);
        }
        return map;
    }, [acquisitions]);

    const getEffectiveStatus = useCallback((act) => {
        if (act.status === 'cancelled') return 'cancelled';
        const acq = acquisitionByRequest.get(String(act.id));
        if (acq) return acq.actual_delivery_date ? 'completed' : 'awaiting_delivery';
        return act.status;
    }, [acquisitionByRequest]);

    const isInTab = useCallback((act, tab) => {
        const status = getEffectiveStatus(act);
        if (tab === 'aquisicoes') return IN_PROGRESS_STATUSES.includes(status);
        if (tab === 'concluidas') return status === 'completed' || act.status === 'approved';
        if (tab === 'canceladas') return act.status === 'cancelled';
        return true;
    }, [getEffectiveStatus]);

    const tabCounts = useMemo(() => ({
        atividades: atividades.length,
        aquisicoes: atividades.filter((a) => isInTab(a, 'aquisicoes')).length,
        concluidas: atividades.filter((a) => isInTab(a, 'concluidas')).length,
        canceladas: atividades.filter((a) => isInTab(a, 'canceladas')).length,
        lista_aquisicoes: acquisitions.length,
    }), [atividades, acquisitions, isInTab]);

    // Linhas do separador activo (antes dos filtros)
    const baseRows = useMemo(
        () => (isAcquisitionsTab ? acquisitions : atividades.filter((a) => isInTab(a, activeTab))),
        [isAcquisitionsTab, acquisitions, atividades, isInTab, activeTab]
    );

    const getRowStatus = useCallback(
        (row) => (isAcquisitionsTab ? row.status : getEffectiveStatus(row)),
        [isAcquisitionsTab, getEffectiveStatus]
    );

    // Estados existentes no separador (opções do filtro)
    const statusOptions = useMemo(
        () => [...new Set(baseRows.map(getRowStatus).filter(Boolean))]
            .sort((a, b) => getStatusLabel(a).localeCompare(getStatusLabel(b), 'pt')),
        [baseRows, getRowStatus]
    );

    const filteredRows = useMemo(() => baseRows.filter((row) => {
        if (isAcquisitionsTab) {
            if (!matchesSearch(filters.q, row.id, getAcqReference(row), getAcqPpReference(row), row.quotation_request?.title, getActivitySystemRef(row.quotation_request || { id: getAcquisitionRequestId(row) }), getAcqSupplierName(row))) return false;
            if (!matchesDay(filters.entrega, row.delivery_date || row.expected_delivery_date)) return false;
            if (!matchesDay(filters.submissao, row.submitted_at, row.created_at)) return false;
            if (filters.estado && row.status !== filters.estado) return false;
            return true;
        }
        if (!matchesSearch(filters.q, row.id, row.title, getActivityPpRef(row), getActivitySystemRef(row), row.reference_number)) return false;
        if (!matchesDay(filters.entrega, row.deadline)) return false;
        if (!matchesDay(filters.submissao, row.submitted_at, row.created_at)) return false;
        if (filters.estado && row.status !== filters.estado && getEffectiveStatus(row) !== filters.estado) return false;
        return true;
    }), [baseRows, isAcquisitionsTab, filters.q, filters.entrega, filters.submissao, filters.estado, getEffectiveStatus]);

    const activitySort = useMemo(() => ({
        id: (a) => Number(a.id) || 0,
        titulo: (a) => a.title,
        submissao: (a) => toTime(a.created_at || a.submitted_at),
        prazo: (a) => toTime(a.deadline),
        estado: (a) => getStatusLabel(getEffectiveStatus(a)),
    }), [getEffectiveStatus]);

    const sortedRows = useSortedItems(filteredRows, filters, isAcquisitionsTab ? ACQUISITION_SORT : activitySort);
    const pagination = useClientPagination(sortedRows, filters.page, filters.pageSize);

    // Estado do carregamento conforme o separador
    const primaryQuery = isAcquisitionsTab ? acquisitionsQuery : requestsQuery;
    const isLoading = isAcquisitionsTab
        ? acquisitionsQuery.isLoading
        : requestsQuery.isLoading || acquisitionsQuery.isLoading;
    const isFetching = acquisitionsQuery.isFetching || requestsQuery.isFetching;
    const hasData = (isAcquisitionsTab ? acquisitions : atividades).length > 0;
    // Nas atividades, uma falha a carregar as aquisições afecta apenas os estados
    const acquisitionsStatusStale = !isAcquisitionsTab && acquisitionsQuery.isError && !requestsQuery.isError;

    const refetchAll = () => Promise.all([acquisitionsQuery.refetch(), requestsQuery.refetch()]);

    // ── Filtros ───────────────────────────────────────────────
    const changeTab = (tab) => {
        // Estados e colunas diferem entre separadores: repor estado e ordenação
        setFilters({ tab, estado: '', sort: '', dir: '' });
    };
    const clearFilters = () => resetFilters(['tab', 'pageSize']);
    const onSort = (sort, dir) => setFilters({ sort, dir });

    const chips = [
        filters.q && { key: 'q', label: `"${filters.q}"`, onRemove: () => setFilter('q', '') },
        filters.estado && { key: 'estado', label: `Estado: ${getStatusLabel(filters.estado)}`, onRemove: () => setFilter('estado', '') },
        filters.submissao && { key: 'submissao', label: `Submissão: ${formatFilterDate(filters.submissao)}`, onRemove: () => setFilter('submissao', '') },
        filters.entrega && { key: 'entrega', label: `Entrega: ${formatFilterDate(filters.entrega)}`, onRemove: () => setFilter('entrega', '') },
    ];

    // ── Detalhes ──────────────────────────────────────────────
    const fetchCached = useCallback((queryKey, fetcher) =>
        queryClient.fetchQuery({ queryKey, queryFn: async () => unwrap(await fetcher()) }), [queryClient]);

    const handleOpenDetails = useCallback(async (aquisicao) => {
        if (!aquisicao) return;
        try {
            setIsViewingAcquisition(false);
            // Resposta de cotação vinda do ModalRespostasPedido (tem fornecedor, não é placeholder)
            if (aquisicao.supplier && aquisicao.id && !String(aquisicao.id).startsWith('pending-')) {
                setSelectedResponse(aquisicao);
                setIsRevisarModalOpen(true);
                return;
            }

            // Pedido de cotação (sem quotation_response_id): abrir as respostas
            if (!aquisicao.quotation_response_id && !aquisicao.response_id) {
                openPedido(aquisicao.id);
                return;
            }

            // Cópia para não mutar objectos que estão na cache
            let responseDetails = { ...aquisicao };

            if (aquisicao.quotation_response_id) {
                try {
                    const res = await fetchCached(
                        queryKeys.quotationResponses.detail(aquisicao.quotation_response_id),
                        () => quotationResponsesAPI.getById(aquisicao.quotation_response_id)
                    );
                    responseDetails = { ...res };
                } catch (innerError) {
                    console.warn("Falha ao carregar a resposta de cotação; a usar os dados da aquisição", innerError);
                    try {
                        const acqRes = await fetchCached(queryKeys.acquisitions.detail(aquisicao.id), () => acquisitionsAPI.getById(aquisicao.id));
                        responseDetails = { ...acqRes };
                    } catch (acqErr) {
                        console.warn("Falha ao carregar os detalhes da aquisição", acqErr);
                    }
                }
            }

            // Normalização dos dados
            if (!responseDetails.id && aquisicao.id) responseDetails.id = aquisicao.id;
            if (!responseDetails.quotation_supplier && responseDetails.supplier) {
                responseDetails.quotation_supplier = {
                    supplier: responseDetails.supplier,
                    quotation_request: responseDetails.quotation_request || {}
                };
            }
            if (!responseDetails.supplier && responseDetails.quotation_supplier?.supplier) {
                responseDetails.supplier = responseDetails.quotation_supplier.supplier;
            }
            if (!responseDetails.expected_delivery_date && (aquisicao.delivery_date || aquisicao.expected_delivery_date)) {
                responseDetails.expected_delivery_date = aquisicao.delivery_date || aquisicao.expected_delivery_date;
            }
            if (!responseDetails.submitted_at) {
                responseDetails.submitted_at = aquisicao.submitted_at || aquisicao.created_at || responseDetails.created_at;
            }
            if (aquisicao.quotation_request?.title &&
                (!responseDetails.quotation_supplier?.quotation_request?.title && !responseDetails.quotation_request?.title)) {
                responseDetails.quotation_request = {
                    ...(responseDetails.quotation_request || {}),
                    title: aquisicao.quotation_request.title,
                    ...(aquisicao.quotation_request.description ? { description: aquisicao.quotation_request.description } : {})
                };
            }
            if (!responseDetails.proposal_document_url && aquisicao.proposal_document_url) {
                responseDetails.proposal_document_url = aquisicao.proposal_document_url;
            }

            if (!responseDetails.items || responseDetails.items.length === 0) {
                const potentialItems = responseDetails.products || responseDetails.acquisition_items ||
                    aquisicao.items || aquisicao.products || aquisicao.acquisition_items;

                if (potentialItems && potentialItems.length > 0) {
                    responseDetails.items = potentialItems;
                } else {
                    try {
                        const reqId = aquisicao.quotation_request_id || aquisicao.quotation_supplier?.quotation_request_id;
                        if (reqId) {
                            const reqData = await fetchCached(queryKeys.quotationRequests.detail(reqId), () => quotationRequestsAPI.getById(reqId));
                            if (reqData?.items && reqData.items.length > 0) {
                                responseDetails.items = reqData.items.map(i => ({
                                    ...i,
                                    notes: i.specifications || i.description || i.notes || '-',
                                    unit_price: i.unit_price || i.estimated_price || 0,
                                    is_request_fallback: true
                                }));
                            }
                        }
                    } catch (reqErr) {
                        console.warn("Falha ao carregar os itens do pedido de cotação", reqErr);
                    }
                }
            }

            if (!responseDetails.total_amount && (aquisicao.total_amount || aquisicao.amount || aquisicao.value)) {
                responseDetails.total_amount = aquisicao.total_amount || aquisicao.amount || aquisicao.value;
            }

            setSelectedResponse(responseDetails);
            setIsRevisarModalOpen(true);
        } catch (e) {
            toast.error(getErrorMessage(e, "Erro ao carregar detalhes."));
        }
    }, [openPedido, fetchCached, toast]);

    // Compatibilidade: detalhes pedidos via estado da navegação (ex.: Painel).
    // Pedidos de cotação passam para ?pedido=ID; o estado é limpo para não reabrir ao voltar.
    const openDetailsFromNav = location.state?.openDetails;
    useEffect(() => {
        if (!openDetailsFromNav) return;
        const isRequest = !openDetailsFromNav.supplier && !openDetailsFromNav.quotation_response_id && !openDetailsFromNav.response_id;
        if (isRequest && openDetailsFromNav.id != null) {
            // Actualizar o URL (?pedido=ID) também descarta o estado da navegação
            openPedido(openDetailsFromNav.id);
            return;
        }
        navigate({ pathname: location.pathname, search: location.search }, { replace: true, state: null });
        handleOpenDetails(openDetailsFromNav);
    }, [openDetailsFromNav, handleOpenDetails, openPedido, navigate, location.pathname, location.search]);

    const handleViewAcquisition = (acq) => {
        setIsViewingAcquisition(true);
        setSelectedResponse(acq);
        setIsRevisarModalOpen(true);
    };

    // ── Acções ────────────────────────────────────────────────
    // Confirmação de entrega: formulário partilhado (data real da entrega), também usado no Painel
    const handleConfirmDelivery = (acq, title) => {
        setDeliveryTarget({ acquisition: acq, title: title || acq.quotation_request?.title });
    };

    const handleDeleteAtividade = async (e, act) => {
        e.stopPropagation();
        if (!isAdmin) {
            setItemToDelete({ type: 'quotation_request', id: act.id, name: act.title, label: 'Pedido de Cotação' });
            return;
        }
        const label = act.title || `#${act.id}`;
        const confirmed = await confirm({
            title: "Eliminar Atividade",
            message: (
                <p className="text-sm text-gray-600">
                    Deseja eliminar a atividade <strong>{label}</strong>?
                    <span className="block text-sm text-red-700 mt-2">Esta acção não pode ser desfeita.</span>
                </p>
            ),
            confirmLabel: "Sim, Eliminar",
            runningLabel: "A eliminar...",
            variant: "danger",
            onConfirm: () => quotationRequestsAPI.delete(act.id),
            getErrorMessage: (err) => getErrorMessage(err, "Erro ao eliminar atividade."),
        });
        if (!confirmed) return;
        toast.success(`Atividade "${label}" eliminada com sucesso!`);
        if (String(pedidoId) === String(act.id)) closePedido();
        invalidate(queryKeys.quotationRequests.all, queryKeys.dashboard.all);
    };

    const confirmSolicitarEliminacao = async (reason) => {
        if (!itemToDelete) return;
        try {
            await pendingDeletionsAPI.requestDelete(itemToDelete.type, itemToDelete.id, reason);
            setItemToDelete(null);
            toast.success('Solicitação de eliminação enviada ao administrador!');
            invalidate(queryKeys.deletionRequests.all, queryKeys.quotationRequests.all, queryKeys.dashboard.all);
        } catch (err) {
            const status = err.response?.status;
            let errorMsg;
            if (status === 409) {
                errorMsg = 'Já existe uma solicitação de eliminação pendente para esta atividade.';
            } else if (status === 403) {
                errorMsg = 'Não tem permissão para solicitar eliminações.';
            } else {
                errorMsg = getErrorMessage(err, status === 422 ? 'Já existe uma solicitação pendente para este item.' : 'Erro ao solicitar eliminação.');
            }
            toast.error(errorMsg);
            throw err; // mantém o modal aberto
        }
    };

    const resetActivityForm = () => {
        setActivityName("");
        setActivityReference("");
    };

    // Registar atividade e abrir o pedido de cotação
    const handleCreateActivity = () => {
        if (!activityName.trim()) return;
        setCurrentActivityName(activityName.trim());
        setCurrentActivityReference(activityReference.trim());
        setIsActivityModalOpen(false);
        setIsCotacaoModalOpen(true);
    };

    const selectedActivity = useMemo(
        () => (pedidoId ? atividades.find((a) => String(a.id) === String(pedidoId)) : null),
        [pedidoId, atividades]
    );
    const isSelectedConcluded = activeTab === 'concluidas'
        || (selectedActivity ? getEffectiveStatus(selectedActivity) === 'completed' : false);

    const columns = isAcquisitionsTab ? 8 : 6;
    const emptyTitle = isAcquisitionsTab ? 'Nenhuma aquisição encontrada' : 'Nenhuma atividade encontrada';

    const renderEmptyRow = () => (
        <tr>
            <td colSpan={columns}>
                {activeFilterCount > 0 && baseRows.length > 0 ? (
                    <EmptyState filtered onClearFilters={clearFilters} />
                ) : (
                    <EmptyState
                        icon={isAcquisitionsTab ? ShoppingCart : ClipboardList}
                        title={emptyTitle}
                        description={activeTab === 'atividades' ? 'Registe uma nova atividade para começar.' : undefined}
                    />
                )}
            </td>
        </tr>
    );

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Aquisições</h1>
                    <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>Faça a gestão das respostas e aquisições de fornecedores</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsActivityModalOpen(true)}
                        className="btn-primary"
                    >
                        <Plus size={18} />
                        Registar nova atividade
                    </button>
                </div>
            </div>

            {/* Tabs com contadores */}
            <div className="flex border-b overflow-x-auto" role="tablist" style={{ borderColor: 'var(--color-border-light)' }}>
                {TABS.map((tab) => {
                    const isActive = activeTab === tab.id;
                    const activeText = tab.danger ? 'text-red-500 border-b-2 border-red-400' : 'text-[#44B16F] border-b-2 border-[#44B16F]';
                    const activeBadge = tab.danger ? 'bg-red-50 text-red-500' : 'bg-[#44B16F]/10 text-[#44B16F]';
                    return (
                        <button
                            key={tab.id}
                            role="tab"
                            aria-selected={isActive}
                            onClick={() => changeTab(tab.id)}
                            className={`px-6 py-3 font-semibold text-sm transition-all flex items-center gap-2 whitespace-nowrap ${isActive ? activeText : 'text-gray-500 hover:text-gray-800'}`}
                        >
                            {tab.label}
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${isActive ? activeBadge : 'bg-gray-100 text-gray-500'}`}>
                                {isLoading && tabCounts[tab.id] === 0 ? '…' : tabCounts[tab.id]}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Falha numa actualização em segundo plano: manter os dados antigos visíveis */}
            {primaryQuery.isError && hasData && (
                <StaleDataBanner onRetry={refetchAll} isRetrying={isFetching} />
            )}
            {acquisitionsStatusStale && hasData && (
                <StaleDataBanner
                    message="Não foi possível carregar as aquisições. Os estados das atividades podem estar desactualizados."
                    onRetry={refetchAll}
                    isRetrying={isFetching}
                />
            )}

            {/* Content Area */}
            <div className="rounded-2xl shadow-sm overflow-hidden mt-6" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border-light)' }}>
                <div className="flex flex-col p-6 gap-4 border-b" style={{ borderColor: 'var(--color-border-light)' }}>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4 flex-1">
                            <SearchInput
                                value={filters.q}
                                onChange={(q) => setFilter('q', q)}
                                placeholder={isAcquisitionsTab ? "Pesquisar por ID, referência ou fornecedor..." : "Pesquisar por ID, título ou referência..."}
                                className="w-full md:max-w-[400px] flex-1"
                            />
                            <button
                                onClick={() => setIsFiltersVisible(prev => !prev)}
                                title="Filtros"
                                aria-expanded={isFiltersVisible}
                                aria-label="Mostrar filtros"
                                className={`relative p-3 rounded-xl transition-all ${isFiltersVisible ? 'bg-[#44B16F]/10 text-[#44B16F]' : ''}`}
                                style={{ background: isFiltersVisible ? '' : 'var(--color-bg)', color: isFiltersVisible ? '#44B16F' : 'var(--color-text-secondary)' }}
                            >
                                <SlidersHorizontal size={20} />
                                {panelFilterCount > 0 && (
                                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#44B16F] text-white text-[10px] font-bold flex items-center justify-center">
                                        {panelFilterCount}
                                    </span>
                                )}
                            </button>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-3 text-xs font-bold text-gray-400 uppercase tracking-widest">
                                Mostrando <span className="text-[#44B16F]">{pagination.total}</span> resultados
                            </div>
                            <RefreshButton onClick={refetchAll} isFetching={isFetching} updatedAt={primaryQuery.dataUpdatedAt} />
                        </div>
                    </div>

                    {isFiltersVisible && (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 mt-2 border-t" style={{ borderColor: 'var(--color-border-light)' }}>
                            <div>
                                <label htmlFor="filtro-submissao" className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-text-secondary)' }}>Data de Submissão</label>
                                <input
                                    id="filtro-submissao"
                                    type="date"
                                    value={filters.submissao}
                                    onChange={(e) => setFilter('submissao', e.target.value)}
                                    className="input-field"
                                />
                            </div>
                            <div>
                                <label htmlFor="filtro-entrega" className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                                    {isAcquisitionsTab ? 'Data de Entrega' : 'Data Limite / Entrega'}
                                </label>
                                <input
                                    id="filtro-entrega"
                                    type="date"
                                    value={filters.entrega}
                                    onChange={(e) => setFilter('entrega', e.target.value)}
                                    className="input-field"
                                />
                            </div>
                            <div>
                                <label htmlFor="filtro-estado" className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-text-secondary)' }}>Estado</label>
                                <select
                                    id="filtro-estado"
                                    value={filters.estado}
                                    onChange={(e) => setFilter('estado', e.target.value)}
                                    className="input-field appearance-none"
                                >
                                    <option value="">Todos</option>
                                    {statusOptions.map((status) => (
                                        <option key={status} value={status}>{getStatusLabel(status)}</option>
                                    ))}
                                    {filters.estado && !statusOptions.includes(filters.estado) && (
                                        <option value={filters.estado}>{getStatusLabel(filters.estado)}</option>
                                    )}
                                </select>
                            </div>
                            <div className="flex items-end">
                                <button
                                    onClick={clearFilters}
                                    disabled={activeFilterCount === 0}
                                    className="btn-secondary w-full py-2.5 disabled:opacity-50"
                                >
                                    Limpar Filtros
                                </button>
                            </div>
                        </div>
                    )}

                    <FilterChips chips={chips} onClearAll={clearFilters} resultCount={activeFilterCount > 0 ? pagination.total : undefined} />
                </div>

                {primaryQuery.isError && !hasData && !isLoading ? (
                    <ErrorState
                        message={getErrorMessage(primaryQuery.error, isAcquisitionsTab ? "Erro ao carregar aquisições." : "Erro ao carregar atividades.")}
                        onRetry={refetchAll}
                        isRetrying={isFetching}
                    />
                ) : (
                    <>
                        {isAcquisitionsTab ? (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead style={{ background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border-light)' }}>
                                        <tr>
                                            <SortableHeader label="ID" sortKey="id" sort={filters.sort} dir={filters.dir} onSort={onSort} className={thClassCompact} style={thStyle} />
                                            <SortableHeader label="Título da Actividade" sortKey="actividade" sort={filters.sort} dir={filters.dir} onSort={onSort} className={thClassCompact} style={thStyle} />
                                            <SortableHeader label="N.º Referência" sortKey="referencia" sort={filters.sort} dir={filters.dir} onSort={onSort} className={thClassCompact} style={thStyle} />
                                            <SortableHeader label="Fornecedor" sortKey="fornecedor" sort={filters.sort} dir={filters.dir} onSort={onSort} className={thClassCompact} style={thStyle} />
                                            <SortableHeader label="Entrega Prevista" sortKey="prevista" sort={filters.sort} dir={filters.dir} onSort={onSort} className={thClassCompact} style={thStyle} />
                                            <SortableHeader label="Entrega Real" sortKey="real" sort={filters.sort} dir={filters.dir} onSort={onSort} className={thClassCompact} style={thStyle} />
                                            <SortableHeader label="Estado" sortKey="estado" sort={filters.sort} dir={filters.dir} onSort={onSort} className={thClassCompact} style={thStyle} />
                                            <th className="px-4 py-5 text-center text-[10px] font-black uppercase tracking-widest" style={thStyle}>Acções</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {isLoading ? (
                                            <DashboardTableSkeleton rows={5} columns={8} />
                                        ) : pagination.total === 0 ? (
                                            renderEmptyRow()
                                        ) : (
                                            pagination.pageItems.map((acq) => (
                                                <tr key={acq.id} className="transition-colors" onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'} style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                                                    <td className="px-4 py-5 text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>#{acq.id}</td>
                                                    <td className="px-4 py-5 text-sm max-w-[260px]">
                                                        <div className="font-bold truncate" style={{ color: 'var(--color-text-primary)' }} title={acq.quotation_request?.title || ''}>
                                                            {acq.quotation_request?.title || '—'}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-5 text-sm">
                                                        <div className="font-semibold whitespace-nowrap" style={{ color: 'var(--color-text-primary)' }}>
                                                            {getAcqPpReference(acq) || '—'}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-5 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                                                        {getAcqSupplierName(acq)}
                                                    </td>
                                                    <td className="px-4 py-5 text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                                                        {formatDate(acq.expected_delivery_date)}
                                                        {isAwaitingDelivery(acq) && acq.expected_delivery_date && (() => {
                                                            const deadline = getDeliveryDeadlineInfo(acq);
                                                            return deadline.tone !== 'neutral' ? (
                                                                <span className={`block w-fit mt-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${DEADLINE_TONE_CLASSES[deadline.tone]}`}>
                                                                    {deadline.label}
                                                                </span>
                                                            ) : null;
                                                        })()}
                                                    </td>
                                                    <td className="px-4 py-5 text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                                                        {formatDate(acq.actual_delivery_date)}
                                                    </td>
                                                    <td className="px-4 py-5">
                                                        {getStatusBadge(isAwaitingDelivery(acq) ? 'awaiting_delivery' : acq.status)}
                                                    </td>
                                                    <td className="px-4 py-5">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <button
                                                                onClick={() => handleViewAcquisition(acq)}
                                                                className="p-2 text-emerald-600 rounded-lg transition-all hover:bg-gray-100"
                                                                title="Ver Detalhes"
                                                                aria-label={`Ver detalhes da aquisição ${getAcqPpReference(acq) || acq.quotation_request?.title || ''}`}
                                                            >
                                                                <Eye size={18} />
                                                            </button>
                                                            {isAwaitingDelivery(acq) ? (
                                                                <button
                                                                    onClick={() => handleConfirmDelivery(acq)}
                                                                    className="flex items-center gap-2 p-2 2xl:px-4 2xl:py-2 rounded-xl text-xs font-bold transition-all text-orange-700 hover:bg-orange-50 border border-orange-200 whitespace-nowrap"
                                                                    title="Confirmar Entrega"
                                                                    aria-label={`Confirmar entrega da aquisição ${getAcqPpReference(acq) || acq.quotation_request?.title || ''}`}
                                                                >
                                                                    <Truck size={16} />
                                                                    <span className="hidden 2xl:inline">Confirmar Entrega</span>
                                                                </button>
                                                            ) : (
                                                                <span className="text-xs font-semibold text-gray-400">Entregue</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead style={{ background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border-light)' }}>
                                        <tr>
                                            <SortableHeader label="ID" sortKey="id" sort={filters.sort} dir={filters.dir} onSort={onSort} className={thClass} style={thStyle} />
                                            <SortableHeader label={activeTab === 'atividades' ? 'Atividade / Referência' : 'Procedência'} sortKey="titulo" sort={filters.sort} dir={filters.dir} onSort={onSort} className={thClass} style={thStyle} />
                                            <SortableHeader label="Data de Submissão" sortKey="submissao" sort={filters.sort} dir={filters.dir} onSort={onSort} className={thClass} style={thStyle} />
                                            <SortableHeader label="Data Limite / Entrega" sortKey="prazo" sort={filters.sort} dir={filters.dir} onSort={onSort} className={thClass} style={thStyle} />
                                            <SortableHeader label="Estado" sortKey="estado" sort={filters.sort} dir={filters.dir} onSort={onSort} className={thClass} style={thStyle} />
                                            <th className="px-6 py-5 text-center text-[10px] font-black uppercase tracking-widest" style={thStyle}>Acções</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {isLoading ? (
                                            <DashboardTableSkeleton rows={5} columns={6} />
                                        ) : pagination.total === 0 ? (
                                            renderEmptyRow()
                                        ) : (
                                            pagination.pageItems.map((act) => (
                                                <tr key={act.id} className="transition-colors group cursor-pointer" onClick={() => openPedido(act.id)} onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'} style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                                                    <td className="px-6 py-6 text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>#{act.id}</td>
                                                    <td className="px-6 py-6 font-bold text-sm" style={{ color: 'var(--color-text-primary)' }}>
                                                        {act.title}
                                                        <div className="text-xs font-normal mt-1 space-y-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                                                            <div>Ref. PP: {getActivityPpRef(act) || '—'}</div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-6 text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                                                        {formatDate(act.created_at || act.submitted_at)}
                                                    </td>
                                                    <td className="px-6 py-6 text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                                                        {formatDate(act.deadline)}
                                                    </td>
                                                    <td className="px-6 py-6">
                                                        {getStatusBadge(getEffectiveStatus(act))}
                                                    </td>
                                                    <td className="px-6 py-6 font-medium">
                                                        <div className="flex items-center justify-center gap-2">
                                                            {(() => {
                                                                const actAcq = acquisitionByRequest.get(String(act.id));
                                                                return isAwaitingDelivery(actAcq) ? (
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleConfirmDelivery(actAcq, act.title);
                                                                        }}
                                                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all text-orange-700 hover:bg-orange-50 border border-orange-200 whitespace-nowrap"
                                                                        title="Confirmar entrega da aquisição"
                                                                    >
                                                                        <Truck size={14} />
                                                                        Confirmar entrega
                                                                    </button>
                                                                ) : null;
                                                            })()}
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    openPedido(act.id);
                                                                }}
                                                                className="p-2 text-emerald-600 rounded-lg transition-all hover:bg-gray-100"
                                                                title="Ver Detalhes"
                                                                aria-label={`Ver detalhes de ${act.title || `#${act.id}`}`}
                                                            >
                                                                <Eye size={18} />
                                                            </button>
                                                            <button
                                                                onClick={(e) => handleDeleteAtividade(e, act)}
                                                                className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                                title={isAdmin ? 'Eliminar' : 'Solicitar eliminação'}
                                                                aria-label={`Eliminar ${act.title || `#${act.id}`}`}
                                                            >
                                                                <Trash2 size={18} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {!isLoading && (
                            <Pagination
                                page={pagination.page}
                                totalPages={pagination.totalPages}
                                onPageChange={(page) => setFilter('page', page)}
                                total={pagination.total}
                                start={pagination.start}
                                end={pagination.end}
                                pageSize={filters.pageSize}
                                onPageSizeChange={(pageSize) => setFilter('pageSize', pageSize)}
                                pageSizeOptions={[10, 25, 50, 100]}
                            />
                        )}
                    </>
                )}
            </div>


            {/* Modals Section */}

            {/* Activity Registration — rendered via Portal to escape overflow stacking context */}
            {isActivityModalOpen && createPortal(
                <div key="activity-modal" className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center" style={{ zIndex: 9999 }}>
                    <div className="absolute inset-0" onClick={() => setIsActivityModalOpen(false)} />
                    <div className="relative rounded-2xl shadow-2xl w-full max-w-lg mx-4 animate-fadeIn max-h-[90vh] overflow-hidden flex flex-col" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border-light)' }}>
                        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--color-border-light)' }}>
                            <div>
                                <h2 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>Nova Atividade</h2>
                                <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>Estruturação de Processo de Compra</p>
                            </div>
                            <button
                                onClick={() => setIsActivityModalOpen(false)}
                                className="p-1.5 transition-colors"
                                style={{ color: 'var(--color-text-muted)', borderRadius: '4px' }}
                                onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="space-y-1.5">
                                <label className="block text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Título da Atividade</label>
                                <input
                                    type="text"
                                    value={activityName}
                                    onChange={(e) => setActivityName(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') handleCreateActivity(); }}
                                    placeholder="Ex: Reforço de Stock Sanitário Q1"
                                    className="input-field"
                                    autoFocus
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Referência PP</label>
                                <input
                                    type="text"
                                    value={activityReference}
                                    onChange={(e) => setActivityReference(e.target.value)}
                                    placeholder="Ex: REF-2026-001"
                                    className="input-field"
                                />
                            </div>

                          
                        </div>

                        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t" style={{ borderColor: 'var(--color-border-light)', background: 'var(--color-bg)' }}>
                            <button
                                onClick={() => { setIsActivityModalOpen(false); resetActivityForm(); }}
                                className="btn-secondary"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleCreateActivity}
                                disabled={!activityName.trim()}
                                className="btn-primary"
                            >
                                <FileText size={16} />
                                Pedir Cotação
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Pedido de cotação (invalida a cache e mostra o toast) */}
            <ModalPedirCotacao
                isOpen={isCotacaoModalOpen}
                onClose={() => {
                    setIsCotacaoModalOpen(false);
                    setCurrentActivityName("");
                    setCurrentActivityReference("");
                    resetActivityForm();
                }}
                activityName={currentActivityName}
                activityReference={currentActivityReference}
            />

            <ModalRevisarCotacao
                isOpen={isRevisarModalOpen}
                onClose={() => setIsRevisarModalOpen(false)}
                cotacao={selectedResponse}
                isAcquisition={isViewingAcquisition}
            />

            {/* Confirmação de entrega (tab Aquisições e actividades a aguardar entrega) */}
            <ModalConfirmarEntrega
                isOpen={!!deliveryTarget}
                acquisition={deliveryTarget?.acquisition}
                activityTitle={deliveryTarget?.title}
                onClose={() => setDeliveryTarget(null)}
            />

            {/* Respostas do pedido (?pedido=ID). As acções invalidam a cache no próprio modal. */}
            <ModalRespostasPedido
                isOpen={!!pedidoId}
                onClose={closePedido}
                quotationRequestId={pedidoId}
                quotationRequestTitle={selectedActivity?.title}
                isConcluded={isSelectedConcluded}
                onOpenRevisarModal={(resposta) => handleOpenDetails(resposta)}
            />

            <ModalSolicitarEliminacao
                isOpen={!!itemToDelete}
                onClose={() => setItemToDelete(null)}
                onSubmit={confirmSolicitarEliminacao}
                itemName={itemToDelete?.name}
                itemTypeLabel={itemToDelete?.label}
            />
        </div>
    );
}
