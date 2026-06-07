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
    const [buyerEmail, setBuyerEmail] = useState("");
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
                    <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Aquisições</h1>
                    <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>Gerencie as respostas e aquisições de fornecedores</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsCotacaoModalOpen(true)}
                        className="btn-primary"
                    >
                        <Plus size={18} />
                        Registar nova actividade
                    </button>
                </div>
            </div>

            {/* Stats Section hidden as requested */}
            {/* stats.length > 0 && (
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
            ) */}

            {/* Content Area */}

            <div className="rounded-2xl shadow-sm overflow-hidden mt-6" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border-light)' }}>
                <div className="flex flex-col md:flex-row md:items-center justify-between p-6 gap-4 border-b" style={{ borderColor: 'var(--color-border-light)' }}>
                    <div className="flex items-center gap-4 flex-1">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Pesquisar por ID, fornecedor ou referência..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 border border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-[#44B16F]/20 focus:border-[#44B16F] transition-all text-sm"
                                style={{ background: 'var(--color-bg)', color: 'var(--color-text-primary)' }}
                            />
                        </div>
                        <button className="p-3 rounded-xl transition-all" style={{ background: 'var(--color-bg)', color: 'var(--color-text-secondary)' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--color-border-light)'} onMouseLeave={e => e.currentTarget.style.background = 'var(--color-bg)'}>
                            <SlidersHorizontal size={20} />
                        </button>
                    </div>
                    <div className="flex items-center gap-3 text-xs font-bold text-gray-400 uppercase tracking-widest">
                        Mostrando <span className="text-[#44B16F]">{filteredResponses.length}</span> resultados
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead style={{ background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border-light)' }}>
                            <tr>
                                <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>ID</th>
                                <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Procedência</th>
                                <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Fornecedor</th>
                                <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Data Entrega</th>
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
                            ) : filteredResponses.length === 0 ? (
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
                                            Cotação #{resp.quotation_request_id}
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
                            )}
                        </tbody>
                    </table>
                </div>
            </div>


            {/* Modals Section */}

            {/* Activity Registration */}
            {isActivityModalOpen && (
                <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setIsActivityModalOpen(false); }}>
                    <div className="modal-container animate-modalFadeIn" style={{ maxWidth: '520px', background: 'var(--color-surface)', border: '1px solid var(--color-border-light)' }}>
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
                                <label className="block text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Denominação da Atividade</label>
                                <input
                                    type="text"
                                    value={activityName}
                                    onChange={(e) => setActivityName(e.target.value)}
                                    placeholder="Ex: Reforço de Stock Sanitário Q1"
                                    className="input-field"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Justificativa</label>
                                <textarea
                                    value={activityDescription}
                                    onChange={(e) => setActivityDescription(e.target.value)}
                                    placeholder="Descreva o propósito desta aquisição..."
                                    rows={3}
                                    className="input-field resize-none"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                                    Convite ao Comprador Final <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>(opcional)</span>
                                </label>
                                <input
                                    type="email"
                                    value={buyerEmail}
                                    onChange={(e) => setBuyerEmail(e.target.value)}
                                    placeholder="email@comprador.ao"
                                    className="input-field"
                                />
                                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>O comprador final receberá um convite para acompanhar o processo de cotação.</p>
                            </div>

                            <div className="flex items-start gap-3 p-4" style={{ background: 'var(--color-primary-light)', borderRadius: '4px', border: '1px solid rgba(68,177,111,0.15)' }}>
                                <div className="w-9 h-9 flex items-center justify-center text-white flex-shrink-0" style={{ background: 'var(--color-primary)', borderRadius: '4px' }}>
                                    <Package size={18} />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold" style={{ color: 'var(--color-primary-dark)' }}>Fluxo de Solicitação</p>
                                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>Você será redirecionado para compor a lista de itens e convocar fornecedores certificados para este processo.</p>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t" style={{ borderColor: 'var(--color-border-light)', background: 'var(--color-bg)' }}>
                            <button
                                onClick={() => { setIsActivityModalOpen(false); setActivityName(""); setActivityDescription(""); setBuyerEmail(""); }}
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
                    setBuyerEmail("");
                    fetchResponses();
                }}
                activityName={currentActivityName}
                buyerEmail={buyerEmail}
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



            {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
        </div>
    );
}
