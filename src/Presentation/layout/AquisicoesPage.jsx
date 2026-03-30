import { useState, useEffect } from "react";
import { Search, SlidersHorizontal, Eye, FileText, CheckCircle, Clock, AlertCircle, TrendingUp, Truck, Plus, X, Package } from "lucide-react";
import { quotationResponsesAPI, quotationRequestsAPI, acquisitionsAPI } from "../../services/api";
import Toast from "../Components/Toast";
import DashboardTableSkeleton from "../Components/DashboardTableSkeleton";
import ModalRevisarCotacao from "../Components/ModalRevisarCotacao";
import ModalSolicitarRevisao from "../Components/ModalSolicitarRevisao";
import ModalPedirCotacao from "../Components/ModalPedirCotacao";
import ModalRespostasPedido from "../Components/ModalRespostasPedido";

export default function AquisicoesPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [responses, setResponses] = useState([]);
    const [stats, setStats] = useState([]);
    const [error, setError] = useState(null);
    const [toast, setToast] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");

    // Modal states
    const [selectedResponse, setSelectedResponse] = useState(null);
    const [isRevisarModalOpen, setIsRevisarModalOpen] = useState(false);
    const [isSolicitarRevisaoModalOpen, setIsSolicitarRevisaoModalOpen] = useState(false);
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);

    // Activity response tracking
    const [isRespostasModalOpen, setIsRespostasModalOpen] = useState(false);
    const [selectedPedidoForAtividade, setSelectedPedidoForAtividade] = useState(null);

    // Activity modal states
    const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
    const [activityName, setActivityName] = useState("");
    const [activityDescription, setActivityDescription] = useState("");
    const [isCotacaoModalOpen, setIsCotacaoModalOpen] = useState(false);
    const [currentActivityName, setCurrentActivityName] = useState("");
    const [viewMode, setViewMode] = useState("activity"); // "list" or "activity"
    const [cotacoes, setCotacoes] = useState([]); // For activity view
    const [isLoadingCotacoes, setIsLoadingCotacoes] = useState(false);

    useEffect(() => {
        fetchResponses();
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const data = await acquisitionsAPI.getStatsProducts();
            setStats(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Erro ao carregar estatísticas:", error);
        }
    };

    const fetchResponses = async () => {
        try {
            setIsLoading(true);
            setError(null);

            const data = await acquisitionsAPI.getAll();

            if (data.data) {
                setResponses(data.data);
            } else if (Array.isArray(data)) {
                setResponses(data);
            } else {
                setResponses([]);
            }

        } catch (err) {
            console.error("Erro ao carregar aquisições:", err);
            setError("Erro ao carregar lista de aquisições.");
        } finally {
            setIsLoading(false);
        }
    };

    const fetchQuotations = async () => {
        try {
            setIsLoadingCotacoes(true);
            const response = await quotationRequestsAPI.getAll();
            setCotacoes(response.data || []);
        } catch (err) {
            console.error('Error fetching quotations:', err);
        } finally {
            setIsLoadingCotacoes(false);
        }
    };

    useEffect(() => {
        if (viewMode === "activity") {
            fetchQuotations();
        }
    }, [viewMode]);

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

    const filteredResponses = responses.filter(resp =>
        resp.id.toString().includes(searchTerm) ||
        (resp.supplier?.commercial_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (resp.reference_number || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleOpenDetails = async (aquisicao) => {
        try {
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
            } else {
                try {
                    if (acquisitionsAPI.getById) {
                        const acqRes = await acquisitionsAPI.getById(aquisicao.id);
                        responseDetails = acqRes.data || acqRes;
                    }
                } catch (acqErr) {
                    console.warn("Failed to load acquisition details", acqErr);
                }
            }

            // Data normalization
            if (!responseDetails.quotation_supplier && responseDetails.supplier) {
                responseDetails.quotation_supplier = {
                    supplier: responseDetails.supplier,
                    quotation_request: responseDetails.quotation_request || {}
                };
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

    const handleAprovarProposta = async (responseObj) => {
        try {
            const idToApprove = responseObj.quotation_response_id || responseObj.id;
            await quotationResponsesAPI.approve(idToApprove, "Aprovado via Aquisições");
            showToast("success", "Proposta aprovada!");
            setIsRevisarModalOpen(false);
            fetchResponses();
        } catch (e) {
            console.error("Error approving", e);
            showToast("error", "Erro ao aprovar proposta");
        }
    };

    const handleRejeitarProposta = async (responseObj) => {
        try {
            const idToReject = responseObj.quotation_response_id || responseObj.id;
            await quotationResponsesAPI.reject(idToReject, "Rejeitado via Aquisições");
            showToast("success", "Proposta rejeitada!");
            setIsRevisarModalOpen(false);
            fetchResponses();
        } catch (e) {
            console.error("Error rejecting", e);
            showToast("error", "Erro ao rejeitar proposta");
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
            fetchResponses();
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
            fetchResponses();
        } catch (e) {
            console.error("Erro ao confirmar entrega:", e);
            showToast("error", "Erro ao confirmar entrega.");
        }
    };

    // Handle creating activity and opening quotation
    const handleCreateActivity = () => {
        if (!activityName.trim()) return;
        setCurrentActivityName(activityName);
        setIsActivityModalOpen(false);
        setIsCotacaoModalOpen(true);
    };

    return (
        <div className="space-y-8 animate-fadeIn">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Aquisições</h1>
                    <p className="text-gray-500 mt-1">Gerencie as respostas e aquisições de fornecedores</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex bg-gray-100 p-1 rounded-xl mr-4 border border-gray-200">
                        <button
                            onClick={() => setViewMode("list")}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${viewMode === "list" ? "bg-white text-[#44B16F] shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                        >
                            Lista Geral
                        </button>
                        <button
                            onClick={() => setViewMode("activity")}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${viewMode === "activity" ? "bg-white text-[#44B16F] shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                        >
                            Por Atividade
                        </button>
                    </div>
                    <button
                        onClick={() => setIsActivityModalOpen(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-[#44B16F] text-white rounded-xl hover:bg-[#3a9d5f] transition-all font-bold shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                    >
                        <Plus size={20} />
                        Registar nova actividade
                    </button>
                </div>
            </div>

            {/* Stats Section - only on list view */}
            {viewMode === "list" && stats.length > 0 && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <TrendingUp size={20} className="text-[#44B16F]" />
                        Produtos Mais Adquiridos
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {stats.map((item, index) => (
                            <div key={index} className="bg-gray-50 p-4 rounded-xl border border-gray-100 hover:shadow-md transition-shadow">
                                <p className="font-bold text-gray-800 truncate" title={item.product_name}>{item.product_name}</p>
                                <div className="flex justify-between items-end mt-3">
                                    <div>
                                        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">Quantidade</p>
                                        <p className="text-2xl font-bold text-[#44B16F] mt-1">{item.total_quantity}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">Aquisições</p>
                                        <p className="text-sm font-bold text-gray-700 mt-1">{item.acquisition_count}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Content Area */}
            {viewMode === "activity" ? (
                <div className="grid grid-cols-1 gap-6 mt-4">
                    {isLoadingCotacoes ? (
                        <DashboardTableSkeleton rows={3} />
                    ) : (cotacoes || []).length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-100 shadow-sm animate-fadeIn">
                            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-8">
                                <Package size={48} className="text-gray-200" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-500 uppercase tracking-tight">Nenhuma atividade registada</h3>
                            <p className="text-gray-400 mt-3 text-sm font-bold max-w-sm text-center px-6">Comece organizando seus processos de compra criando uma nova atividade estratégica.</p>
                        </div>
                    ) : (
                        Object.entries(
                            (cotacoes || []).reduce((acc, cot) => {
                                const title = cot.title || 'Solicitação Sem Título';
                                if (!acc[title]) acc[title] = [];
                                acc[title].push(cot);
                                return acc;
                            }, {})
                        ).map(([title, group], idx) => (
                            <div key={idx} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow animate-fadeIn" style={{ animationDelay: `${idx * 50}ms` }}>


                                <div className="bg-gray-50/50 px-6 py-5 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex items-center gap-8">
                                        <div className="w-12 h-12 bg-[#44B16F]/10 rounded-2xl flex items-center justify-center text-[#44B16F] shrink-0">
                                            <FileText size={24} />
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">{group.length} {group.length === 1 ? 'pedido de cotação' : 'pedidos de cotação'}</p>
                                            <h3 className="text-lg font-bold text-gray-900 leading-tight">{title}</h3>

                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="bg-[#44B16F]/10 text-[#44B16F] text-[10px] uppercase font-bold px-3 py-1 rounded-full">
                                            Histórico de Atividade
                                        </span>
                                    </div>
                                </div>

                                <div className="p-0 bg-white">
                                    <div className="overflow-x-auto">
                                        <table className="w-full border-collapse">
                                            <thead>
                                                <tr className="bg-gray-50/20">
                                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">ID / Data</th>
                                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Participantes</th>
                                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Estado</th>
                                                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-400 uppercase tracking-widest">Ações</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {group.map((cot) => (
                                                    <tr key={cot.id} className="group/row hover:bg-emerald-50/10 transition-all duration-300">
                                                        <td className="px-6 py-5">
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-black text-gray-800 tracking-tight group-hover/row:text-emerald-600 transition-colors">Solicitação #{cot.id}</span>
                                                                <span className="text-[10px] text-gray-400 font-bold mt-2 flex items-center gap-2 uppercase tracking-wide">
                                                                    {formatDate(cot.created_at)}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-5">
                                                            <div className="flex items-center gap-4">
                                                                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gray-50 text-emerald-600 border border-emerald-100 shrink-0">
                                                                    <Package size={18} />
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span className="text-[11px] font-black text-gray-800 uppercase tracking-tight">{(cot.suppliers || []).length} Fornecedores</span>
                                                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Convocados via Sistema</span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-5">
                                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5 border ${cot.status === 'draft' ? 'bg-gray-50 text-gray-400 border-gray-200' :
                                                                cot.status === 'sent' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                                                                    cot.status === 'in_progress' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                                                                        cot.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-200 shadow-emerald-100/20' :
                                                                            'bg-red-50 text-red-600 border-red-200'
                                                                }`}>
                                                                <div className={`w-1.5 h-1.5 rounded-full ${cot.status === 'completed' ? 'bg-[#44B16F]' : 'bg-current opacity-40'}`}></div>
                                                                {cot.status === 'draft' ? 'Rascunho' :
                                                                    cot.status === 'sent' ? 'Pendente' :
                                                                        cot.status === 'in_progress' ? 'Análise' :
                                                                            cot.status === 'completed' ? 'Finalizado' :
                                                                                cot.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-5 text-center">
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedPedidoForAtividade(cot);
                                                                    setIsRespostasModalOpen(true);
                                                                }}
                                                                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-[#44B16F] transition-all transform active:scale-95 group/btn"
                                                            >
                                                                <Eye size={16} />
                                                                Auditar
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mt-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between p-6 gap-4 border-b border-gray-50">
                        <div className="flex items-center gap-4 flex-1">
                            <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Pesquisar por ID, fornecedor ou referência..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#44B16F]/20 focus:border-[#44B16F] transition-all text-sm"
                                />
                            </div>
                            <button className="p-3 bg-gray-50 text-gray-500 rounded-xl hover:bg-gray-100 transition-all">
                                <SlidersHorizontal size={20} />
                            </button>
                        </div>
                        <div className="flex items-center gap-3 text-xs font-bold text-gray-400 uppercase tracking-widest">
                            Mostrando <span className="text-[#44B16F]">{filteredResponses.length}</span> resultados
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50/50 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">ID</th>
                                    <th className="px-6 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Procedência</th>
                                    <th className="px-6 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Fornecedor</th>
                                    <th className="px-6 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Data Entrega</th>
                                    <th className="px-6 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Estado</th>
                                    <th className="px-6 py-5 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">Acções</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {isLoading ? (
                                    <DashboardTableSkeleton rows={5} />
                                ) : error ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-12 text-center text-red-500 font-bold">{error}</td>
                                    </tr>
                                ) : filteredResponses.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-12 text-center text-gray-400 font-bold uppercase tracking-widest text-[10px]">
                                            Nenhuma aquisição encontrada
                                        </td>
                                    </tr>
                                ) : (
                                    filteredResponses.map((resp) => (
                                        <tr key={resp.id} className="hover:bg-gray-50/50 transition-colors group">
                                            <td className="px-6 py-6 text-sm font-bold text-gray-900">#{resp.id}</td>
                                            <td className="px-6 py-6 font-bold text-gray-800 text-sm">
                                                Cotação #{resp.quotation_request_id}
                                            </td>
                                            <td className="px-6 py-6">
                                                <span className="text-sm font-semibold text-gray-700">
                                                    {resp.supplier?.commercial_name || resp.supplier?.legal_name || "N/A"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-6 text-sm text-gray-600 font-medium">
                                                {formatDate(resp.expected_delivery_date)}
                                            </td>
                                            <td className="px-6 py-6">
                                                {getStatusBadge(resp.status)}
                                            </td>
                                            <td className="px-6 py-6 font-medium">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => handleOpenDetails(resp)}
                                                        className="p-2 hover:bg-emerald-50 text-emerald-600 rounded-lg transition-all"
                                                        title="Ver Detalhes"
                                                    >
                                                        <Eye size={18} />
                                                    </button>
                                                    {resp.status !== 'completed' && (
                                                        <button
                                                            onClick={() => handleConfirmDelivery(resp)}
                                                            className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-all"
                                                            title="Confirmar Entrega"
                                                        >
                                                            <Truck size={18} />
                                                        </button>
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
            )}

            {/* Modals Section */}

            {/* Activity Registration */}
            {isActivityModalOpen && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fadeIn" onClick={() => setIsActivityModalOpen(false)} />
                    <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 tracking-tight leading-none">Nova Atividade</h2>
                                <p className="text-xs text-gray-400 font-bold mt-2 tracking-wide uppercase opacity-70">Estruturação de Processo de Compra</p>
                            </div>
                            <button onClick={() => setIsActivityModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-all group active:scale-90">
                                <X size={24} className="text-gray-400 group-hover:rotate-90 transition-all duration-300" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="space-y-3">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Denominação da Atividade</label>
                                <input
                                    type="text"
                                    value={activityName}
                                    onChange={(e) => setActivityName(e.target.value)}
                                    placeholder="Ex: Reforço de Stock Sanitário Q1"
                                    className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#44B16F]/20 focus:border-[#44B16F] font-bold text-gray-800 transition-all text-base placeholder:text-gray-300"
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Enquadramento / Justificação</label>
                                <textarea
                                    value={activityDescription}
                                    onChange={(e) => setActivityDescription(e.target.value)}
                                    placeholder="Descreva o propósito desta aquisição..."
                                    rows={4}
                                    className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#44B16F]/20 focus:border-[#44B16F] font-medium text-gray-800 transition-all resize-none placeholder:text-gray-300"
                                />
                            </div>

                            <div className="bg-[#44B16F]/5 border border-[#44B16F]/10 rounded-2xl p-6 flex items-start gap-4">
                                <div className="w-12 h-12 bg-[#44B16F] rounded-xl flex items-center justify-center text-white shadow-lg shadow-[#44B16F]/20 shrink-0">
                                    <Package size={24} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-[#44B16F] leading-none">Fluxo de Solicitação</p>
                                    <p className="text-xs text-gray-500 mt-2 font-medium leading-relaxed">Você será redirecionado para compor a lista de itens e convocar fornecedores certificados para este processo.</p>
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-4 bg-gray-50/50 flex items-center justify-end gap-4 border-t border-gray-50">
                            <button
                                onClick={() => { setIsActivityModalOpen(false); setActivityName(""); setActivityDescription(""); }}
                                className="px-6 py-3 text-gray-400 font-bold uppercase text-[10px] tracking-widest hover:text-gray-700 transition-all active:scale-95"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleCreateActivity}
                                disabled={!activityName.trim()}
                                className="flex items-center gap-3 px-8 py-4 bg-[#44B16F] text-white rounded-2xl font-bold uppercase text-[10px] tracking-widest hover:bg-gray-900 transition-all disabled:bg-gray-200 disabled:cursor-not-allowed shadow-lg hover:shadow-xl active:scale-95"
                            >
                                <FileText size={16} />
                                Iniciar Request
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Other Modals */}
            <ModalPedirCotacao
                isOpen={isCotacaoModalOpen}
                onClose={() => {
                    setIsCotacaoModalOpen(false);
                    setCurrentActivityName("");
                    setActivityName("");
                    setActivityDescription("");
                    if (viewMode === "activity") fetchQuotations();
                }}
                activityName={currentActivityName}
            />

            <ModalRevisarCotacao
                isOpen={isRevisarModalOpen}
                onClose={() => setIsRevisarModalOpen(false)}
                cotacao={selectedResponse}
                isAcquisition={true}
            />

            <ModalSolicitarRevisao
                isOpen={isSolicitarRevisaoModalOpen}
                onClose={() => setIsSolicitarRevisaoModalOpen(false)}
                onSubmit={confirmSolicitarRevisao}
                isLoading={isSubmittingReview}
            />

            <ModalRespostasPedido
                isOpen={isRespostasModalOpen}
                onClose={() => {
                    setIsRespostasModalOpen(false);
                    setSelectedPedidoForAtividade(null);
                }}
                quotationRequestId={selectedPedidoForAtividade?.id}
                quotationRequestTitle={selectedPedidoForAtividade?.title}
                onOpenRevisarModal={(resp) => handleOpenDetails(resp)}
                onAprovar={handleAprovarProposta}
                onRejeitar={handleRejeitarProposta}
                onSolicitarRevisao={(resp) => {
                    setSelectedResponse(resp);
                    setIsSolicitarRevisaoModalOpen(true);
                }}
            />

            {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
        </div>
    );
}
