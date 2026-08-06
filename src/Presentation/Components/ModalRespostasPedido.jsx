import { useModalLock } from '../../hooks/useModalLock';
import { useState, useEffect, useRef } from "react";
import { X, MoreVertical, FileText, Trash2, CheckCircle, MessageSquare, RefreshCw, Loader2 } from "lucide-react";
import { quotationResponsesAPI, quotationRequestsAPI, suppliersAPI } from "../../services/api";
import FornecedorTableSkeleton from "./FornecedorTableSkeleton";
import ModalGerarAquisicao from "./ModalGerarAquisicao";
import ModalSolicitarRevisao from "./ModalSolicitarRevisao";

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
    onGerarAquisicao
}) {
    const [respostas, setRespostas] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [openMenuId, setOpenMenuId] = useState(null);
    const [requestDetails, setRequestDetails] = useState(null);
    const [approvalTarget, setApprovalTarget] = useState(null);
    const [isApproving, setIsApproving] = useState(false);
    const [gerarAquisicaoTarget, setGerarAquisicaoTarget] = useState(null);
    const [isGerarAquisicao, setIsGerarAquisicao] = useState(false);
    const [revisaoTarget, setRevisaoTarget] = useState(null);
    const [isSubmittingRevisao, setIsSubmittingRevisao] = useState(false);

    const fetchIdRef = useRef(0);

    // Fetch responses when modal opens or quotation request changes
    useEffect(() => {
        if (isOpen && quotationRequestId) {
            fetchData();
        }
    }, [isOpen, quotationRequestId]);

    const fetchData = async () => {
        const fetchId = ++fetchIdRef.current;
        try {
            setIsLoading(true);
            setError(null);

            // Fetch the quotation request, responses, and suppliers simultaneously
            const [requestResponse, responsesResponse, suppliersResponse] = await Promise.all([
                quotationRequestsAPI.getById(quotationRequestId).catch(err => { throw err; }),
                quotationResponsesAPI.getAll({ quotation_request_id: quotationRequestId }).catch(() => ({ data: [] })),
                suppliersAPI.getAll().catch(() => ({ data: [] }))
            ]);

            if (fetchIdRef.current !== fetchId) return;

            const requestData = requestResponse.data || requestResponse;
            setRequestDetails(requestData);
            
            const responsesData = responsesResponse.data || [];
            const allSuppliers = Array.isArray(suppliersResponse) ? suppliersResponse : (suppliersResponse?.data || []);

            // Merge: For each supplier invited, find their response
            const rawSuppliers = requestData.suppliers || [];
            const invitedSuppliers = rawSuppliers.map(s => {
                if (typeof s === 'object' && s !== null) {
                    return s.supplier || allSuppliers.find(f => f.id === s.supplier_id || f.id === s.id) || s;
                }
                return allSuppliers.find(f => f.id === s) || { id: s };
            });

            // Re-assign correctly hydrated suppliers to requestDetails so they show up properly in the modal header
            requestData.suppliers = invitedSuppliers;
            setRequestDetails({ ...requestData });

            const mergedRespostas = invitedSuppliers.map(supplier => {
                // Find if this supplier has a response for this request
                // In Laravel model, the pivot might contain the status if not yet responded
                const existingResponse = responsesData.find(r =>
                    (r.quotation_supplier?.supplier_id === supplier.id) ||
                    (r.supplier_id === supplier.id)
                );

                if (existingResponse) {
                    return {
                        ...existingResponse,
                        supplier: supplier, // Ensure supplier info is available
                        is_placeholder: false
                    };
                }

                // If no response yet, create a placeholder from the invited supplier
                return {
                    id: `pending-${supplier.id}`,
                    status: 'pending',
                    supplier: supplier,
                    total_amount: null,
                    delivery_days: null,
                    submitted_at: null,
                    is_placeholder: true,
                    quotation_supplier: {
                        supplier: supplier,
                        quotation_request: requestData
                    }
                };
            });

            // Sort: submitted/approved first, then pending
            mergedRespostas.sort((a, b) => {
                if (a.status === 'pending' && b.status !== 'pending') return 1;
                if (a.status !== 'pending' && b.status === 'pending') return -1;
                return 0;
            });

            setRespostas(mergedRespostas);
        } catch (err) {
            console.error('Error fetching data:', err);
            setError(err.message || 'Erro ao carregar dados do pedido');
        } finally {
            setIsLoading(false);
        }
    };

    // Close dropdown menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (openMenuId && !event.target.closest('.dropdown-menu')) {
                setOpenMenuId(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [openMenuId]);

    const getStatusColor = (status) => {
        const statusColors = {
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
        return statusColors[status] || "bg-gray-100 text-gray-700";
    };

    const getStatusLabel = (status) => {
        const labels = {
            'draft': 'Rascunho',
            'pending': 'Pendente',
            'submitted': 'Submetida',
            'pending_review': 'Pendente',
            'in_review': 'Em Revisão',
            'approved': 'Aprovada',
            'rejected': 'Rejeitada',
            'revision_requested': 'Revisão Solicitada',
            'needs_revision': 'Revisão Necessária',
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
        return labels[status] || 'Desconhecido';
    };

    useModalLock(isOpen);
    if (!isOpen) return null;

    const hasApproved = respostas.some(r => r.status === 'approved');
    const getDisplayStatus = (resposta) =>
        hasApproved && resposta.status !== 'approved' ? 'nao_aprovada' : resposta.status;
    const isDimmed = (resposta) =>
        (resposta.is_placeholder) || (hasApproved && resposta.status !== 'approved');

    const isAcquisitionGenerated = (resposta) =>
        resposta?.has_acquisition || resposta?.acquisition || resposta?.acquisition_id ||
        resposta?.status === 'completed' || resposta?.status === 'delivered';

    const handleOpenAprovacaoModal = (resposta) => {
        setOpenMenuId(null);
        setApprovalTarget(resposta);
    };

    const handleConfirmarAprovacao = async () => {
        if (!approvalTarget) return;
        setIsApproving(true);
        try {
            await onAprovar(approvalTarget);
            setRespostas(prev => prev.map(r => r.id === approvalTarget.id ? { ...r, status: 'approved' } : r));
        } catch {
            // Erro já apresentado pelo parent
        } finally {
            setIsApproving(false);
            setApprovalTarget(null);
        }
    };

    const handleGerarAquisicao = (resposta) => {
        if (isAcquisitionGenerated(resposta)) return;
        setOpenMenuId(null);
        setGerarAquisicaoTarget(resposta);
    };

    const confirmGerarAquisicao = async ({ expected_delivery_date, justification }) => {
        if (!gerarAquisicaoTarget) return;
        setIsGerarAquisicao(true);
        try {
            await onGerarAquisicao(gerarAquisicaoTarget, expected_delivery_date, justification);
            setRespostas(prev => prev.map(r => r.id === gerarAquisicaoTarget.id ? { ...r, has_acquisition: true } : r));
            setGerarAquisicaoTarget(null);
        } catch {
            // Erro já apresentado pelo parent
        } finally {
            setIsGerarAquisicao(false);
        }
    };

    const handleSolicitarRevisao = (resposta) => {
        setOpenMenuId(null);
        setRevisaoTarget(resposta);
    };

    const confirmSolicitarRevisao = async ({ reason, message }) => {
        if (!revisaoTarget) return;
        setIsSubmittingRevisao(true);
        setError(null);
        try {
            const idToReview = revisaoTarget.quotation_response_id || revisaoTarget.id;
            await quotationResponsesAPI.requestRevision(idToReview, reason, message);
            setRespostas(prev => prev.map(r =>
                r.id === revisaoTarget.id ? { ...r, status: 'revision_requested' } : r
            ));
            if (onSolicitarRevisao) await onSolicitarRevisao(revisaoTarget);
        } catch (err) {
            console.error('Erro ao solicitar revisão:', err);
            const errorMsg = err.response?.data?.message || 'Erro ao solicitar revisão. Verifique se o servidor permite esta acção para o estado actual da proposta.';
            setError(errorMsg);
            if (onSolicitarRevisaoError) onSolicitarRevisaoError(errorMsg);
        } finally {
            setIsSubmittingRevisao(false);
            setRevisaoTarget(null);
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
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X size={24} className="text-gray-600" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-auto p-6">
                    {error && (
                        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-red-600 text-sm">
                                <strong>Erro:</strong> {error}
                            </p>
                        </div>
                    )}

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
                                    <span style={{ color: 'var(--color-text-secondary)' }}>{requestDetails.activity_description || '-'}</span>
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
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Status</th>
                                        <th className="px-6 py-4 text-center text-sm font-semibold text-gray-600">Acções</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {isLoading ? (
                                        <FornecedorTableSkeleton rows={3} />
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
                                                                src={`https://api.dicebear.com/7.x/initials/svg?seed=${resposta.supplier?.company_name || resposta.supplier?.commercial_name || 'N/A'}`}
                                                                alt={resposta.supplier?.company_name || resposta.supplier?.commercial_name}
                                                                className="w-10 h-10 rounded-xl shadow-sm border border-gray-100"
                                                            />
                                                            {resposta.is_placeholder && (
                                                                <div className="absolute -top-1 -right-1 bg-yellow-400 border-2 border-white w-4 h-4 rounded-full flex items-center justify-center" title="Aguardando resposta">
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
                                                                    onClick={() => setOpenMenuId(openMenuId === `resp-${resposta.id}` ? null : `resp-${resposta.id}`)}
                                                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                                                >
                                                                    <MoreVertical size={20} className="text-gray-600" />
                                                                </button>

                                                                {openMenuId === `resp-${resposta.id}` && (
                                                                    <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50">
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

                                                                        {!isAcquisitionGenerated(resposta) && (
                                                                            <>
                                                                                {resposta.status !== 'approved' && (
                                                                                    <>
                                                                                        {/* Aprovar proposta */}
                                                                                        <button
                                                                                            onClick={() => handleOpenAprovacaoModal(resposta)}
                                                                                            className="w-full px-4 py-2.5 text-left hover:bg-gray-50 text-sm flex items-center gap-3 transition-colors text-emerald-600 font-medium"
                                                                                        >
                                                                                            <CheckCircle size={16} className="text-emerald-500" />
                                                                                            <span>Aprovar Proposta</span>
                                                                                        </button>

                                                                                        {/* Rejeitar proposta */}
                                                                                        <button
                                                                                            onClick={() => {
                                                                                                if (confirm('Deseja rejeitar esta proposta?')) {
                                                                                                    onRejeitar(resposta);
                                                                                                    setOpenMenuId(null);
                                                                                                }
                                                                                            }}
                                                                                            className="w-full px-4 py-2.5 text-left hover:bg-gray-50 text-sm flex items-center gap-3 transition-colors text-red-600"
                                                                                        >
                                                                                            <Trash2 size={16} className="text-red-400" />
                                                                                            <span>Rejeitar Proposta</span>
                                                                                        </button>
                                                                                    </>
                                                                                )}

                                                                                {/* Solicitar Revisão — sempre disponível */}
                                                                                <button
                                                                                    onClick={() => handleSolicitarRevisao(resposta)}
                                                                                    className="w-full px-4 py-2.5 text-left hover:bg-gray-50 text-sm flex items-center gap-3 transition-colors"
                                                                                >
                                                                                    <MessageSquare size={16} className="text-gray-400" />
                                                                                    <span className="text-gray-700">Solicitar Revisão</span>
                                                                                </button>

                                                                                {/* Gerar aquisição — só disponível após aprovação */}
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
                                                                    </div>
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

            {/* Modal de confirmação de aprovação */}
            {approvalTarget && (
                <div className="fixed inset-0 z-[70] bg-black/50 flex items-center justify-center p-4" onClick={() => !isApproving && setApprovalTarget(null)}>
                    <div
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Confirmar Aprovação</h3>
                        <p className="text-sm text-gray-600 mb-1">
                            Pretende aprovar a proposta de{' '}
                            <strong>
                                {approvalTarget.supplier?.company_name ||
                                    approvalTarget.supplier?.commercial_name ||
                                    approvalTarget.supplier?.legal_name ||
                                    'Fornecedor'}
                            </strong>
                            ?
                        </p>
                        <p className="text-xs text-gray-500 mb-4">
                            {approvalTarget.total_amount
                                ? `Valor total: ${parseFloat(approvalTarget.total_amount).toLocaleString('pt-AO', { minimumFractionDigits: 2 })} AOA`
                                : `ID da resposta: ${approvalTarget.id}`}
                        </p>
                        <div className="rounded-lg p-4 mb-6" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
                            <p className="text-sm font-semibold text-amber-700">Atenção</p>
                            <p className="text-sm text-amber-700 mt-1">
                                Depois de aprovar, esta decisão é definitiva e não tem volta.
                            </p>
                        </div>
                        <div className="flex items-center justify-end gap-3">
                            <button
                                onClick={() => setApprovalTarget(null)}
                                disabled={isApproving}
                                className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleConfirmarAprovacao}
                                disabled={isApproving}
                                className="px-5 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors flex items-center gap-2"
                            >
                                {isApproving && (
                                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                )}
                                {isApproving ? 'Aprovando...' : 'Sim, Aprovar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ModalGerarAquisicao
                isOpen={!!gerarAquisicaoTarget}
                onClose={() => !isGerarAquisicao && setGerarAquisicaoTarget(null)}
                onSubmit={confirmGerarAquisicao}
                isLoading={isGerarAquisicao}
                response={gerarAquisicaoTarget}
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
