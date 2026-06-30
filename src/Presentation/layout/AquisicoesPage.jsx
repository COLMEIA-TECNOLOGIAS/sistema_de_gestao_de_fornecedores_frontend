import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { createPortal } from "react-dom";
import { Search, SlidersHorizontal, Eye, FileText, CheckCircle, Clock, AlertCircle, TrendingUp, Truck, Plus, X, Package } from "lucide-react";
import { quotationResponsesAPI, quotationRequestsAPI, acquisitionsAPI } from "../../services/api";
import Toast from "../Components/Toast";
import DashboardTableSkeleton from "../Components/DashboardTableSkeleton";
import ModalRevisarCotacao from "../Components/ModalRevisarCotacao";
import ModalSolicitarRevisao from "../Components/ModalSolicitarRevisao";
import ModalPedirCotacao from "../Components/ModalPedirCotacao";
import ModalRespostasPedido from "../Components/ModalRespostasPedido";

export default function AquisicoesPage() {
    const location = useLocation();
    const [isLoading, setIsLoading] = useState(true);
    const [responses, setResponses] = useState([]);
    const [atividades, setAtividades] = useState([]);
    const [activeTab, setActiveTab] = useState('atividades'); // 'atividades' | 'aquisicoes'
    const [error, setError] = useState(null);
    const [toast, setToast] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    
    // Filtros
    const [filterSupplier, setFilterSupplier] = useState("");
    const [filterDeliveryDate, setFilterDeliveryDate] = useState("");
    const [filterStatus, setFilterStatus] = useState("");
    const [isFiltersVisible, setIsFiltersVisible] = useState(false);

    // Modal states
    const [selectedResponse, setSelectedResponse] = useState(null);
    const [isRevisarModalOpen, setIsRevisarModalOpen] = useState(false);
    const [isRespostasModalOpen, setIsRespostasModalOpen] = useState(false);
    const [selectedActivity, setSelectedActivity] = useState(null);
    const [isSolicitarRevisaoModalOpen, setIsSolicitarRevisaoModalOpen] = useState(false);
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);



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
            completed: { label: 'Concluída', class: 'bg-green-50 text-green-700 border-green-100' },
            pending_review: { label: 'Pendente', class: 'bg-yellow-50 text-yellow-700 border-yellow-100' },
            approved: { label: 'Aprovada', class: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
            rejected: { label: 'Rejeitada', class: 'bg-red-50 text-red-700 border-red-100' },
            revision_requested: { label: 'Revisão', class: 'bg-blue-50 text-blue-700 border-blue-100' },
        };
        const config = statusConfig[status] || { label: status, class: 'bg-gray-50 text-gray-700 border-gray-100' };
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

    const filteredResponses = responses.filter(resp => {
        // ... (existing filter code)
        const matchSearch = resp.id.toString().includes(searchTerm) ||
            (resp.supplier?.commercial_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (resp.reference_number || "").toLowerCase().includes(searchTerm.toLowerCase());
            
        const matchSupplier = filterSupplier === "" || (resp.supplier?.commercial_name || "").toLowerCase().includes(filterSupplier.toLowerCase());
        const matchDeliveryDate = filterDeliveryDate === "" || (resp.expected_delivery_date && resp.expected_delivery_date.startsWith(filterDeliveryDate));
        const matchStatus = filterStatus === "" || resp.status === filterStatus;
        
        return matchSearch && matchSupplier && matchDeliveryDate && matchStatus;
    });

    const filteredAtividades = atividades.filter(act => {
        const matchSearch = act.id.toString().includes(searchTerm) ||
            (act.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (act.reference_number || "").toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchStatus = filterStatus === "" || act.status === filterStatus;
        return matchSearch && matchStatus;
    });

    const handleClearFilters = () => {
        setSearchTerm("");
        setFilterSupplier("");
        setFilterDeliveryDate("");
        setFilterStatus("");
    };

    const handleOpenDetails = async (aquisicao) => {
        try {
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
            if (!responseDetails.quotation_supplier && responseDetails.supplier) {
                responseDetails.quotation_supplier = {
                    supplier: responseDetails.supplier,
                    quotation_request: responseDetails.quotation_request || {}
                };
            }
            if (!responseDetails.supplier && responseDetails.quotation_supplier?.supplier) {
                responseDetails.supplier = responseDetails.quotation_supplier.supplier;
            }

            if (!responseDetails.expected_delivery_date && aquisicao.expected_delivery_date) {
                responseDetails.expected_delivery_date = aquisicao.expected_delivery_date;
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

    const handleConfirmDelivery = async (aquisicao) => {
        if (!window.confirm("Tem certeza que deseja confirmar a entrega desta aquisição?")) return;

        try {
            await acquisitionsAPI.confirmDelivery(aquisicao.id);
            showToast("success", "Entrega confirmada com sucesso!");
            fetchData();
        } catch (e) {
            console.error("Erro ao confirmar entrega:", e);
            showToast("error", "Erro ao confirmar entrega.");
        }
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
                    onClick={() => setActiveTab('concluidas')}
                    className={`px-6 py-3 font-semibold text-sm transition-all flex items-center gap-2 ${activeTab === 'concluidas' ? 'text-[#44B16F] border-b-2 border-[#44B16F]' : 'text-gray-500 hover:text-gray-800'}`}
                >
                    Ativ. Concluídas
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === 'concluidas' ? 'bg-[#44B16F]/10 text-[#44B16F]' : 'bg-gray-100 text-gray-500'}`}>
                        {atividades.filter(a => a.status === 'completed' || a.status === 'approved').length}
                    </span>
                </button>
                <button
                    onClick={() => setActiveTab('canceladas')}
                    className={`px-6 py-3 font-semibold text-sm transition-all flex items-center gap-2 ${activeTab === 'canceladas' ? 'text-red-500 border-b-2 border-red-400' : 'text-gray-500 hover:text-gray-800'}`}
                >
                    Ativ. Canceladas
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === 'canceladas' ? 'bg-red-50 text-red-500' : 'bg-gray-100 text-gray-500'}`}>
                        {atividades.filter(a => a.status === 'cancelled').length}
                    </span>
                </button>
                <button
                    onClick={() => setActiveTab('aquisicoes')}
                    className={`px-6 py-3 font-semibold text-sm transition-all flex items-center gap-2 ${activeTab === 'aquisicoes' ? 'text-[#44B16F] border-b-2 border-[#44B16F]' : 'text-gray-500 hover:text-gray-800'}`}
                >
                    Aquisições Confirmadas
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === 'aquisicoes' ? 'bg-[#44B16F]/10 text-[#44B16F]' : 'bg-gray-100 text-gray-500'}`}>
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
                                    placeholder="Pesquisar por ID, fornecedor ou referência..."
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
                            Mostrando <span className="text-[#44B16F]">{filteredResponses.length}</span> resultados
                        </div>
                    </div>
                    
                    {isFiltersVisible && (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 mt-2 border-t" style={{ borderColor: 'var(--color-border-light)' }}>
                            <div>
                                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-text-secondary)' }}>Fornecedor</label>
                                <input
                                    type="text"
                                    value={filterSupplier}
                                    onChange={(e) => setFilterSupplier(e.target.value)}
                                    placeholder="Nome do fornecedor"
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

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead style={{ background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border-light)' }}>
                            <tr>
                                <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>ID</th>
                                <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>{activeTab === 'atividades' ? 'Atividade / Referência' : 'Procedência'}</th>
                                <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>{activeTab === 'atividades' ? 'Fornecedores' : 'Fornecedor'}</th>
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
                            ) : activeTab !== 'aquisicoes' ? (
                                (() => {
                                    const tabAtividades = activeTab === 'atividades'
                                        ? filteredAtividades
                                        : activeTab === 'concluidas'
                                        ? filteredAtividades.filter(a => a.status === 'completed' || a.status === 'approved')
                                        : filteredAtividades.filter(a => a.status === 'cancelled');
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
                                                    {act.reference_number && <div className="text-xs font-normal" style={{ color: 'var(--color-text-secondary)' }}>Ref: {act.reference_number}</div>}
                                                </td>
                                                <td className="px-6 py-6">
                                                    {(() => {
                                                        const suppliers = act.suppliers || act.quotation_suppliers || [];
                                                        if (suppliers.length > 0) {
                                                            return (
                                                                <div className="inline-flex flex-col gap-1.5 p-2 rounded-lg border min-w-[140px]" style={{ borderColor: 'rgba(68,177,111,0.2)', background: 'rgba(68,177,111,0.04)' }}>
                                                                    {suppliers.slice(0, 3).map((s) => (
                                                                        <span
                                                                            key={s.id}
                                                                            className="group relative inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer transition-all"
                                                                            style={{ background: 'rgba(68,177,111,0.1)', color: '#44B16F' }}
                                                                        >
                                                                            {s.commercial_name || s.legal_name || s.name || `#${s.id}`}
                                                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50">
                                                                                <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg whitespace-nowrap">
                                                                                    <p className="font-semibold">{s.commercial_name || s.legal_name}</p>
                                                                                    {s.email && <p className="text-gray-300">{s.email}</p>}
                                                                                    {s.nif && <p className="text-gray-300">NIF: {s.nif}</p>}
                                                                                    {s.categories?.length > 0 && (
                                                                                        <p className="text-gray-300">{s.categories.map(c => c.name).join(', ')}</p>
                                                                                    )}
                                                                                </div>
                                                                                <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                                                                            </div>
                                                                        </span>
                                                                    ))}
                                                                    {suppliers.length > 3 && (
                                                                        <span className="text-xs font-medium px-2 py-1 rounded-full" style={{ color: 'var(--color-text-muted)', background: 'var(--color-bg)' }}>
                                                                            +{suppliers.length - 3}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            );
                                                        }
                                                        return (
                                                            <span className="text-sm font-semibold" style={{ color: 'var(--color-text-muted)' }}>
                                                                Nenhum fornecedor
                                                            </span>
                                                        );
                                                    })()}
                                                </td>
                                                <td className="px-6 py-6 text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                                                    {formatDate(act.deadline)}
                                                </td>
                                                <td className="px-6 py-6">
                                                    {getStatusBadge(act.status)}
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
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    );
                                })()
                            ) : (
                                filteredResponses.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-12 text-center text-gray-400 font-bold uppercase tracking-widest text-[10px]">
                                            Nenhuma aquisição encontrada
                                        </td>
                                    </tr>
                                ) : (
                                    filteredResponses.map((resp) => (
                                        <tr key={resp.id} className="transition-colors group" onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'} style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                                            <td className="px-6 py-6 text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>#{resp.id}</td>
                                            <td className="px-6 py-6 font-bold text-sm" style={{ color: 'var(--color-text-primary)' }}>
                                                Cotação #{resp.quotation_request_id || resp.quotation_response_id}
                                            </td>
                                            <td className="px-6 py-6">
                                                <span className="text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                                                    {resp.supplier?.commercial_name || resp.supplier?.legal_name || "N/A"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-6 text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                                                {formatDate(resp.expected_delivery_date)}
                                            </td>
                                            <td className="px-6 py-6">
                                                {getStatusBadge(resp.status)}
                                            </td>
                                            <td className="px-6 py-6 font-medium">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => handleOpenDetails(resp)}
                                                        className="p-2 text-emerald-600 rounded-lg transition-all"
                                                        title="Ver Detalhes"
                                                        onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg)'}
                                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                                    >
                                                        <Eye size={18} />
                                                    </button>
                                                    {resp.status !== 'completed' && (
                                                        <button
                                                            onClick={() => handleConfirmDelivery(resp)}
                                                            className="p-2 text-blue-600 rounded-lg transition-all"
                                                            title="Confirmar Entrega"
                                                            onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg)'}
                                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                                        >
                                                            <Truck size={18} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )
                            )}
                        </tbody>
                    </table>
                </div>
            </div>


            {/* Modals Section */}

            {/* Activity Registration — rendered via Portal to escape overflow stacking context */}
            {isActivityModalOpen && createPortal(
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center" style={{ zIndex: 9999 }}>
                    <div className="absolute inset-0" onClick={() => setIsActivityModalOpen(false)} />
                    <div className="relative rounded-2xl shadow-2xl w-full max-w-lg mx-4 animate-fadeIn max-h-[90vh] overflow-hidden flex flex-col" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border-light)' }}>
                        {/* Header */}
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

                        {/* Body */}
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

                            <div className="space-y-1.5">
                                <label className="block text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Descrição da atividade</label>
                                <textarea
                                    value={activityDescription}
                                    onChange={(e) => setActivityDescription(e.target.value)}
                                    placeholder="Descreva o propósito desta aquisição..."
                                    rows={3}
                                    className="input-field resize-none"
                                />
                            </div>



                            
                        </div>

                        {/* Footer */}
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
                isAcquisition={selectedResponse?.quotation_response_id ? false : true}
            />

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
                onAprovar={async (id) => {
                    try {
                        await quotationResponsesAPI.approve(id);
                        showToast('success', 'Proposta aprovada com sucesso!');
                        fetchData();
                    } catch (err) {
                        showToast('error', 'Erro ao aprovar proposta');
                    }
                }}
                onRejeitar={async (id) => {
                    try {
                        await quotationResponsesAPI.reject(id);
                        showToast('success', 'Proposta rejeitada');
                        fetchData();
                    } catch (err) {
                        showToast('error', 'Erro ao rejeitar proposta');
                    }
                }}
                onSolicitarRevisao={(id) => { showToast('info', 'Revisão solicitada'); fetchData(); }}
                onGerarAquisicao={(id) => { showToast('info', 'Aquisição gerada'); fetchData(); }}
            />

            <ModalSolicitarRevisao
                isOpen={isSolicitarRevisaoModalOpen}
                onClose={() => setIsSolicitarRevisaoModalOpen(false)}
                onSubmit={confirmSolicitarRevisao}
                isLoading={isSubmittingReview}
            />



            {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
        </div>
    );
}
