import { useState, useEffect } from "react";
import { Search, SlidersHorizontal, Eye, FileText, CheckCircle, Clock, AlertCircle, TrendingUp, Truck, Plus, X, Package } from "lucide-react";
import { quotationResponsesAPI, quotationRequestsAPI, acquisitionsAPI } from "../../services/api";
import Toast from "../Components/Toast";
import DashboardTableSkeleton from "../Components/DashboardTableSkeleton";
import ModalRevisarCotacao from "../Components/ModalRevisarCotacao";
import ModalSolicitarRevisao from "../Components/ModalSolicitarRevisao";
import ModalPedirCotacao from "../Components/ModalPedirCotacao";

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

    // Activity modal states
    const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
    const [activityName, setActivityName] = useState("");
    const [activityDescription, setActivityDescription] = useState("");
    const [isCotacaoModalOpen, setIsCotacaoModalOpen] = useState(false);
    const [currentActivityName, setCurrentActivityName] = useState("");

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
                <button
                    onClick={() => setIsActivityModalOpen(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-[#44B16F] text-white rounded-xl hover:bg-[#3a9d5f] transition-all font-bold shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                >
                    <Plus size={20} />
                    Registar nova actividade
                </button>
            </div>

            {/* Stats Section */}
            {stats.length > 0 && (
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

            {/* Filters and Search */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por ID ou fornecedor..."
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-[#44B16F] focus:border-transparent rounded-xl outline-none transition-all text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button
                    onClick={fetchResponses}
                    className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-xl transition-colors border border-gray-200"
                >
                    <Clock size={18} />
                    <span className="text-sm font-medium">Atualizar</span>
                </button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50/50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-5 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">ID</th>
                                <th className="px-6 py-5 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Cotação</th>
                                <th className="px-6 py-5 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Fornecedor</th>
                                <th className="px-6 py-5 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Data Entrega</th>
                                <th className="px-6 py-5 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Submetido em</th>
                                <th className="px-6 py-5 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Status</th>
                                <th className="px-6 py-5 text-center text-xs font-bold text-gray-500 uppercase tracking-widest">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {isLoading ? (
                                <DashboardTableSkeleton rows={8} />
                            ) : error ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <AlertCircle size={40} className="text-red-300" />
                                            <p className="text-gray-500 font-medium">{error}</p>
                                            <button
                                                onClick={fetchResponses}
                                                className="text-[#44B16F] font-bold text-sm hover:underline"
                                            >
                                                Tentar novamente
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredResponses.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500 font-medium">
                                        Nenhuma aquisição encontrada
                                    </td>
                                </tr>
                            ) : (
                                filteredResponses.map((resp) => (
                                    <tr key={resp.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-6 py-6 text-sm font-bold text-gray-900">#{resp.id}</td>
                                        <td className="px-6 py-6">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-semibold text-gray-800">Cotação #{resp.quotation_request_id || "N/A"}</span>
                                                <span className="text-xs text-gray-400 mt-1">Ref: {resp.reference_number || "N/A"}</span>
                                                <span className="text-xs text-gray-500 mt-0.5" title={resp.quotation_request?.title}>
                                                    {resp.quotation_request?.title?.substring(0, 20)}...
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <span className="text-sm font-medium text-gray-700">
                                                {resp.supplier?.commercial_name || resp.supplier?.legal_name || "N/A"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-6 text-sm text-gray-600 font-medium">
                                            {formatDate(resp.expected_delivery_date)}
                                        </td>
                                        <td className="px-6 py-6 text-sm text-gray-500">
                                            {formatDate(resp.submitted_at || resp.created_at)}
                                        </td>
                                        <td className="px-6 py-6">
                                            {getStatusBadge(resp.status)}
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => handleOpenDetails(resp)}
                                                    className="p-2 hover:bg-[#44B16F]/10 text-gray-400 hover:text-[#44B16F] rounded-lg transition-all"
                                                    title="Ver Detalhes"
                                                >
                                                    <Eye size={18} />
                                                </button>

                                                {resp.status !== 'completed' && (
                                                    <button
                                                        onClick={() => handleConfirmDelivery(resp)}
                                                        className="p-2 hover:bg-blue-50 text-gray-400 hover:text-blue-600 rounded-lg transition-all"
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

            {/* Activity Registration Modal */}
            {isActivityModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsActivityModalOpen(false)} />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden animate-fadeIn">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-gray-900">Registar Nova Actividade</h2>
                            <button onClick={() => setIsActivityModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                <X size={20} className="text-gray-500" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    Nome da Actividade *
                                </label>
                                <input
                                    type="text"
                                    value={activityName}
                                    onChange={(e) => setActivityName(e.target.value)}
                                    placeholder="Ex: Aquisição de materiais de escritório"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#44B16F] focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    Descrição
                                </label>
                                <textarea
                                    value={activityDescription}
                                    onChange={(e) => setActivityDescription(e.target.value)}
                                    placeholder="Descreva a actividade..."
                                    rows={3}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#44B16F] focus:border-transparent resize-none"
                                />
                            </div>

                            {/* Info box */}
                            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
                                <Package size={20} className="text-blue-500 mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-sm font-semibold text-blue-800">Solicitar cotação</p>
                                    <p className="text-xs text-blue-600 mt-1">Após registar a actividade, poderá solicitar cotações aos fornecedores.</p>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 bg-gray-50 flex items-center justify-end gap-3 border-t border-gray-100">
                            <button
                                onClick={() => {
                                    setIsActivityModalOpen(false);
                                    setActivityName("");
                                    setActivityDescription("");
                                }}
                                className="px-6 py-2.5 text-gray-600 font-medium hover:text-gray-800 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleCreateActivity}
                                disabled={!activityName.trim()}
                                className="flex items-center gap-2 px-6 py-2.5 bg-[#44B16F] text-white rounded-xl font-bold hover:bg-[#3a9d5f] transition-all disabled:bg-gray-300 disabled:cursor-not-allowed shadow-sm"
                            >
                                <FileText size={16} />
                                Solicitar Cotação
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Quotation Modal (opened from activity) */}
            <ModalPedirCotacao
                isOpen={isCotacaoModalOpen}
                onClose={() => {
                    setIsCotacaoModalOpen(false);
                    setCurrentActivityName("");
                    setActivityName("");
                    setActivityDescription("");
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

            {toast && (
                <Toast
                    type={toast.type}
                    message={toast.message}
                    onClose={() => setToast(null)}
                />
            )}
        </div>
    );
}
