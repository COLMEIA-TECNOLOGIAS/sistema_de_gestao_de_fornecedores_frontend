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
                <div className="grid grid-cols-1 gap-8 mt-4">
                    {isLoadingCotacoes ? (
                        <DashboardTableSkeleton rows={3} />
                    ) : (cotacoes || []).length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-100 shadow-sm animate-fadeIn">
                            <Package size={64} className="text-gray-100 mb-6 drop-shadow-sm" />
                            <h3 className="text-xl font-bold text-gray-400 font-extrabold uppercase tracking-tight">Nenhuma actividade registada</h3>
                            <p className="text-gray-400 mt-2 text-sm font-bold">Comece registando uma nova actividade no botão acima.</p>
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
                            <div key={idx} className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden hover:shadow-2xl hover:border-emerald-200 transition-all duration-500 group/card animate-slideUp" style={{ animationDelay: `${idx * 100}ms` }}>
                                <div className="bg-gradient-to-r from-gray-50/80 to-white px-8 py-7 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex items-center gap-6">
                                        <div className="w-16 h-16 bg-emerald-50 rounded-[1.5rem] flex items-center justify-center text-emerald-600 shadow-inner group-hover/card:scale-110 transition-transform duration-500">
                                            <FileText size={32} />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black text-gray-900 tracking-tight leading-none">{title}</h3>
                                            <div className="flex items-center gap-2 mt-3">
                                                <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg uppercase tracking-widest border border-emerald-100/50">
                                                    Processo • {group.length}
                                                </span>
                                                <span className="text-[10px] font-black text-gray-400 bg-gray-50 px-2.5 py-1 rounded-lg uppercase tracking-widest border border-gray-100">
                                                    Gestão de Aquisição
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex md:flex-col items-start md:items-end gap-2">
                                        <span className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">Monitoramento Direto</span>
                                        <div className="flex items-center gap-2 bg-emerald-500/5 px-3 py-1.5 rounded-xl border border-emerald-500/10">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                            <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-tighter">Sincronizado com Fornecedores</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-0">
                                    <div className="overflow-x-auto">
                                        <table className="w-full border-collapse">
                                            <thead className="bg-gray-50/40 border-b border-gray-100">
                                                <tr>
                                                    <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Procedimento</th>
                                                    <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Participantes Convocados</th>
                                                    <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Estado Sistémico</th>
                                                    <th className="px-8 py-5 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">Ações Operacionais</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {group.map((cot, cIdx) => (
                                                    <tr key={cot.id} className="group hover:bg-emerald-50/30 transition-all duration-300">
                                                        <td className="px-8 py-7">
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-black text-gray-800 tracking-tight group-hover:text-emerald-700 transition-colors">ID #{cot.id}</span>
                                                                <span className="text-[10px] text-gray-400 font-bold mt-2 flex items-center gap-1.5 uppercase opacity-60">
                                                                    <Clock size={12} className="text-gray-300" /> Aberto em {formatDate(cot.created_at)}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-7">
                                                            <div className="flex items-center gap-4">
                                                                <div className="flex -space-x-4 overflow-hidden p-1">
                                                                    {(cot.suppliers || []).slice(0, 4).map((s, i) => (
                                                                        <div key={i} className="relative group/avatar">
                                                                            <img
                                                                                className="inline-block h-11 w-11 rounded-2xl ring-[4px] ring-white object-cover shadow-md bg-white hover:z-20 hover:scale-125 hover:-translate-y-1 transition-all duration-300 cursor-help"
                                                                                src={`https://api.dicebear.com/7.x/initials/svg?seed=${(s.commercial_name || s.name || 'F')}`}
                                                                                alt={s.commercial_name}
                                                                            />
                                                                        </div>
                                                                    ))}
                                                                    {(cot.suppliers || []).length > 4 && (
                                                                        <div className="flex items-center justify-center h-11 w-11 rounded-2xl bg-gray-100 ring-[4px] ring-white text-[10px] text-gray-500 font-black shrink-0 shadow-sm border border-gray-200/50">
                                                                            +{(cot.suppliers || []).length - 4}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span className="text-[11px] font-black text-gray-800">{(cot.suppliers || []).length} Convites</span>
                                                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter mt-0.5">Fornecedores Homologados</span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-7">
                                                            <span className={`px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-2.5 border shadow-sm transition-all group-hover:scale-105 ${cot.status === 'draft' ? 'bg-gray-50 text-gray-500 border-gray-200' :
                                                                cot.status === 'sent' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                                    cot.status === 'in_progress' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                                        cot.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-emerald-100/50' :
                                                                            'bg-red-50 text-red-700 border-red-200'
                                                                }`}>
                                                                <div className={`w-2 h-2 rounded-full ${cot.status === 'completed' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]' : 'bg-current opacity-40'}`}></div>
                                                                {cot.status === 'draft' ? 'Rascunho' :
                                                                    cot.status === 'sent' ? 'Publicado' :
                                                                        cot.status === 'in_progress' ? 'Em Análise' :
                                                                            cot.status === 'completed' ? 'Concluído' :
                                                                                cot.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-8 py-7 text-center">
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedPedidoForAtividade(cot);
                                                                    setIsRespostasModalOpen(true);
                                                                }}
                                                                className="inline-flex items-center gap-3 px-8 py-4 bg-gray-900 text-white rounded-[1.25rem] text-[11px] font-black uppercase tracking-[0.15em] hover:bg-emerald-600 shadow-xl shadow-gray-200 hover:shadow-emerald-200 hover:-translate-y-1 transition-all duration-500 active:scale-95 group/btn"
                                                            >
                                                                <Eye size={18} className="group-hover/btn:rotate-12 transition-transform" />
                                                                Auditar Respostas
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
                <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden mt-4 animate-fadeIn">
                    <div className="flex flex-col md:flex-row md:items-center justify-between p-10 gap-6 border-b border-gray-50/50">
                        <div className="flex items-center gap-5 flex-1">
                            <div className="relative flex-1 max-w-lg group">
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-emerald-500 transition-colors" size={22} />
                                <input
                                    type="text"
                                    placeholder="Localizar por ID, Fornecedor ou Referência..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-14 pr-6 py-4.5 bg-gray-50 border-transparent rounded-[1.5rem] focus:outline-none focus:bg-white focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 transition-all font-bold text-gray-700 shadow-inner"
                                />
                            </div>
                            <button className="p-4.5 bg-gray-50 text-gray-400 rounded-[1.5rem] hover:bg-emerald-50 hover:text-emerald-600 transition-all border border-gray-100 shadow-sm active:scale-95">
                                <SlidersHorizontal size={22} />
                            </button>
                        </div>
                        <div className="flex items-center gap-3 px-5 py-2.5 bg-emerald-50 rounded-2xl border border-emerald-100/50">
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                            <span className="text-xs font-black text-emerald-700 uppercase tracking-widest">{filteredResponses.length} Aquisições Ativas</span>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50/30 border-b border-gray-100 text-left">
                                <tr>
                                    <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Cód. ID</th>
                                    <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Procedência Operacional</th>
                                    <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Entidade Provedora</th>
                                    <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Logística / Entrega</th>
                                    <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Estado Atual</th>
                                    <th className="px-10 py-6 text-center text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Gerenciamento</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50/50">
                                {isLoading ? (
                                    <DashboardTableSkeleton rows={6} />
                                ) : error ? (
                                    <tr>
                                        <td colSpan="7" className="px-10 py-24 text-center">
                                            <div className="p-8 bg-red-50 rounded-[2rem] border border-red-100/50 inline-block">
                                                <AlertCircle size={48} className="text-red-400 mb-4 mx-auto" />
                                                <p className="text-red-900 font-black uppercase text-xs tracking-widest">{error}</p>
                                                <button
                                                    onClick={fetchResponses}
                                                    className="mt-6 px-8 py-3 bg-red-500 text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-red-600 transition-all shadow-lg shadow-red-200"
                                                >
                                                    Reiniciar Conexão
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredResponses.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="px-10 py-24 text-center">
                                            <div className="opacity-30 flex flex-col items-center">
                                                <Package size={64} className="text-gray-400 mb-4" />
                                                <p className="text-gray-500 font-black uppercase text-[10px] tracking-[0.3em]">Nenhum Dado Processado</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredResponses.map((resp, rIdx) => (
                                        <tr key={resp.id} className="hover:bg-emerald-50/10 transition-all duration-300 group/row" style={{ animationDelay: `${rIdx * 50}ms` }}>
                                            <td className="px-10 py-8 text-sm font-black text-gray-900 group-hover/row:text-emerald-600 transition-colors">
                                                <span className="opacity-20 mr-0.5">#</span>{resp.id}
                                            </td>
                                            <td className="px-10 py-8">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-black text-gray-800 tracking-tight">Cotação {resp.quotation_request_id}</span>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter bg-gray-50 px-2 py-0.5 rounded">REF: {resp.reference_number || "---"}</span>
                                                        {resp.quotation_request?.title && (
                                                            <span className="text-[10px] text-emerald-600 font-black uppercase bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100/20 truncate max-w-[140px]">
                                                                {resp.quotation_request.title}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-[1rem] bg-gray-100 flex items-center justify-center text-xs font-black text-gray-400 border border-gray-200/50 shadow-inner group-hover/row:bg-emerald-100 group-hover/row:text-emerald-700 transition-colors">
                                                        {(resp.supplier?.commercial_name || "F")[0]}
                                                    </div>
                                                    <span className="text-sm font-black text-gray-700 tracking-tight">
                                                        {resp.supplier?.commercial_name || resp.supplier?.legal_name || "N/A"}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 opacity-50">Expectativa</span>
                                                    <span className="text-sm font-black text-gray-800 flex items-center gap-2">
                                                        <Truck size={14} className="text-emerald-500" /> {formatDate(resp.expected_delivery_date)}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8">
                                                {getStatusBadge(resp.status)}
                                            </td>
                                            <td className="px-10 py-8">
                                                <div className="flex items-center justify-center gap-4">
                                                    <button
                                                        onClick={() => handleOpenDetails(resp)}
                                                        className="p-4 bg-gray-50 hover:bg-emerald-500 text-gray-400 hover:text-white rounded-2xl transition-all shadow-sm active:scale-95 group/action"
                                                        title="Ver Dossiê Completo"
                                                    >
                                                        <Search size={20} className="group-hover/action:scale-110 transition-transform" />
                                                    </button>

                                                    {resp.status !== 'completed' && (
                                                        <button
                                                            onClick={() => handleConfirmDelivery(resp)}
                                                            className="p-4 bg-gray-50 hover:bg-blue-500 text-gray-400 hover:text-white rounded-2xl transition-all shadow-sm active:scale-95 group/action"
                                                            title="Confirmar Entrega Logística"
                                                        >
                                                            <CheckCircle size={20} className="group-hover/action:rotate-12 transition-transform" />
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
                    <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-xl animate-fadeIn" onClick={() => setIsActivityModalOpen(false)} />
                    <div className="relative bg-white rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] w-full max-w-xl overflow-hidden animate-slideUp border border-gray-100">
                        <div className="flex items-center justify-between px-12 py-10 border-b border-gray-50">
                            <div>
                                <h2 className="text-3xl font-black text-gray-900 tracking-tight leading-none">Nova Atividade</h2>
                                <p className="text-sm text-gray-400 font-bold mt-3 tracking-wide uppercase opacity-70">Estruturação de Processo de Compra</p>
                            </div>
                            <button onClick={() => setIsActivityModalOpen(false)} className="p-4 hover:bg-gray-100 rounded-[1.5rem] transition-all group active:scale-90">
                                <X size={28} className="text-gray-400 group-hover:rotate-90 transition-transform duration-300" />
                            </button>
                        </div>

                        <div className="p-12 space-y-10">
                            <div className="space-y-4">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Denominação da Atividade</label>
                                <input
                                    type="text"
                                    value={activityName}
                                    onChange={(e) => setActivityName(e.target.value)}
                                    placeholder="Ex: Reforço de Stock Sanitário Q1"
                                    className="w-full px-8 py-5 bg-gray-50 border-2 border-transparent rounded-[2rem] focus:outline-none focus:bg-white focus:ring-8 focus:ring-emerald-500/5 focus:border-emerald-500 font-black text-gray-800 transition-all text-lg placeholder:text-gray-200"
                                />
                            </div>

                            <div className="space-y-4">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Enquadramento / Justificação</label>
                                <textarea
                                    value={activityDescription}
                                    onChange={(e) => setActivityDescription(e.target.value)}
                                    placeholder="Descreva o propósito desta aquisição..."
                                    rows={4}
                                    className="w-full px-8 py-5 bg-gray-50 border-2 border-transparent rounded-[2rem] focus:outline-none focus:bg-white focus:ring-8 focus:ring-emerald-500/5 focus:border-emerald-500 font-bold text-gray-800 transition-all resize-none placeholder:text-gray-200 shadow-inner"
                                />
                            </div>

                            <div className="bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 rounded-[2rem] p-8 flex items-start gap-6 shadow-sm relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
                                <div className="w-14 h-14 bg-emerald-500 rounded-[1.25rem] flex items-center justify-center text-white shadow-xl shadow-emerald-500/20 shrink-0 z-10">
                                    <Package size={28} />
                                </div>
                                <div className="z-10">
                                    <p className="text-base font-black text-emerald-900 leading-none">Fluxo de Solicitação</p>
                                    <p className="text-xs text-emerald-700/70 mt-3 font-bold leading-relaxed">Você será redirecionado para compor a lista de itens e convocar fornecedores certificados para este processo.</p>
                                </div>
                            </div>
                        </div>

                        <div className="px-12 py-10 bg-gray-50/50 flex items-center justify-end gap-6 border-t border-gray-50">
                            <button
                                onClick={() => { setIsActivityModalOpen(false); setActivityName(""); setActivityDescription(""); }}
                                className="px-8 py-4 text-gray-400 font-black uppercase text-[10px] tracking-widest hover:text-gray-900 transition-all active:scale-95"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleCreateActivity}
                                disabled={!activityName.trim()}
                                className="flex items-center gap-4 px-12 py-5 bg-emerald-500 text-white rounded-[2rem] font-black uppercase text-xs tracking-widest hover:bg-gray-900 hover:-translate-y-2 active:translate-y-0 transition-all duration-300 disabled:bg-gray-200 disabled:cursor-not-allowed shadow-2xl shadow-emerald-500/30"
                            >
                                <FileText size={20} />
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
                onAprovar={handleAprovarProposta}
                onRejeitar={handleRejeitarProposta}
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
