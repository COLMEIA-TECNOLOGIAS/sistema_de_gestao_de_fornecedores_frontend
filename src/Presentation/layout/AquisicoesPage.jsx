import { useState, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { createPortal } from "react-dom";
import { Search, SlidersHorizontal, Eye, FileText, CheckCircle, Clock, AlertCircle, TrendingUp, Truck, Plus, X, Package, Trash2, Loader2 } from "lucide-react";
import { quotationResponsesAPI, quotationRequestsAPI, acquisitionsAPI, pendingDeletionsAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import Toast from "../Components/Toast";
import DashboardTableSkeleton from "../Components/DashboardTableSkeleton";
import ModalRevisarCotacao from "../Components/ModalRevisarCotacao";
import ModalSolicitarRevisao from "../Components/ModalSolicitarRevisao";
import ModalPedirCotacao from "../Components/ModalPedirCotacao";
import ModalRespostasPedido from "../Components/ModalRespostasPedido";
import ModalSolicitarEliminacao from "../Components/ModalSolicitarEliminacao";

export default function AquisicoesPage() {
    const location = useLocation();
    const { user, isAdmin } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [responses, setResponses] = useState([]);
    const [atividades, setAtividades] = useState([]);
    const [activeTab, setActiveTab] = useState('atividades'); // 'atividades' | 'aquisicoes'
    const [error, setError] = useState(null);
    const [toast, setToast] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    
    // Filtros
    const [filterDeliveryDate, setFilterDeliveryDate] = useState("");
    const [filterSubmissionDate, setFilterSubmissionDate] = useState("");
    const [filterStatus, setFilterStatus] = useState("");
    const [isFiltersVisible, setIsFiltersVisible] = useState(false);

    // Modal states
    const [selectedResponse, setSelectedResponse] = useState(null);
    const [isRevisarModalOpen, setIsRevisarModalOpen] = useState(false);
    const [isRespostasModalOpen, setIsRespostasModalOpen] = useState(false);
    const [selectedActivity, setSelectedActivity] = useState(null);
    const [isSolicitarRevisaoModalOpen, setIsSolicitarRevisaoModalOpen] = useState(false);
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);
    const [isViewingAcquisition, setIsViewingAcquisition] = useState(false);
    const [deliveryConfirmTarget, setDeliveryConfirmTarget] = useState(null);
    const [isConfirmingDelivery, setIsConfirmingDelivery] = useState(false);
    
    // Deletion Modal States
    const [isSolicitarEliminacaoModalOpen, setIsSolicitarEliminacaoModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);



    // Activity modal states
    const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
    const [activityName, setActivityName] = useState("");
    const [activityDescription, setActivityDescription] = useState("");
    const [activityReference, setActivityReference] = useState("");
    const [buyerEmail, setBuyerEmail] = useState("");
    const [isCotacaoModalOpen, setIsCotacaoModalOpen] = useState(false);
    const [currentActivityName, setCurrentActivityName] = useState("");
    const [currentActivityDescription, setCurrentActivityDescription] = useState("");
    const [currentActivityReference, setCurrentActivityReference] = useState("");


    useEffect(() => {
        fetchData();
        if (location.state?.openDetails) {
            handleOpenDetails(location.state.openDetails);
        }
    }, [location.state]);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            setError(null);

            const [acqData, reqData] = await Promise.all([
                acquisitionsAPI.getAll().catch(() => []),
                quotationRequestsAPI.getAll().catch(() => [])
            ]);

            setResponses(acqData.data || (Array.isArray(acqData) ? acqData : []));
            setAtividades(reqData.data || (Array.isArray(reqData) ? reqData : []));
        } catch (err) {
            console.error("Erro ao carregar dados:", err);
            setError("Erro ao carregar dados.");
        } finally {
            setIsLoading(false);
        }
    };





    const showToast = (type, message) => {
        setToast({ type, message });
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
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
            awaiting_delivery: { label: 'Espera da Entrega', class: 'bg-orange-50 text-orange-700 border-orange-100' },
            completed: { label: 'Concluída', class: 'bg-green-50 text-green-700 border-green-100' },
            cancelled: { label: 'Cancelada', class: 'bg-red-50 text-red-700 border-red-100' },
            delivered: { label: 'Entregue', class: 'bg-green-50 text-green-700 border-green-100' },
        };
        const config = statusConfig[status] || { label: 'Desconhecido', class: 'bg-gray-50 text-gray-700 border-gray-100' };
        return (
            <span className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${config.class}`}>
                {config.label}
            </span>
        );
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString('pt-AO', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const getLinkedAcquisition = (act) =>
        responses.find(r => r.quotation_request_id === act.id || r.quotation_request?.id === act.id);

    const getEffectiveStatus = (act) => {
        if (act.status === 'cancelled') return 'cancelled';
        const acq = getLinkedAcquisition(act);
        if (acq) {
            return acq.actual_delivery_date ? 'completed' : 'awaiting_delivery';
        }
        return act.status;
    };

    const filteredResponses = responses.filter(resp => {
        const matchSearch = resp.id.toString().includes(searchTerm) ||
            (resp.activity_description || resp.reference_number || "").toLowerCase().includes(searchTerm.toLowerCase());
            
        const matchDeliveryDate = filterDeliveryDate === "" || ((resp.delivery_date || resp.expected_delivery_date) && (resp.delivery_date || resp.expected_delivery_date).startsWith(filterDeliveryDate));
        const matchSubmissionDate = filterSubmissionDate === "" || (resp.submitted_at && resp.submitted_at.startsWith(filterSubmissionDate)) || (resp.created_at && resp.created_at.startsWith(filterSubmissionDate));
        const matchStatus = filterStatus === "" || resp.status === filterStatus;
        
        return matchSearch && matchDeliveryDate && matchSubmissionDate && matchStatus;
    });

    const filteredAtividades = atividades.filter(act => {
        const matchSearch = act.id.toString().includes(searchTerm) ||
            (act.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (act.activity_description || act.reference_number || "").toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchSubmissionDate = filterSubmissionDate === "" || (act.submitted_at && act.submitted_at.startsWith(filterSubmissionDate)) || (act.created_at && act.created_at.startsWith(filterSubmissionDate));
        const matchStatus = filterStatus === "" || act.status === filterStatus;
        return matchSearch && matchSubmissionDate && matchStatus;
    });

    const activeRows = useMemo(() => {
        if (activeTab === 'lista_aquisicoes') return filteredResponses;
        if (activeTab === 'atividades') return filteredAtividades;
        if (activeTab === 'aquisicoes') {
            return filteredAtividades.filter(a => ['sent', 'draft', 'pending', 'pending_review', 'open', 'published', 'active', 'in_progress', 'awaiting_delivery'].includes(getEffectiveStatus(a)));
        }
        if (activeTab === 'concluidas') {
            return filteredAtividades.filter(a => getEffectiveStatus(a) === 'completed' || a.status === 'approved');
        }
        return filteredAtividades.filter(a => a.status === 'cancelled');
    }, [activeTab, filteredResponses, filteredAtividades]);

    const handleClearFilters = () => {
        setSearchTerm("");
        setFilterDeliveryDate("");
        setFilterSubmissionDate("");
        setFilterStatus("");
    };

    const handleOpenDetails = async (aquisicao) => {
        try {
            setIsViewingAcquisition(false);
            // If it's a quotation response from ModalRespostasPedido (has supplier, not a placeholder)
            if (aquisicao.supplier && aquisicao.id && !String(aquisicao.id).startsWith('pending-')) {
                setSelectedResponse(aquisicao);
                setIsRevisarModalOpen(true);
                return;
            }

            // If it's a quotation request (no quotation_response_id), open the responses modal instead
            if (!aquisicao.quotation_response_id && !aquisicao.response_id) {
                setSelectedActivity(aquisicao);
                setIsRespostasModalOpen(true);
                return;
            }

            let responseDetails = aquisicao;

            if (aquisicao.quotation_response_id) {
                try {
                    const res = await quotationResponsesAPI.getById(aquisicao.quotation_response_id);
                    responseDetails = res.data || res;
                } catch (innerError) {
                    console.warn("Failed to load quotation response details, fallback to Acquisition details", innerError);
                    try {
                        if (acquisitionsAPI.getById) {
                            const acqRes = await acquisitionsAPI.getById(aquisicao.id);
                            responseDetails = acqRes.data || acqRes;
                        }
                    } catch (acqErr) {
                        console.warn("Failed fallback to acquisition details", acqErr);
                    }
                }
            }

            // Data normalization
            if (!responseDetails.id && aquisicao.id) {
                responseDetails.id = aquisicao.id;
            }
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
                if (!responseDetails.quotation_request) responseDetails.quotation_request = {};
                responseDetails.quotation_request.title = aquisicao.quotation_request.title;
                if (aquisicao.quotation_request.description) {
                    responseDetails.quotation_request.description = aquisicao.quotation_request.description;
                }
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
                            const reqRes = await quotationRequestsAPI.getById(reqId);
                            const reqData = reqRes.data || reqRes;
                            if (reqData.items && reqData.items.length > 0) {
                                responseDetails.items = reqData.items.map(i => ({
                                    ...i,
                                    name: i.name,
                                    quantity: i.quantity,
                                    notes: i.specifications || i.description || i.notes || '-',
                                    unit_price: i.unit_price || i.estimated_price || 0,
                                    is_request_fallback: true
                                }));
                            }
                        }
                    } catch (reqErr) {
                        console.warn("Failed to fetch fallback Quotation Request items", reqErr);
                    }
                }
            }

            if (!responseDetails.total_amount && (aquisicao.total_amount || aquisicao.amount || aquisicao.value)) {
                responseDetails.total_amount = aquisicao.total_amount || aquisicao.amount || aquisicao.value;
            }

            setSelectedResponse(responseDetails);
            setIsRevisarModalOpen(true);
        } catch (e) {
            console.error("Error fetching details", e);
            showToast("error", "Erro ao carregar detalhes");
        }
    };



    const confirmSolicitarRevisao = async ({ reason, message }) => {
        if (!selectedResponse) return;
        setIsSubmittingReview(true);
        try {
            const idToReview = selectedResponse.quotation_response_id || selectedResponse.id;
            await quotationResponsesAPI.requestRevision(idToReview, reason, message);
            showToast('success', 'Solicitação de revisão enviada!');
            setIsSolicitarRevisaoModalOpen(false);
            fetchData();
        } catch (err) {
            console.error('Erro ao solicitar revisão:', err);
            showToast('error', 'Erro ao solicitar revisão');
        } finally {
            setIsSubmittingReview(false);
        }
    };

    const confirmDeliveryAction = async () => {
        if (!deliveryConfirmTarget) return;
        setIsConfirmingDelivery(true);
        try {
            await acquisitionsAPI.confirmDelivery(deliveryConfirmTarget.id);
            showToast("success", "Entrega confirmada com sucesso!");
            setDeliveryConfirmTarget(null);
            await fetchData();
        } catch (e) {
            console.error("Erro ao confirmar entrega:", e);
            const msg = e.response?.data?.message || "Erro ao confirmar entrega.";
            showToast("error", msg);
        } finally {
            setIsConfirmingDelivery(false);
        }
    };

    const handleViewAcquisition = (acq) => {
        setIsViewingAcquisition(true);
        setSelectedResponse(acq);
        setIsRevisarModalOpen(true);
    };

    const handleDeleteAtividade = async (e, act) => {
        e.stopPropagation();
        if (!isAdmin) {
            setItemToDelete({ type: 'quotation_request', id: act.id, name: act.title, label: 'Pedido de Cotação' });
            setIsSolicitarEliminacaoModalOpen(true);
            return;
        }
        if (!window.confirm(`Deseja eliminar a atividade "${act.title}"?`)) return;
        try {
            await quotationRequestsAPI.delete(act.id);
            showToast('success', 'Atividade eliminada com sucesso!');
            fetchData();
        } catch (err) {
            console.error('Erro ao eliminar atividade:', err);
            showToast('error', 'Erro ao eliminar atividade');
        }
    };

    const confirmSolicitarEliminacao = async (reason) => {
        if (!itemToDelete) return;
        try {
            await pendingDeletionsAPI.requestDelete(
                itemToDelete.type,
                itemToDelete.id,
                reason
            );
            setIsSolicitarEliminacaoModalOpen(false);
            setItemToDelete(null);
            showToast('success', 'Solicitação de eliminação enviada ao administrador!');
        } catch (err) {
            console.error('Erro ao solicitar eliminação:', err);
            const status = err.response?.status;
            let errorMsg;
            if (status === 422) {
                const data = err.response?.data;
                if (data?.errors) {
                    errorMsg = Object.values(data.errors).flat().join(' ');
                } else {
                    errorMsg = data?.message || 'Já existe uma solicitação pendente para este item.';
                }
            } else if (status === 403) {
                errorMsg = 'Não tem permissão para solicitar eliminações.';
            } else if (status === 409) {
                errorMsg = 'Já existe uma solicitação de eliminação pendente para esta atividade.';
            } else {
                errorMsg = err.response?.data?.message || err.message || 'Erro ao solicitar eliminação';
            }
            showToast('error', errorMsg);
            throw err;
        }
    };

    const getRequestIdFromResposta = (resposta) => {
        return resposta?.quotation_supplier?.quotation_request_id
            || resposta?.quotation_request_id
            || resposta?.quotation_supplier?.quotation_request?.id
            || resposta?.quotation_request?.id
            || null;
    };

    const updateAtividadeStatus = (requestId, status) => {
        if (!requestId) return;
        setAtividades(prev => prev.map(a => (a.id === requestId ? { ...a, status } : a)));
    };

    // Handle creating activity and opening quotation
    const handleCreateActivity = () => {
        if (!activityName.trim()) return;
        setCurrentActivityName(activityName);
        setCurrentActivityDescription(activityDescription);
        setCurrentActivityReference(activityReference);
        setIsActivityModalOpen(false);
        setIsCotacaoModalOpen(true);
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Aquisições</h1>
                    <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>Gerencie as respostas e aquisições de fornecedores</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsActivityModalOpen(true)}
                        className="btn-primary"
                    >
                        <Plus size={18} />
                        Registar nova actividade
                    </button>
                </div>
            </div>

            {/* Tabs com contadores */}
            <div className="flex border-b" style={{ borderColor: 'var(--color-border-light)' }}>
                <button
                    onClick={() => setActiveTab('atividades')}
                    className={`px-6 py-3 font-semibold text-sm transition-all flex items-center gap-2 ${activeTab === 'atividades' ? 'text-[#44B16F] border-b-2 border-[#44B16F]' : 'text-gray-500 hover:text-gray-800'}`}
                >
                    Atividades
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === 'atividades' ? 'bg-[#44B16F]/10 text-[#44B16F]' : 'bg-gray-100 text-gray-500'}`}>
                        {atividades.length}
                    </span>
                </button>
                <button
                    onClick={() => setActiveTab('aquisicoes')}
                    className={`px-6 py-3 font-semibold text-sm transition-all flex items-center gap-2 ${activeTab === 'aquisicoes' ? 'text-[#44B16F] border-b-2 border-[#44B16F]' : 'text-gray-500 hover:text-gray-800'}`}
                >
                    Atividades em Curso
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === 'aquisicoes' ? 'bg-[#44B16F]/10 text-[#44B16F]' : 'bg-gray-100 text-gray-500'}`}>
                        {atividades.filter(a => ['sent', 'draft', 'pending', 'pending_review', 'open', 'published', 'active', 'in_progress', 'awaiting_delivery'].includes(getEffectiveStatus(a))).length}
                    </span>
                </button>
                <button
                    onClick={() => setActiveTab('concluidas')}
                    className={`px-6 py-3 font-semibold text-sm transition-all flex items-center gap-2 ${activeTab === 'concluidas' ? 'text-[#44B16F] border-b-2 border-[#44B16F]' : 'text-gray-500 hover:text-gray-800'}`}
                >
                    Atividades Concluídas
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === 'concluidas' ? 'bg-[#44B16F]/10 text-[#44B16F]' : 'bg-gray-100 text-gray-500'}`}>
                        {atividades.filter(a => getEffectiveStatus(a) === 'completed' || a.status === 'approved').length}
                    </span>
                </button>
                <button
                    onClick={() => setActiveTab('canceladas')}
                    className={`px-6 py-3 font-semibold text-sm transition-all flex items-center gap-2 ${activeTab === 'canceladas' ? 'text-red-500 border-b-2 border-red-400' : 'text-gray-500 hover:text-gray-800'}`}
                >
                    Atividades Canceladas
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === 'canceladas' ? 'bg-red-50 text-red-500' : 'bg-gray-100 text-gray-500'}`}>
                        {atividades.filter(a => a.status === 'cancelled').length}
                    </span>
                </button>
                <button
                    onClick={() => setActiveTab('lista_aquisicoes')}
                    className={`px-6 py-3 font-semibold text-sm transition-all flex items-center gap-2 ${activeTab === 'lista_aquisicoes' ? 'text-[#44B16F] border-b-2 border-[#44B16F]' : 'text-gray-500 hover:text-gray-800'}`}
                >
                    Aquisições
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === 'lista_aquisicoes' ? 'bg-[#44B16F]/10 text-[#44B16F]' : 'bg-gray-100 text-gray-500'}`}>
                        {responses.length}
                    </span>
                </button>
            </div>

            {/* Content Area */}

            <div className="rounded-2xl shadow-sm overflow-hidden mt-6" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border-light)' }}>
                <div className="flex flex-col p-6 gap-4 border-b" style={{ borderColor: 'var(--color-border-light)' }}>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4 flex-1">
                            <div className="search-bar" style={{ maxWidth: '400px', flex: 1 }}>
                                <Search className="search-icon" size={16} />
                                <input
                                    type="text"
                                    placeholder="Pesquisar por ID ou referência..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="input-field"
                                    style={{ paddingLeft: '42px' }}
                                />
                            </div>
                            <button 
                                onClick={() => setIsFiltersVisible(!isFiltersVisible)}
                                className={`p-3 rounded-xl transition-all ${isFiltersVisible ? 'bg-[#44B16F]/10 text-[#44B16F]' : ''}`} 
                                style={{ background: isFiltersVisible ? '' : 'var(--color-bg)', color: isFiltersVisible ? '#44B16F' : 'var(--color-text-secondary)' }}
                            >
                                <SlidersHorizontal size={20} />
                            </button>
                        </div>
                        <div className="flex items-center gap-3 text-xs font-bold text-gray-400 uppercase tracking-widest">
                            Mostrando <span className="text-[#44B16F]">{activeRows.length}</span> resultados
                        </div>
                    </div>
                    
                    {isFiltersVisible && (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 mt-2 border-t" style={{ borderColor: 'var(--color-border-light)' }}>
                            <div>
                                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-text-secondary)' }}>Data de Submissão</label>
                                <input
                                    type="date"
                                    value={filterSubmissionDate}
                                    onChange={(e) => setFilterSubmissionDate(e.target.value)}
                                    className="input-field"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-text-secondary)' }}>Data de Entrega</label>
                                <input
                                    type="date"
                                    value={filterDeliveryDate}
                                    onChange={(e) => setFilterDeliveryDate(e.target.value)}
                                    className="input-field"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-text-secondary)' }}>Estado</label>
                                <select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    className="input-field appearance-none"
                                >
                                    <option value="">Todos</option>
                                    <option value="completed">Concluída</option>
                                    <option value="pending_review">Pendente</option>
                                    <option value="approved">Aprovada</option>
                                    <option value="rejected">Rejeitada</option>
                                    <option value="revision_requested">Revisão</option>
                                </select>
                            </div>
                            <div className="flex items-end">
                                <button
                                    onClick={handleClearFilters}
                                    className="btn-secondary w-full py-2.5"
                                >
                                    Limpar Filtros
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {activeTab === 'lista_aquisicoes' ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead style={{ background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border-light)' }}>
                                <tr>
                                    <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>ID</th>
                                    <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Referência</th>
                                    <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Ref. PP</th>
                                    <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Fornecedor</th>
                                    <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Entrega Prevista</th>
                                    <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Entrega Real</th>
                                    <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Estado</th>
                                    <th className="px-6 py-5 text-center text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Acções</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y" style={{ divideColor: 'var(--color-border-light)' }}>
                                {responses.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="px-6 py-12 text-center text-gray-400 font-bold uppercase tracking-widest text-[10px]">
                                            Nenhuma aquisição encontrada
                                        </td>
                                    </tr>
                                ) : (
                                    responses.map((acq) => (
                                        <tr key={acq.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-6 text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>#{acq.id}</td>
                                            <td className="px-6 py-6 text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                                                {acq.reference_number || `ACQ-${String(acq.id).padStart(3, '0')}`}
                                            </td>
                                            <td className="px-6 py-6 text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                                                {acq.quotation_request?.activity_description || acq.quotation_request?.reference || '—'}
                                            </td>
                                            <td className="px-6 py-6 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                                                {acq.supplier?.company_name || acq.supplier?.commercial_name || acq.supplier?.legal_name || `Fornecedor #${acq.supplier_id}`}
                                            </td>
                                            <td className="px-6 py-6 text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                                                {formatDate(acq.expected_delivery_date)}
                                            </td>
                                            <td className="px-6 py-6 text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                                                {formatDate(acq.actual_delivery_date)}
                                            </td>
                                            <td className="px-6 py-6">
                                                {getStatusBadge(acq.status)}
                                            </td>
                                            <td className="px-6 py-6">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => handleViewAcquisition(acq)}
                                                        className="p-2 text-emerald-600 rounded-lg transition-all hover:bg-gray-100"
                                                        title="Ver Detalhes"
                                                    >
                                                        <Eye size={18} />
                                                    </button>
                                                    {!acq.actual_delivery_date && acq.status !== 'cancelled' ? (
                                                        <button
                                                            onClick={() => setDeliveryConfirmTarget(acq)}
                                                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all text-orange-700 hover:bg-orange-50 border border-orange-200"
                                                            title="Confirmar Entrega"
                                                        >
                                                            <Truck size={16} />
                                                            Confirmar Entrega
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
                                <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>ID</th>
                                <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>{activeTab === 'atividades' ? 'Atividade / Referência' : 'Procedência'}</th>
                                <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Data de  Submissão</th>
                                <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Data Limite / Entrega</th>
                                <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Estado</th>
                                <th className="px-6 py-5 text-center text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Acções</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y" style={{ divideColor: 'var(--color-border-light)' }}>
                            {isLoading ? (
                                <DashboardTableSkeleton rows={5} />
                            ) : error ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-red-500 font-bold">{error}</td>
                                </tr>
                            ) : (
                                (() => {
                                    const tabAtividades = activeRows;
                                    return tabAtividades.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-12 text-center text-gray-400 font-bold uppercase tracking-widest text-[10px]">
                                                Nenhuma atividade encontrada
                                            </td>
                                        </tr>
                                    ) : (
                                        tabAtividades.map((act) => (
                                            <tr key={act.id} className="transition-colors group cursor-pointer" onClick={() => { setSelectedActivity(act); setIsRespostasModalOpen(true); }} onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'} style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                                                <td className="px-6 py-6 text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>#{act.id}</td>
                                                <td className="px-6 py-6 font-bold text-sm" style={{ color: 'var(--color-text-primary)' }}>
                                                    {act.title}
                                                    <div className="text-xs font-normal mt-1 space-y-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                                                        {(() => {
                                                            const ppRef = act.reference || act.activity_description;
                                                            const systemRef = (act.reference_number && act.reference_number !== ppRef)
                                                                ? act.reference_number
                                                                : (act.id != null ? `CT-${String(act.id).padStart(3, '0')}` : '');
                                                            return (
                                                                <>
                                                                    <div>Ref. PP: {ppRef || '—'}</div>
                                                                    <div>Ref. Sistema: {systemRef || '—'}</div>
                                                                </>
                                                            );
                                                        })()}
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
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedActivity(act);
                                                                setIsRespostasModalOpen(true);
                                                            }}
                                                            className="p-2 text-emerald-600 rounded-lg transition-all hover:bg-gray-100"
                                                            title="Ver Detalhes"
                                                        >
                                                            <Eye size={18} />
                                                        </button>
                                                        <button
                                                            onClick={(e) => handleDeleteAtividade(e, act)}
                                                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                            title={'Eliminar'}
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    );
                                })()
                            )}
                        </tbody>
                    </table>
                </div>
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
                                <label className="block text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Titulo da Atividade</label>
                                <input
                                    type="text"
                                    value={activityName}
                                    onChange={(e) => setActivityName(e.target.value)}
                                    placeholder="Ex: Reforço de Stock Sanitário Q1"
                                    className="input-field"
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
                                onClick={() => { setIsActivityModalOpen(false); setActivityName(""); setActivityDescription(""); setActivityReference(""); setBuyerEmail(""); }}
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

            {/* Other Modals */}
            <ModalPedirCotacao
                isOpen={isCotacaoModalOpen}
                onClose={() => {
                    setIsCotacaoModalOpen(false);
                    setCurrentActivityName("");
                    setCurrentActivityDescription("");
                    setCurrentActivityReference("");
                    setActivityName("");
                    setActivityDescription("");
                    setActivityReference("");
                    setBuyerEmail("");
                    fetchData();
                }}
                activityName={currentActivityName}
                activityDescription={currentActivityDescription}
                activityReference={currentActivityReference}
                buyerEmail={buyerEmail}
            />

            <ModalRevisarCotacao
                isOpen={isRevisarModalOpen}
                onClose={() => setIsRevisarModalOpen(false)}
                cotacao={selectedResponse}
                isAcquisition={isViewingAcquisition}
            />

            {/* Modal de confirmação de entrega */}
            {deliveryConfirmTarget && (
                <div className="fixed inset-0 z-[70] bg-black/50 flex items-center justify-center p-4" onClick={() => !isConfirmingDelivery && setDeliveryConfirmTarget(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Confirmar Entrega</h3>
                        <p className="text-sm text-gray-600 mb-1">
                            Pretende confirmar a entrega da aquisição{' '}
                            <strong>{deliveryConfirmTarget.reference_number || `#${deliveryConfirmTarget.id}`}</strong>?
                        </p>
                        <p className="text-xs text-gray-500 mb-4">
                            Fornecedor: {deliveryConfirmTarget.supplier?.company_name || deliveryConfirmTarget.supplier?.commercial_name || `Fornecedor #${deliveryConfirmTarget.supplier_id}`}
                            {deliveryConfirmTarget.expected_delivery_date ? ` · Entrega prevista: ${formatDate(deliveryConfirmTarget.expected_delivery_date)}` : ''}
                        </p>
                        <div className="rounded-lg p-4 mb-6" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
                            <p className="text-sm font-semibold text-amber-700">Atenção</p>
                            <p className="text-sm text-amber-700 mt-1">
                                Ao confirmar, a atividade associada passará para as Atividades Concluídas.
                            </p>
                        </div>
                        <div className="flex items-center justify-end gap-3">
                            <button
                                onClick={() => setDeliveryConfirmTarget(null)}
                                disabled={isConfirmingDelivery}
                                className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmDeliveryAction}
                                disabled={isConfirmingDelivery}
                                className="px-5 py-2.5 rounded-lg bg-orange-600 text-white text-sm font-medium hover:bg-orange-700 transition-colors flex items-center gap-2"
                            >
                                {isConfirmingDelivery && <Loader2 size={16} className="animate-spin" />}
                                {isConfirmingDelivery ? 'A confirmar...' : 'Sim, Confirmar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ModalRespostasPedido
                isOpen={isRespostasModalOpen}
                onClose={() => {
                    setIsRespostasModalOpen(false);
                    setSelectedActivity(null);
                    fetchData();
                }}
                quotationRequestId={selectedActivity?.id}
                quotationRequestTitle={selectedActivity?.title}
                onOpenRevisarModal={(resposta) => handleOpenDetails(resposta)}
                onAprovar={async (resposta) => {
                    try {
                        await quotationResponsesAPI.approve(resposta.id);
                        showToast('success', 'Proposta aprovada com sucesso!');
                        await fetchData();
                        updateAtividadeStatus(getRequestIdFromResposta(resposta), 'approved');
                    } catch (err) {
                        console.error('Erro ao aprovar proposta:', err);
                        showToast('error', 'Erro ao aprovar proposta');
                        throw err;
                    }
                }}
                onRejeitar={async (resposta) => {
                    try {
                        await quotationResponsesAPI.reject(resposta.id);
                        showToast('success', 'Proposta rejeitada');
                        await fetchData();
                    } catch (err) {
                        console.error('Erro ao rejeitar proposta:', err);
                        showToast('error', 'Erro ao rejeitar proposta');
                    }
                }}
                onSolicitarRevisao={async () => {
                    showToast('success', 'Revisão solicitada com sucesso!');
                    await fetchData();
                }}
                onSolicitarRevisaoError={(msg) => showToast('error', msg)}
                onGerarAquisicao={async (resposta, expected_delivery_date, justification) => {
                    try {
                        await quotationResponsesAPI.createAcquisition(resposta.id, expected_delivery_date, justification);
                        showToast('success', 'Aquisição gerada com sucesso!');
                        await fetchData();
                        updateAtividadeStatus(getRequestIdFromResposta(resposta), 'awaiting_delivery');
                    } catch (err) {
                        console.error('Erro ao gerar aquisição:', err);
                        const msg = err.response?.data?.message || 'Erro ao gerar aquisição';
                        showToast('error', msg);
                        throw err;
                    }
                }}
            />


            <ModalSolicitarEliminacao
                isOpen={isSolicitarEliminacaoModalOpen}
                onClose={() => {
                    setIsSolicitarEliminacaoModalOpen(false);
                    setItemToDelete(null);
                }}
                onSubmit={confirmSolicitarEliminacao}
                itemName={itemToDelete?.name}
                itemTypeLabel={itemToDelete?.label}
            />



            {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
        </div>
    );
}
