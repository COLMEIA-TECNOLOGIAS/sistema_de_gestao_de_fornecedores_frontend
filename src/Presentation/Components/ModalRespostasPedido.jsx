import { useModalLock } from '../../hooks/useModalLock';
import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { useQuery } from "@tanstack/react-query";
import { X, MoreVertical, FileText, Trash2, CheckCircle, MessageSquare, RefreshCw, Truck, PackageCheck } from "lucide-react";
import { quotationResponsesAPI, quotationRequestsAPI } from "../../services/api";
import { useQuotationResponses, useSuppliers, useInvalidate } from "../../hooks/queries";
import { queryKeys } from "../../lib/queryKeys";
import { useToast } from "../../context/ToastContext";
import { useConfirm } from "../../context/ConfirmContext";
import { getErrorMessage, unwrap } from "../../utils/apiHelpers";
import RefreshButton from "./ui/RefreshButton";
import { ErrorState, StaleDataBanner } from "./ui/StateViews";
import ModalGerarAquisicao from "./ModalGerarAquisicao";
import ModalSolicitarRevisao from "./ModalSolicitarRevisao";
import ModalConfirmarEntrega from "./ModalConfirmarEntrega";
import { getAcquisitionReference, isAwaitingDelivery, getDeliveryDeadlineInfo, DEADLINE_TONE_CLASSES } from "../../utils/acquisitions";

// Linhas de carregamento com as mesmas 8 colunas da tabela de respostas
const RespostasTableSkeleton = ({ rows = 3 }) => (
    <>
        {Array.from({ length: rows }).map((_, rowIdx) => (
            <tr key={rowIdx} className="border-b border-gray-100">
                <td className="px-6 py-6"><div className="h-4 w-4 bg-gray-200 rounded animate-pulse" /></td>
                <td className="px-6 py-6"><div className="h-4 w-10 bg-gray-200 rounded animate-pulse" /></td>
                <td className="px-6 py-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gray-200 animate-pulse" />
                        <div className="space-y-2">
                            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                            <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
                        </div>
                    </div>
                </td>
                <td className="px-6 py-6"><div className="h-4 w-16 bg-gray-200 rounded animate-pulse" /></td>
                <td className="px-6 py-6"><div className="h-4 w-20 bg-gray-200 rounded animate-pulse" /></td>
                <td className="px-6 py-6"><div className="h-4 w-20 bg-gray-200 rounded animate-pulse" /></td>
                <td className="px-6 py-6"><div className="h-8 w-24 bg-gray-200 rounded-xl animate-pulse" /></td>
                <td className="px-6 py-6"><div className="h-8 w-8 mx-auto bg-gray-200 rounded-lg animate-pulse" /></td>
            </tr>
        ))}
    </>
);

const getSupplierName = (supplier) =>
    supplier?.company_name || supplier?.commercial_name || supplier?.legal_name || supplier?.name || '';

const STATUS_COLORS = {
    "draft": "bg-gray-100 text-gray-700",
    "submitted": "bg-blue-100 text-blue-700",
    "pending": "bg-yellow-100 text-yellow-700",
    "pending_review": "bg-yellow-100 text-yellow-700",
    "in_review": "bg-amber-100 text-amber-700",
    "approved": "bg-green-100 text-green-700",
    "rejected": "bg-red-100 text-red-700",
    "revision_requested": "bg-amber-100 text-amber-700",
    "needs_revision": "bg-gray-100 text-gray-700",
    "published": "bg-blue-100 text-blue-700",
    "sent": "bg-blue-100 text-blue-700",
    "open": "bg-blue-100 text-blue-700",
    "active": "bg-blue-100 text-blue-700",
    "in_progress": "bg-blue-100 text-blue-700",
    "completed": "bg-green-100 text-green-700",
    "cancelled": "bg-red-100 text-red-700",
    "delivered": "bg-green-100 text-green-700",
    "nao_aprovada": "bg-gray-100 text-gray-500",
};

const STATUS_LABELS = {
    'draft': 'Rascunho',
    'pending': 'Pendente',
    'submitted': 'Submetida',
    'pending_review': 'Em Análise',
    'in_review': 'Em Revisão',
    'approved': 'Aprovada',
    'rejected': 'Rejeitada',
    'revision_requested': 'Revisão Solicitada',
    'needs_revision': 'A Aguardar Revisão',
    'published': 'Publicada',
    'sent': 'Enviada',
    'open': 'Em Curso',
    'active': 'Ativa',
    'in_progress': 'Em Progresso',
    'completed': 'Concluída',
    'cancelled': 'Cancelada',
    'delivered': 'Entregue',
    'nao_aprovada': 'Não Aprovada',
};

const getStatusColor = (status) => STATUS_COLORS[status] || "bg-gray-100 text-gray-700";
const getStatusLabel = (status) => STATUS_LABELS[status] || 'Desconhecido';

const getRequestIdOf = (r) => r.quotation_request_id ?? r.quotation_supplier?.quotation_request_id ?? r.quotation_request?.id;

// Estados em que a proposta ainda pode ser decidida (aprovar / pedir revisão)
const OPEN_STATUSES = ['pending_review', 'submitted', 'negotiating'];
const isOpenStatus = (status) => OPEN_STATUSES.includes(status);

// Ordem das versões de uma proposta: a revisão mais recente primeiro
const byLatest = (a, b) =>
    (Number(b.revision_number) || 0) - (Number(a.revision_number) || 0) || (Number(b.id) || 0) - (Number(a.id) || 0);

const isAcquisitionGenerated = (resposta) =>
    resposta?.has_acquisition || resposta?.acquisition || resposta?.acquisition_id ||
    resposta?.status === 'completed' || resposta?.status === 'delivered';

/**
 * Junta os fornecedores convidados com as respostas recebidas
 * (fornecedores sem resposta aparecem como "Pendente").
 */
function buildRespostas(requestData, responses, allSuppliers, quotationRequestId) {
    if (!requestData) return { request: null, respostas: [] };

    // Garante que só são consideradas respostas deste pedido (caso o backend ignore o filtro)
    const responsesData = responses.filter(r => {
        const reqId = getRequestIdOf(r);
        return reqId == null || String(reqId) === String(quotationRequestId);
    });

    const rawSuppliers = requestData.suppliers || [];
    const invitedSuppliers = rawSuppliers.map(s => {
        if (typeof s === 'object' && s !== null) {
            return s.supplier || allSuppliers.find(f => f.id === s.supplier_id || f.id === s.id) || s;
        }
        return allSuppliers.find(f => f.id === s) || { id: s };
    });

    const respostas = invitedSuppliers.map(supplier => {
        // Cada revisão do fornecedor é uma resposta nova: mostrar sempre a mais recente
        const supplierResponses = responsesData
            .filter(r => (r.quotation_supplier?.supplier_id ?? r.supplier_id) === supplier.id)
            .sort(byLatest);
        const [latestResponse, ...previousVersions] = supplierResponses;

        if (latestResponse) {
            return { ...latestResponse, supplier, is_placeholder: false, previous_versions: previousVersions };
        }

        // Ainda sem resposta: linha "pendente" a partir do fornecedor convidado
        return {
            id: `pending-${supplier.id}`,
            status: 'pending',
            supplier,
            total_amount: null,
            delivery_days: null,
            submitted_at: null,
            is_placeholder: true,
            quotation_supplier: { supplier, quotation_request: requestData },
        };
    });

    // Respostas recebidas primeiro, pendentes no fim
    respostas.sort((a, b) => {
        if (a.status === 'pending' && b.status !== 'pending') return 1;
        if (a.status !== 'pending' && b.status === 'pending') return -1;
        return 0;
    });

    return { request: { ...requestData, suppliers: invitedSuppliers }, respostas };
}

/**
 * Respostas de um pedido de cotação. As acções (aprovar, rejeitar, solicitar revisão,
 * gerar aquisição) são executadas aqui e invalidam a cache; os callbacks `onAprovar`,
 * `onRejeitar`, `onSolicitarRevisao` e `onGerarAquisicao` são opcionais e chamados após sucesso.
 */
export default function ModalRespostasPedido({
    isOpen,
    onClose,
    quotationRequestId,
    quotationRequestTitle,
    onOpenRevisarModal,
    onAprovar,
    onRejeitar,
    onSolicitarRevisao,
    onSolicitarRevisaoError,
    onGerarAquisicao,
    isConcluded: isConcludedProp = false
}) {
    const toast = useToast();
    const confirm = useConfirm();
    const invalidate = useInvalidate();

    const [openMenuId, setOpenMenuId] = useState(null);
    // Posição do menu de acções (portal, para não ser cortado pelo overflow da tabela)
    const [menuPosition, setMenuPosition] = useState(null);

    const toggleMenu = (id, button) => {
        if (openMenuId === id) {
            setOpenMenuId(null);
            return;
        }
        const rect = button.getBoundingClientRect();
        const MENU_HEIGHT = 230;
        const openUp = rect.bottom + MENU_HEIGHT > window.innerHeight && rect.top > MENU_HEIGHT;
        setMenuPosition({
            right: Math.max(8, window.innerWidth - rect.right),
            ...(openUp ? { bottom: window.innerHeight - rect.top + 8 } : { top: rect.bottom + 8 }),
        });
        setOpenMenuId(id);
    };
    // { resposta, mode: 'approve' | 'acquisition' }
    const [decisionTarget, setDecisionTarget] = useState(null);
    const [isSubmittingDecision, setIsSubmittingDecision] = useState(false);
    const [revisaoTarget, setRevisaoTarget] = useState(null);
    const [isSubmittingRevisao, setIsSubmittingRevisao] = useState(false);
    const [deliveryTarget, setDeliveryTarget] = useState(null);

    const enabled = !!isOpen && quotationRequestId != null;

    const requestQuery = useQuery({
        queryKey: queryKeys.quotationRequests.detail(quotationRequestId),
        queryFn: async () => unwrap(await quotationRequestsAPI.getById(quotationRequestId)) || {},
        enabled,
    });
    const responsesQuery = useQuotationResponses({ quotation_request_id: quotationRequestId }, { enabled });
    const suppliersQuery = useSuppliers({ enabled });

    const { request: requestDetails, respostas } = useMemo(
        () => buildRespostas(requestQuery.data, responsesQuery.data ?? [], suppliersQuery.data ?? [], quotationRequestId),
        [requestQuery.data, responsesQuery.data, suppliersQuery.data, quotationRequestId]
    );

    const isLoading = enabled && (requestQuery.isLoading || responsesQuery.isLoading);
    const isFetching = requestQuery.isFetching || responsesQuery.isFetching || suppliersQuery.isFetching;
    const loadError = requestQuery.error || responsesQuery.error;
    const hasData = !!requestQuery.data;
    const dataUpdatedAt = Math.max(requestQuery.dataUpdatedAt || 0, responsesQuery.dataUpdatedAt || 0) || undefined;

    const refetchAll = () => Promise.all([requestQuery.refetch(), responsesQuery.refetch(), suppliersQuery.refetch()]);

    // Fechar o menu ao fechar o modal ou mudar de pedido
    useEffect(() => {
        setOpenMenuId(null);
    }, [isOpen, quotationRequestId]);

    // Menu fixo: fechar ao fazer scroll ou redimensionar (a posição deixaria de estar certa)
    useEffect(() => {
        if (!openMenuId) return;
        const close = () => setOpenMenuId(null);
        window.addEventListener('resize', close);
        window.addEventListener('scroll', close, true);
        return () => {
            window.removeEventListener('resize', close);
            window.removeEventListener('scroll', close, true);
        };
    }, [openMenuId]);

    // Close dropdown menu when clicking outside
    useEffect(() => {
        if (!openMenuId) return;
        const handleClickOutside = (event) => {
            if (!event.target.closest('.dropdown-menu')) setOpenMenuId(null);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [openMenuId]);

    useModalLock(isOpen);
    if (!isOpen) return null;

    const hasApproved = respostas.some(r => r.status === 'approved');
    // Pedido encerrado (aquisição gerada/concluído/cancelado): já não há decisões a tomar
    const isConcluded = isConcludedProp || ['completed', 'cancelled'].includes(requestDetails?.status);
    // Proposta vencedora e a respectiva aquisição (vem na resposta da API)
    const winner = respostas.find(r => r.status === 'approved' && r.acquisition);
    const winnerAcquisition = winner
        ? { ...winner.acquisition, supplier: winner.acquisition.supplier || winner.supplier }
        : null;
    const getDisplayStatus = (resposta) =>
        hasApproved && resposta.status !== 'approved' ? 'nao_aprovada' : resposta.status;
    const isDimmed = (resposta) =>
        (resposta.is_placeholder) || (hasApproved && resposta.status !== 'approved');

    // Aprovar/rejeitar/revisão alteram respostas, o pedido e o painel
    const refreshAfterResponseChange = () =>
        invalidate(queryKeys.quotationResponses.all, queryKeys.quotationRequests.all, queryKeys.dashboard.all);

    // Aprovar = gerar aquisição (formulário com data de entrega e justificação)
    const handleOpenAprovacaoModal = (resposta) => {
        setOpenMenuId(null);
        setDecisionTarget({ resposta, mode: 'approve' });
    };

    // Compatibilidade: propostas aprovadas antes do fluxo unificado ainda sem aquisição
    const handleGerarAquisicao = (resposta) => {
        if (isAcquisitionGenerated(resposta)) return;
        setOpenMenuId(null);
        setDecisionTarget({ resposta, mode: 'acquisition' });
    };

    const confirmDecision = async ({ expected_delivery_date, justification, notes }) => {
        if (!decisionTarget || isSubmittingDecision) return;
        const { resposta: target, mode } = decisionTarget;
        setIsSubmittingDecision(true);
        try {
            if (mode === 'approve') {
                const result = await quotationResponsesAPI.approve(target.id, { expected_delivery_date, justification, notes });
                const rejectedCount = result?.rejected_response_ids?.length || 0;
                toast.success(rejectedCount > 0
                    ? `Proposta aprovada e aquisição gerada. ${rejectedCount === 1 ? 'A outra proposta foi rejeitada' : `As outras ${rejectedCount} propostas foram rejeitadas`}.`
                    : 'Proposta aprovada e aquisição gerada com sucesso!');
                onAprovar?.(target);
            } else {
                await quotationResponsesAPI.createAcquisition(target.id, expected_delivery_date, justification);
                toast.success('Aquisição gerada com sucesso!');
            }
            setDecisionTarget(null);
            invalidate(
                queryKeys.acquisitions.all,
                queryKeys.quotationResponses.all,
                queryKeys.quotationRequests.all,
                queryKeys.dashboard.all,
                queryKeys.reports.all,
                queryKeys.notifications.all
            );
            onGerarAquisicao?.(target, expected_delivery_date, justification);
        } catch (err) {
            toast.error(getErrorMessage(err, mode === 'approve' ? 'Erro ao aprovar a proposta.' : 'Erro ao gerar a aquisição.'));
            // Estado pode ter mudado entretanto (ex.: outra pessoa aprovou): recarregar
            if (err?.response?.status === 422) refetchAll();
        } finally {
            setIsSubmittingDecision(false);
        }
    };

    const handleOpenRejeicaoModal = async (resposta) => {
        setOpenMenuId(null);
        const confirmed = await confirm({
            title: "Rejeitar Proposta",
            message: (
                <p className="text-sm text-gray-600">
                    Pretende rejeitar a proposta de <strong>{getSupplierName(resposta.supplier) || 'Fornecedor'}</strong>?
                </p>
            ),
            confirmLabel: "Sim, Rejeitar",
            runningLabel: "A rejeitar...",
            variant: "danger",
            onConfirm: () => quotationResponsesAPI.reject(resposta.id),
            getErrorMessage: (err) => getErrorMessage(err, "Erro ao rejeitar proposta."),
        });
        if (!confirmed) return;
        toast.success("Proposta rejeitada.");
        await refreshAfterResponseChange();
        onRejeitar?.(resposta);
    };

    const handleSolicitarRevisao = (resposta) => {
        setOpenMenuId(null);
        setRevisaoTarget(resposta);
    };

    const confirmSolicitarRevisao = async ({ reason, message }) => {
        if (!revisaoTarget || isSubmittingRevisao) return;
        const target = revisaoTarget;
        setIsSubmittingRevisao(true);
        try {
            const idToReview = target.quotation_response_id || target.id;
            await quotationResponsesAPI.requestRevision(idToReview, reason, message);
            toast.success("Revisão solicitada com sucesso!");
            setRevisaoTarget(null);
            refreshAfterResponseChange();
            onSolicitarRevisao?.(target);
        } catch (err) {
            const errorMsg = getErrorMessage(err, 'Erro ao solicitar revisão. Verifique se o servidor permite esta acção para o estado actual da proposta.');
            toast.error(errorMsg);
            onSolicitarRevisaoError?.(errorMsg);
        } finally {
            setIsSubmittingRevisao(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                            Respostas de Cotação
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">
                            {quotationRequestTitle || `Pedido #${quotationRequestId}`}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {hasData && (
                            <RefreshButton onClick={refetchAll} isFetching={isFetching} updatedAt={dataUpdatedAt} />
                        )}
                        <button
                            onClick={onClose}
                            aria-label="Fechar"
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <X size={24} className="text-gray-600" />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-auto p-6">
                    {loadError && hasData && (
                        <div className="mb-4">
                            <StaleDataBanner onRetry={refetchAll} isRetrying={isFetching} />
                        </div>
                    )}

                    {loadError && !hasData && !isLoading ? (
                        <ErrorState message={getErrorMessage(loadError, 'Erro ao carregar dados do pedido.')} onRetry={refetchAll} isRetrying={isFetching} />
                    ) : (
                    <>

                    {/* Request Details */}
                    {requestDetails && (
                        <div className="mb-6 p-5 rounded-xl" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                    <span className="font-semibold block" style={{ color: 'var(--color-text-primary)' }}>Referência</span>
                                    <span className="block" style={{ color: 'var(--color-text-secondary)' }}>
                                        Ref. PP: {requestDetails.reference || requestDetails.activity_description || '—'}
                                    </span>
                                    <span className="block" style={{ color: 'var(--color-text-secondary)' }}>
                                        Ref. Sistema: {(requestDetails.reference_number && requestDetails.reference_number !== (requestDetails.reference || requestDetails.activity_description))
                                            ? requestDetails.reference_number
                                            : (requestDetails.id != null ? `CT-${String(requestDetails.id).padStart(3, '0')}` : '—')}
                                    </span>
                                </div>
                                <div>
                                    <span className="font-semibold block" style={{ color: 'var(--color-text-primary)' }}>Título da Atividade</span>
                                    <span style={{ color: 'var(--color-text-secondary)' }}>{requestDetails.title || quotationRequestTitle || '-'}</span>
                                </div>
                                <div>
                                    <span className="font-semibold block" style={{ color: 'var(--color-text-primary)' }}>Data Limite</span>
                                    <span style={{ color: 'var(--color-text-secondary)' }}>{requestDetails.deadline ? new Date(requestDetails.deadline).toLocaleDateString('pt-AO') : 'N/A'}</span>
                                </div>
                                <div>
                                    <span className="font-semibold block" style={{ color: 'var(--color-text-primary)' }}>Data de Submissão</span>
                                    <span style={{ color: 'var(--color-text-secondary)' }}>
                                        {requestDetails.submitted_at || requestDetails.created_at ? new Date(requestDetails.submitted_at || requestDetails.created_at).toLocaleDateString('pt-AO') : 'N/A'}
                                    </span>
                                </div>
                            </div>
                            {requestDetails.description && (
                                <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--color-border-light)' }}>
                                    <span className="font-semibold block text-sm" style={{ color: 'var(--color-text-primary)' }}>Corpo da Mensagem</span>
                                    <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>{requestDetails.description}</p>
                                </div>
                            )}
                            {requestDetails.items && requestDetails.items.length > 0 && (
                                <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--color-border-light)' }}>
                                    <span className="font-semibold block text-sm mb-2" style={{ color: 'var(--color-text-primary)' }}>Itens Solicitados</span>
                                    <div className="flex flex-wrap gap-2">
                                        {requestDetails.items.map((item, idx) => (
                                            <span key={idx} className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium" style={{ background: 'rgba(68,177,111,0.1)', color: '#44B16F' }}>
                                                {item.name} {item.quantity ? `(${item.quantity} ${item.unit || 'un'})` : ''}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {requestDetails.suppliers && requestDetails.suppliers.length > 0 && (
                                <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--color-border-light)' }}>
                                    <span className="font-semibold block text-sm mb-2" style={{ color: 'var(--color-text-primary)' }}>Fornecedores Selecionados</span>
                                    <div className="flex flex-wrap gap-2">
                                        {requestDetails.suppliers.map((s, idx) => (
                                            <span key={s.id || idx} className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>
                                                {s.company_name || s.commercial_name || s.legal_name || s.name || `#${s.id}`}
                                                {s.email && <span className="opacity-70">({s.email})</span>}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {winnerAcquisition && (() => {
                        const awaiting = isAwaitingDelivery(winnerAcquisition);
                        const deadline = getDeliveryDeadlineInfo(winnerAcquisition);
                        return (
                            <div className={`mb-6 rounded-xl border p-4 flex flex-wrap items-center justify-between gap-4 ${awaiting ? 'bg-orange-50/60 border-orange-200' : 'bg-green-50 border-green-200'}`}>
                                <div className="flex items-start gap-3">
                                    <div className={`p-2 rounded-lg ${awaiting ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
                                        {awaiting ? <Truck size={20} /> : <PackageCheck size={20} />}
                                    </div>
                                    <div className="text-sm">
                                        <p className="font-bold text-gray-900">
                                            Aquisição {getAcquisitionReference(winnerAcquisition)} · {getSupplierName(winner.supplier) || 'Fornecedor'}
                                        </p>
                                        {awaiting ? (
                                            <p className="text-gray-600 mt-0.5 flex flex-wrap items-center gap-2">
                                                A aguardar entrega
                                                {winnerAcquisition.expected_delivery_date && ` · prevista para ${new Date(`${String(winnerAcquisition.expected_delivery_date).slice(0, 10)}T00:00:00`).toLocaleDateString('pt-PT')}`}
                                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${DEADLINE_TONE_CLASSES[deadline.tone]}`}>{deadline.label}</span>
                                            </p>
                                        ) : (
                                            <p className="text-green-700 mt-0.5">
                                                Entregue{winnerAcquisition.actual_delivery_date && ` em ${new Date(`${String(winnerAcquisition.actual_delivery_date).slice(0, 10)}T00:00:00`).toLocaleDateString('pt-PT')}`}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                {awaiting && (
                                    <button
                                        onClick={() => setDeliveryTarget(winnerAcquisition)}
                                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white bg-[#44B16F] hover:bg-[#3a9d5f] transition-colors"
                                    >
                                        <Truck size={16} />
                                        Confirmar entrega
                                    </button>
                                )}
                            </div>
                        );
                    })()}

                    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4 text-left">
                                            <input type="checkbox" className="rounded border-gray-300" />
                                        </th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">ID</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Fornecedor</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Prazo Entrega</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Data Entrega</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Data Resposta</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Estado</th>
                                        <th className="px-6 py-4 text-center text-sm font-semibold text-gray-600">Acções</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {isLoading ? (
                                        <RespostasTableSkeleton rows={3} />
                                    ) : respostas.length === 0 ? (
                                        <tr>
                                            <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                                                <div className="flex flex-col items-center gap-2">
                                                    <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                                    </svg>
                                                    <p className="text-lg font-medium">Nenhuma resposta encontrada</p>
                                                    <p className="text-sm">Este pedido ainda não recebeu respostas dos fornecedores</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        respostas.map((resposta) => (
                                            <tr key={resposta.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${isDimmed(resposta) ? 'opacity-70' : ''}`}>
                                                <td className="px-6 py-6">
                                                    <input type="checkbox" className="rounded border-gray-300" disabled={isDimmed(resposta)} />
                                                </td>
                                                <td className="px-6 py-6">
                                                    <span className="font-medium text-gray-700">
                                                        {resposta.supplier?.id != null ? `#${resposta.supplier.id}` : '---'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="relative">
                                                            <img
                                                                src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(getSupplierName(resposta.supplier) || 'N/A')}`}
                                                                alt={getSupplierName(resposta.supplier) || 'Fornecedor'}
                                                                className="w-10 h-10 rounded-xl shadow-sm border border-gray-100"
                                                            />
                                                            {resposta.is_placeholder && (
                                                                <div className="absolute -top-1 -right-1 bg-yellow-400 border-2 border-white w-4 h-4 rounded-full flex items-center justify-center" title="A aguardar resposta">
                                                                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="font-semibold text-gray-900">
                                                                {resposta.supplier?.company_name || 
                                                                    resposta.supplier?.commercial_name ||
                                                                    resposta.supplier?.legal_name ||
                                                                    'Fornecedor N/A'}
                                                            </span>
                                                            <span className="text-xs text-gray-500">
                                                                {resposta.supplier?.email || 'Sem email'}
                                                            </span>
                                                            {resposta.revision_number > 1 && (
                                                                <span
                                                                    className="mt-1 inline-flex w-fit items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700"
                                                                    title={`${resposta.previous_versions?.length || 0} versão(ões) anterior(es)`}
                                                                >
                                                                    Revisão n.º {resposta.revision_number}
                                                                    {isOpenStatus(resposta.status) && ' · nova'}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-6 text-gray-700">
                                                    {resposta.is_placeholder ? (
                                                        <span className="text-gray-400">---</span>
                                                    ) : (
                                                        <div className="flex items-center gap-2">
                                                            <RefreshCw size={14} className="text-gray-400" />
                                                            <span>{resposta.delivery_days ? `${resposta.delivery_days} dias` : 'N/A'}</span>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-6 text-gray-700">
                                                    {resposta.is_placeholder ? (
                                                        <span className="text-gray-400">---</span>
                                                    ) : resposta.delivery_date || resposta.expected_delivery_date ? (
                                                        <span className="text-sm">
                                                            {new Date(resposta.delivery_date || resposta.expected_delivery_date).toLocaleDateString('pt-AO', {
                                                                day: '2-digit',
                                                                month: '2-digit',
                                                                year: 'numeric'
                                                            })}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-400">N/A</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-6 text-gray-700">
                                                    {resposta.is_placeholder ? (
                                                        <span className="text-gray-400">---</span>
                                                    ) : (
                                                        <span className="text-sm">
                                                            {resposta.submitted_at || resposta.created_at ? new Date(resposta.submitted_at || resposta.created_at).toLocaleDateString('pt-AO', {
                                                                day: '2-digit',
                                                                month: '2-digit',
                                                                year: 'numeric'
                                                            }) : 'N/A'}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-6">
                                                    <span className={`px-4 py-2 rounded-xl text-sm font-semibold inline-flex items-center gap-2 ${getStatusColor(getDisplayStatus(resposta))}`}>
                                                        {getStatusLabel(getDisplayStatus(resposta))}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-6">
                                                    <div className="relative flex justify-center dropdown-menu">
                                                        {!isDimmed(resposta) && (
                                                            <>
                                                                <button
                                                                    onClick={(e) => toggleMenu(`resp-${resposta.id}`, e.currentTarget)}
                                                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                                                    aria-haspopup="menu"
                                                                    aria-expanded={openMenuId === `resp-${resposta.id}`}
                                                                    aria-label="Acções da proposta"
                                                                >
                                                                    <MoreVertical size={20} className="text-gray-600" />
                                                                </button>

                                                                {openMenuId === `resp-${resposta.id}` && menuPosition && createPortal(
                                                                    <div
                                                                        role="menu"
                                                                        className="dropdown-menu fixed w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2"
                                                                        style={{ ...menuPosition, zIndex: 10001 }}
                                                                    >
                                                                        {/* Revisar */}
                                                                        <button
                                                                            onClick={() => {
                                                                                onOpenRevisarModal(resposta);
                                                                                setOpenMenuId(null);
                                                                                onClose();
                                                                            }}
                                                                            className="w-full px-4 py-2.5 text-left hover:bg-gray-50 text-sm flex items-center gap-3 transition-colors"
                                                                        >
                                                                            <FileText size={16} className="text-gray-400" />
                                                                            <span className="text-gray-700">Revisar Detalhes</span>
                                                                        </button>

                                                                        {!isConcluded && !isAcquisitionGenerated(resposta) && resposta.status !== 'rejected' && (
                                                                            <>
                                                                                {resposta.status === 'needs_revision' && (
                                                                                    <p className="px-4 py-2 text-xs text-gray-500">
                                                                                        A aguardar a revisão do fornecedor.
                                                                                    </p>
                                                                                )}

                                                                                {resposta.status !== 'approved' && (
                                                                                    <>
                                                                                        {/* Aprovar proposta (= gerar aquisição) */}
                                                                                        {isOpenStatus(resposta.status) && (
                                                                                        <button
                                                                                            onClick={() => handleOpenAprovacaoModal(resposta)}
                                                                                            className="w-full px-4 py-2.5 text-left hover:bg-gray-50 text-sm flex items-center gap-3 transition-colors text-emerald-600 font-medium"
                                                                                        >
                                                                                            <CheckCircle size={16} className="text-emerald-500" />
                                                                                            <span>Aprovar Proposta</span>
                                                                                        </button>
                                                                                        )}

                                                                                        {/* Rejeitar proposta */}
                                                                                        <button
                                                                                            onClick={() => handleOpenRejeicaoModal(resposta)}
                                                                                            className="w-full px-4 py-2.5 text-left hover:bg-gray-50 text-sm flex items-center gap-3 transition-colors text-red-600"
                                                                                        >
                                                                                            <Trash2 size={16} className="text-red-400" />
                                                                                            <span>Rejeitar Proposta</span>
                                                                                        </button>
                                                                                    </>
                                                                                )}

                                                                                {/* Solicitar Revisão — só para propostas em análise */}
                                                                                {isOpenStatus(resposta.status) && (
                                                                                    <button
                                                                                        onClick={() => handleSolicitarRevisao(resposta)}
                                                                                        className="w-full px-4 py-2.5 text-left hover:bg-gray-50 text-sm flex items-center gap-3 transition-colors"
                                                                                    >
                                                                                        <MessageSquare size={16} className="text-gray-400" />
                                                                                        <span className="text-gray-700">Solicitar Revisão</span>
                                                                                    </button>
                                                                                )}

                                                                                {/* Gerar aquisição — propostas aprovadas antes do fluxo unificado */}
                                                                                {resposta.status === 'approved' && (
                                                                                    <button
                                                                                        onClick={() => handleGerarAquisicao(resposta)}
                                                                                        className="w-full px-4 py-2.5 text-left hover:bg-blue-50 text-sm flex items-center gap-3 transition-colors text-blue-600 font-medium"
                                                                                    >
                                                                                        <RefreshCw size={16} className="text-blue-500" />
                                                                                        <span>Gerar Aquisição</span>
                                                                                    </button>
                                                                                )}
                                                                            </>
                                                                        )}
                                                                    </div>,
                                                                    document.body
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    </>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    >
                        Fechar
                    </button>
                </div>
            </div>

            <ModalConfirmarEntrega
                isOpen={!!deliveryTarget}
                acquisition={deliveryTarget}
                activityTitle={requestDetails?.title || quotationRequestTitle}
                onClose={() => setDeliveryTarget(null)}
            />

            <ModalGerarAquisicao
                isOpen={!!decisionTarget}
                onClose={() => !isSubmittingDecision && setDecisionTarget(null)}
                onSubmit={confirmDecision}
                isLoading={isSubmittingDecision}
                response={decisionTarget?.resposta}
                mode={decisionTarget?.mode}
                openCompetitors={decisionTarget
                    ? respostas.filter(r => !r.is_placeholder && r.id !== decisionTarget.resposta.id
                        && (isOpenStatus(r.status) || r.status === 'needs_revision')).length
                    : 0}
            />

            <ModalSolicitarRevisao
                isOpen={!!revisaoTarget}
                onClose={() => !isSubmittingRevisao && setRevisaoTarget(null)}
                onSubmit={confirmSolicitarRevisao}
                isLoading={isSubmittingRevisao}
            />
        </div>
    );
}
