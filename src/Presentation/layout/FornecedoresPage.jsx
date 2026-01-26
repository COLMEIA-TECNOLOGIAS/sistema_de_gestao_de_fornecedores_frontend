import { useState, useEffect } from "react";
import { Search, SlidersHorizontal, MoreVertical, RefreshCw, FileText, Trash2, CheckCircle, MessageSquare, Send, Eye } from "lucide-react";
import ModalCadastroFornecedor from "../Components/ModalCadastroFornecedor";
import ModalPedirCotacao from "../Components/ModalPedirCotacao";
import ModalRevisarCotacao from "../Components/ModalRevisarCotacao";
import ModalSolicitarRevisao from "../Components/ModalSolicitarRevisao";
import ModalDetalhesFornecedor from "../Components/ModalDetalhesFornecedor";
import ModalConfirmarExclusaoFornecedor from "../Components/ModalConfirmarExclusaoFornecedor";
import ModalRespostasPedido from "../Components/ModalRespostasPedido";
import Toast from "../Components/Toast";
import FornecedorTableSkeleton from "../Components/FornecedorTableSkeleton";
import { suppliersAPI, quotationRequestsAPI, quotationResponsesAPI, categoriesAPI } from "../../services/api"; // Added categoriesAPI

export default function FornecedoresPage() {
    // Main tabs state
    const [activeMainTab, setActiveMainTab] = useState("fornecedores");

    // Cotações sub-tabs state  
    const [activeCotacaoTab, setActiveCotacaoTab] = useState("pedidos-enviados");

    // Modal Respostas Pedido state
    const [isRespostasPedidoModalOpen, setIsRespostasPedidoModalOpen] = useState(false);
    const [selectedPedidoForRespostas, setSelectedPedidoForRespostas] = useState(null);

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCotacaoModalOpen, setIsCotacaoModalOpen] = useState(false);
    const [isRevisarModalOpen, setIsRevisarModalOpen] = useState(false);
    const [isSolicitarRevisaoModalOpen, setIsSolicitarRevisaoModalOpen] = useState(false);
    const [isDetalhesModalOpen, setIsDetalhesModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedFornecedor, setSelectedFornecedor] = useState(null);
    const [selectedCotacao, setSelectedCotacao] = useState(null);
    const [openMenuId, setOpenMenuId] = useState(null);

    // Toast state
    const [toast, setToast] = useState(null);

    // Data states for Fornecedores
    const [isLoading, setIsLoading] = useState(true);
    const [fornecedores, setFornecedores] = useState([]);
    const [filteredFornecedores, setFilteredFornecedores] = useState([]); // To hold filtered data
    const [error, setError] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Search and Filter states
    const [searchQuery, setSearchQuery] = useState("");
    const [categories, setCategories] = useState([]); // Available categories
    const [selectedCategory, setSelectedCategory] = useState(""); // Selected category ID for filtering
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    // Data states for Cotações
    const [isLoadingCotacoes, setIsLoadingCotacoes] = useState(false);
    const [cotacoes, setCotacoes] = useState([]);
    const [cotacoesError, setCotacoesError] = useState(null);

    // Data states for Respostas
    const [isLoadingRespostas, setIsLoadingRespostas] = useState(false);
    const [respostas, setRespostas] = useState([]);
    const [respostasError, setRespostasError] = useState(null);
    const [selectedResposta, setSelectedResposta] = useState(null);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);

    // Fetch suppliers and categories data on component mount
    useEffect(() => {
        const fetchSuppliersAndCategories = async () => {
            try {
                setIsLoading(true);
                setError(null);

                // Fetch suppliers
                const suppliersResponse = await suppliersAPI.getAll();
                setFornecedores(suppliersResponse.data || []);

                // Fetch categories
                const categoriesResponse = await categoriesAPI.getAll();
                setCategories(categoriesResponse || []);

            } catch (err) {
                console.error('Error fetching data:', err);
                setError(err.message || 'Failed to load data');
            } finally {
                setIsLoading(false);
            }
        };

        if (activeMainTab === "fornecedores") {
            fetchSuppliersAndCategories();
        }
    }, [activeMainTab]);

    // Filtering Logic
    useEffect(() => {
        let result = fornecedores;

        // Filter by Search Query
        if (searchQuery) {
            const lowerQuery = searchQuery.toLowerCase();
            result = result.filter(f =>
                (f.commercial_name?.toLowerCase() || "").includes(lowerQuery) ||
                (f.legal_name?.toLowerCase() || "").includes(lowerQuery) ||
                (f.email?.toLowerCase() || "").includes(lowerQuery) ||
                (f.nif?.toLowerCase() || "").includes(lowerQuery)
            );
        }

        // Filter by Category
        if (selectedCategory) {
            result = result.filter(f =>
                f.categories && f.categories.some(cat => String(cat.id) === String(selectedCategory))
            );
        }

        setFilteredFornecedores(result);
        setCurrentPage(1); // Reset to first page when filtering
    }, [fornecedores, searchQuery, selectedCategory]);

    // State for classifications
    const [classifications, setClassifications] = useState({});

    // Pagination logic (moved up to be accessible by effect)
    const totalPages = Math.ceil(filteredFornecedores.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentFornecedores = filteredFornecedores.slice(startIndex, endIndex);

    // Fetch classifications for visible suppliers
    useEffect(() => {
        const fetchClassifications = async () => {
            if (currentFornecedores.length === 0) return;
            // We can fetch in parallel
            const scores = {};
            await Promise.all(currentFornecedores.map(async (f) => {
                try {
                    const data = await suppliersAPI.getClassification(f.id);
                    scores[f.id] = data;
                } catch (e) {
                    scores[f.id] = { overall_score: 0 };
                }
            }));
            setClassifications(prev => ({ ...prev, ...scores }));
        };

        if (activeMainTab === "fornecedores") {
            fetchClassifications();
        }
    }, [currentPage, filteredFornecedores, activeMainTab]);

    const reloadSuppliers = async () => {
        try {
            const response = await suppliersAPI.getAll();
            setFornecedores(response.data || []);
        } catch (err) {
            console.error('Error reloading suppliers:', err);
        }
    };

    const handleDeleteFornecedor = (fornecedor) => {
        setSelectedFornecedor(fornecedor);
        setIsDeleteModalOpen(true);
        setOpenMenuId(null);
    };

    const confirmDeleteFornecedor = async () => {
        if (!selectedFornecedor) return;

        setIsDeleting(true);
        try {
            await suppliersAPI.delete(selectedFornecedor.id);
            showToast('success', 'Fornecedor eliminado com sucesso!');
            await reloadSuppliers();
            setIsDeleteModalOpen(false);
            setSelectedFornecedor(null);
        } catch (err) {
            console.error('Error deleting supplier:', err);
            showToast('error', err.response?.data?.message || 'Erro ao eliminar fornecedor');
        } finally {
            setIsDeleting(false);
        }
    };

    // Fetch quotation requests when cotações tab is active
    useEffect(() => {
        const fetchQuotations = async () => {
            try {
                setIsLoadingCotacoes(true);
                setCotacoesError(null);
                const response = await quotationRequestsAPI.getAll();
                console.log('Cotações recebidas da API:', response);
                setCotacoes(response.data || []);
            } catch (err) {
                console.error('Error fetching quotations:', err);
                setCotacoesError(err.message || 'Failed to load quotations');
            } finally {
                setIsLoadingCotacoes(false);
            }
        };

        if (activeMainTab === "cotacoes") {
            fetchQuotations();
        }
    }, [activeMainTab]);

    // Handler to open respostas modal for a specific quotation request
    const handleVerRespostas = (cotacao) => {
        setSelectedPedidoForRespostas(cotacao);
        setIsRespostasPedidoModalOpen(true);
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

    const handlePageChange = (page) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const getStatusColor = (status) => {
        const statusColors = {
            "submitted": "bg-gray-100 text-gray-700",
            "sent": "bg-yellow-100 text-yellow-700",
            "Finalizado": "bg-green-100 text-green-700",
            "Enviado": "bg-yellow-100 text-yellow-700",
            "Em andamento": "bg-blue-100 text-blue-700",
            "Respondido": "bg-green-100 text-green-700",
            "Não respondido": "bg-yellow-100 text-yellow-700",
            "Rejeitado": "bg-red-100 text-red-700",
            "Cancelado": "bg-gray-100 text-gray-700",
            "approved": "bg-green-100 text-green-700",
            "rejected": "bg-red-100 text-red-700",
            "pending": "bg-yellow-100 text-yellow-700",
            "revision_requested": "bg-amber-100 text-amber-700",
            "needs_revision": "bg-gray-100 text-gray-700",
        };
        return statusColors[status] || "bg-gray-100 text-gray-700";
    };

    // Helper function to show toast
    const showToast = (type, message) => {
        setToast({ type, message });
    };

    // Reload responses helper
    const reloadRespostas = async () => {
        try {
            const response = await quotationResponsesAPI.getAll();
            setRespostas(response.data || []);
        } catch (err) {
            console.error('Error reloading responses:', err);
        }
    };

    const [modalContext, setModalContext] = useState(null); // 'response_review', 'details'

    const handleOpenDetails = async (resposta, context = 'details') => {
        setIsLoadingDetails(true);
        setModalContext(context);

        console.group('🔍 Opening Details Modal');
        console.log('1. Original resposta object:', resposta);
        console.log('2. Context:', context);

        try {
            let responseDetails = resposta;

            // Strategy: Try to get the richest data source available
            if (resposta.id && !String(resposta.id).startsWith('qs-')) { // Avoid fetching for composite IDs if safely possible, or handle 404
                try {
                    console.log('3. Fetching full details for ID:', resposta.id);
                    const res = await quotationResponsesAPI.getById(resposta.id);
                    responseDetails = res.data || res;
                    console.log('4. Fetched details:', responseDetails);
                } catch (innerError) {
                    console.warn("⚠️ Failed to load quotation response details, using fallback...", innerError);
                }
            }

            // Ensure nested structures for Modal
            if (!responseDetails.quotation_supplier && responseDetails.supplier) {
                responseDetails.quotation_supplier = {
                    supplier: responseDetails.supplier,
                    quotation_request: responseDetails.quotation_request || {}
                };
            }

            // Preservation/Patching of Title (Fix for "N/A" title)
            // Check if we have the title in the original 'resposta' object passed from the table
            const fallbackTitle = resposta.quotation_supplier?.quotation_request?.title ||
                resposta.quotation_request?.title;

            if (fallbackTitle &&
                (!responseDetails.quotation_supplier?.quotation_request?.title &&
                    !responseDetails.quotation_request?.title)) {

                if (!responseDetails.quotation_request) responseDetails.quotation_request = {};
                responseDetails.quotation_request.title = fallbackTitle;

                if (resposta.quotation_supplier?.quotation_request?.description) {
                    responseDetails.quotation_request.description = resposta.quotation_supplier.quotation_request.description;
                }
            }

            console.log('5. Final cotacao object to be set:', responseDetails);
            console.log('6. Key IDs check:', {
                quotation_response_id: responseDetails.quotation_response_id,
                response_id: responseDetails.response_id,
                id: responseDetails.id,
                qs_id: responseDetails.quotation_supplier?.id
            });
            console.groupEnd();

            setSelectedCotacao(responseDetails);
            setIsRevisarModalOpen(true);
        } catch (e) {
            console.error("❌ Error fetching details", e);
            console.groupEnd();
            showToast("error", "Erro ao carregar detalhes");
        } finally {
            setIsLoadingDetails(false);
        }
    };

    const handleOpenRevisarModal = (resposta) => {
        return handleOpenDetails(resposta, 'response_review');
    };

    // Handler for approving proposal
    const handleAprovarProposta = async (id) => {
        try {
            await quotationResponsesAPI.approve(id, "Aprovado, excelente preço");
            showToast('success', 'Proposta aprovada com sucesso!');
            await reloadRespostas();
        } catch (err) {
            console.error('Erro ao aprovar proposta:', err);
            showToast('error', err.response?.data?.message || 'Erro ao aprovar proposta');
        }
    };

    // Handler for rejecting proposal
    const handleRejeitarProposta = async (id) => {
        try {
            await quotationResponsesAPI.reject(id, "Preço muito alto");
            showToast('success', 'Proposta rejeitada com sucesso!');
            await reloadRespostas();
        } catch (err) {
            console.error('Erro ao rejeitar proposta:', err);
            showToast('error', err.response?.data?.message || 'Erro ao rejeitar proposta');
        }
    };

    // Handler for requesting revision
    // Handler for requesting revision - Opens modal
    const handleSolicitarRevisaoProposta = (id) => {
        // Find the response object if only ID is passed, although we likely have it in the mapping loop
        const resposta = respostas.find(r => r.id === id);
        setSelectedResposta(resposta || { id });
        setIsSolicitarRevisaoModalOpen(true);
    };

    // Handler for submitting the revision request
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);

    // Handler for submitting the revision request
    const confirmSolicitarRevisao = async ({ reason, message }) => {
        if (!selectedResposta) return;

        setIsSubmittingReview(true);
        console.log(`Enviando solicitação de revisão para resposta #${selectedResposta.id}`, { reason, message });

        try {
            await quotationResponsesAPI.requestRevision(selectedResposta.id, reason, message);
            showToast('success', 'Solicitação de revisão enviada com sucesso!');
            setIsSolicitarRevisaoModalOpen(false);
            setSelectedResposta(null);
            await reloadRespostas();
        } catch (err) {
            console.error('Erro ao solicitar revisão:', err);
            console.log('Detalhes do erro:', err.response?.data);
            showToast('error', err.response?.data?.message || 'Erro ao solicitar revisão');
        } finally {
            setIsSubmittingReview(false);
        }
    };

    // Handler for generating acquisition
    const handleGerarAquisicaoProposta = async (id) => {
        try {
            await quotationResponsesAPI.createAcquisition(id, "2026-03-01", "Necessidade urgente de materiais");
            showToast('success', 'Aquisição gerada com sucesso!');
            await reloadRespostas();
        } catch (err) {
            console.error('Erro ao gerar aquisição:', err);
            showToast('error', err.response?.data?.message || 'Erro ao gerar aquisição');
        }
    };

    // Render Cotações Table
    const renderCotacoesTable = () => {
        // Filter cotações based on active tab
        let currentCotacoes = cotacoes || [];

        if (activeCotacaoTab === 'pedidos-cancelados') {
            currentCotacoes = currentCotacoes.filter(c => c.status === 'cancelled');
        } else if (activeCotacaoTab === 'pedidos-enviados') {
            // Exclude cancelled ones from the main sent list
            currentCotacoes = currentCotacoes.filter(c => c.status !== 'cancelled');
        }

        const handleSendCotacao = async (cotacao) => {
            if (cotacao.status !== 'draft') {
                setToast({ type: 'warning', message: 'Apenas cotações com status "Rascunho" podem ser enviadas.' });
                return;
            }

            if (!confirm(`Deseja enviar a cotação "${cotacao.title}" para os fornecedores?`)) {
                return;
            }

            try {
                setOpenMenuId(null);
                const response = await quotationRequestsAPI.send(cotacao.id);
                showToast('success', response.message || 'Cotação enviada com sucesso!');

                // Reload quotations list
                const quotationsResponse = await quotationRequestsAPI.getAll();
                setCotacoes(quotationsResponse.data || []);
            } catch (err) {
                console.error('Erro ao enviar cotação:', err);
                showToast('error', err.response?.data?.message || 'Erro ao enviar cotação');
            }
        };

        const handleCancelCotacao = async (cotacao) => {
            if (!confirm(`Tem certeza que deseja cancelar a cotação "${cotacao.title}"?`)) {
                return;
            }

            try {
                setOpenMenuId(null);
                const response = await quotationRequestsAPI.cancel(cotacao.id);
                alert(response.message || 'Cotação cancelada com sucesso!');

                // Reload quotations list
                const quotationsResponse = await quotationRequestsAPI.getAll();
                setCotacoes(quotationsResponse.data || []);
            } catch (err) {
                console.error('Erro ao cancelar cotação:', err);
                alert(err.response?.data?.message || 'Erro ao cancelar cotação');
            }
        };

        return (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                {cotacoesError && (
                    <div className="p-4 bg-red-50 border-b border-red-200">
                        <p className="text-red-600 text-sm">
                            <strong>Erro:</strong> {cotacoesError}
                        </p>
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 text-left">
                                    <input type="checkbox" className="rounded border-gray-300" />
                                </th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">ID</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Título</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Descrição</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Items</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Deadline</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Data de Criação</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Fornecedores</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Respostas</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Status</th>
                                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-600">Acções</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoadingCotacoes ? (
                                <FornecedorTableSkeleton rows={5} />
                            ) : currentCotacoes.length === 0 ? (
                                <tr>
                                    <td colSpan="10" className="px-6 py-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center gap-2">
                                            <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            <p className="text-lg font-medium">Nenhuma cotação encontrada</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                currentCotacoes.map((cotacao) => (
                                    <tr key={cotacao.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-8">
                                            <input type="checkbox" className="rounded border-gray-300" />
                                        </td>
                                        <td className="px-6 py-8">
                                            <span className="font-medium text-gray-700">#{cotacao.id}</span>
                                        </td>
                                        <td className="px-6 py-8">
                                            <span className="font-semibold text-gray-900">{cotacao.title || 'N/A'}</span>
                                        </td>
                                        <td className="px-6 py-8 text-gray-700 max-w-xs truncate">
                                            {cotacao.description || 'N/A'}
                                        </td>
                                        <td className="px-6 py-8">
                                            {cotacao.items && cotacao.items.length > 0 ? (
                                                <div className="space-y-1">
                                                    {cotacao.items.slice(0, 2).map((item, idx) => (
                                                        <div key={idx} className="text-xs text-gray-600">
                                                            <span className="font-medium">{item.name}</span>
                                                            <span className="text-gray-500"> - {item.quantity} {item.unit}</span>
                                                        </div>
                                                    ))}
                                                    {cotacao.items.length > 2 && (
                                                        <div className="text-xs text-gray-500 italic">
                                                            +{cotacao.items.length - 2} mais
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-500">Sem items</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-8 text-gray-700">
                                            {cotacao.deadline ? new Date(cotacao.deadline).toLocaleDateString('pt-AO', {
                                                day: '2-digit',
                                                month: '2-digit',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            }) : 'N/A'}
                                        </td>
                                        <td className="px-6 py-8 text-gray-700">
                                            {cotacao.created_at ? new Date(cotacao.created_at).toLocaleDateString('pt-AO', {
                                                day: '2-digit',
                                                month: '2-digit',
                                                year: 'numeric'
                                            }) : 'N/A'}
                                        </td>
                                        <td className="px-6 py-8 text-gray-700">
                                            {cotacao.suppliers?.length > 0 ? `${cotacao.suppliers.length} fornecedor(es)` : 'Nenhum'}
                                        </td>
                                        <td className="px-6 py-8">
                                            <button
                                                onClick={() => handleVerRespostas(cotacao)}
                                                className="group relative flex items-center gap-1.5 px-3 py-1.5 text-sm text-[#44B16F] bg-[#44B16F]/8 hover:bg-[#44B16F]/15 border border-[#44B16F]/30 hover:border-[#44B16F] rounded-lg transition-all duration-200 font-medium shadow-sm hover:shadow-md"
                                            >
                                                <Eye size={14} className="flex-shrink-0" />
                                                <span className="text-xs">Ver Respostas</span>
                                            </button>
                                        </td>
                                        <td className="px-6 py-8">
                                            <span className={`px-4 py-2 rounded-xl text-sm font-medium ${cotacao.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                                                cotacao.status === 'sent' ? 'bg-amber-50 text-amber-900' :
                                                    cotacao.status === 'in_progress' ? 'bg-blue-50 text-blue-900' :
                                                        cotacao.status === 'completed' ? 'bg-emerald-50 text-emerald-900' :
                                                            cotacao.status === 'cancelled' ? 'bg-red-50 text-red-900' :
                                                                'bg-gray-100 text-gray-800'
                                                }`}>
                                                {cotacao.status === 'draft' ? 'Rascunho' :
                                                    cotacao.status === 'sent' ? 'Enviado' :
                                                        cotacao.status === 'in_progress' ? 'Em andamento' :
                                                            cotacao.status === 'completed' ? 'Finalizado' :
                                                                cotacao.status === 'cancelled' ? 'Cancelado' :
                                                                    cotacao.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-8">
                                            <div className="relative flex justify-center dropdown-menu">
                                                <button
                                                    onClick={() => setOpenMenuId(openMenuId === cotacao.id ? null : cotacao.id)}
                                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                                >
                                                    <MoreVertical size={20} className="text-gray-600" />
                                                </button>

                                                {openMenuId === cotacao.id && (
                                                    <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50">
                                                        {/* Editar */}
                                                        <button
                                                            onClick={() => {
                                                                console.log('Editar cotação:', cotacao);
                                                                // TODO: Implement edit functionality
                                                                setOpenMenuId(null);
                                                            }}
                                                            className="w-full px-4 py-2.5 text-left hover:bg-gray-50 text-sm flex items-center gap-3 transition-colors"
                                                        >
                                                            <FileText size={16} className="text-gray-500" />
                                                            <span className="text-gray-700">Editar</span>
                                                        </button>

                                                        {/* Mais detalhes */}
                                                        <button
                                                            onClick={() => {
                                                                setSelectedCotacao(cotacao);
                                                                setIsRevisarModalOpen(true);
                                                                setOpenMenuId(null);
                                                            }}
                                                            className="w-full px-4 py-2.5 text-left hover:bg-gray-50 text-sm flex items-center gap-3 transition-colors"
                                                        >
                                                            <FileText size={16} className="text-gray-400" />
                                                            <span className="text-gray-700">Mais detalhes</span>
                                                        </button>

                                                        {/* Cancelar/Remover */}
                                                        <button
                                                            onClick={() => {
                                                                handleCancelCotacao(cotacao);
                                                                setOpenMenuId(null);
                                                            }}
                                                            className="w-full px-4 py-2.5 text-left hover:bg-gray-50 text-sm flex items-center gap-3 transition-colors"
                                                        >
                                                            <Trash2 size={16} className="text-gray-400" />
                                                            <span className="text-gray-700">Cancelar/Remover</span>
                                                        </button>

                                                        {/* Enviar para fornecedores - Apenas para Rascunho */}
                                                        {cotacao.status === 'draft' && (
                                                            <button
                                                                onClick={() => handleSendCotacao(cotacao)}
                                                                className="w-full px-4 py-2.5 text-left hover:bg-gray-50 text-sm flex items-center gap-3 transition-colors text-blue-600 font-medium"
                                                            >
                                                                <Send size={16} className="text-blue-500" />
                                                                <span className="">Enviar para fornecedores</span>
                                                            </button>
                                                        )}

                                                        {/* Aprovar proposta */}
                                                        <button
                                                            onClick={() => {
                                                                handleAprovarProposta(cotacao.id);
                                                                setOpenMenuId(null);
                                                            }}
                                                            className="w-full px-4 py-2.5 text-left hover:bg-gray-50 text-sm flex items-center gap-3 transition-colors"
                                                        >
                                                            <CheckCircle size={16} className="text-gray-400" />
                                                            <span className="text-gray-700">Aprovar proposta</span>
                                                        </button>

                                                        {/* Solicitar revisão */}
                                                        <button
                                                            onClick={() => {
                                                                handleSolicitarRevisaoProposta(cotacao.id);
                                                                setOpenMenuId(null);
                                                            }}
                                                            className="w-full px-4 py-2.5 text-left hover:bg-gray-50 text-sm flex items-center gap-3 transition-colors"
                                                        >
                                                            <MessageSquare size={16} className="text-gray-400" />
                                                            <span className="text-gray-700">Solicitar revisão</span>
                                                        </button>

                                                        {/* Gerar aquisição */}
                                                        <button
                                                            onClick={() => {
                                                                handleGerarAquisicaoProposta(cotacao.id);
                                                                setOpenMenuId(null);
                                                            }}
                                                            className="w-full px-4 py-2.5 text-left hover:bg-gray-50 text-sm flex items-center gap-3 transition-colors"
                                                        >
                                                            <RefreshCw size={16} className="text-gray-400" />
                                                            <span className="text-gray-700">Gerar aquisição</span>
                                                        </button>
                                                    </div>
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
        );
    };



    return (
        <div className="space-y-6">
            {/* Main Tabs */}
            <div className="flex gap-2 border-b border-gray-200">
                <button
                    onClick={() => setActiveMainTab("fornecedores")}
                    className={`px-6 py-3 font-medium text-sm transition-all ${activeMainTab === "fornecedores"
                        ? "text-gray-900 border-b-2 border-gray-900"
                        : "text-gray-500 hover:text-gray-700"
                        }`}
                >
                    Fornecedores
                </button>
                <button
                    onClick={() => setActiveMainTab("cotacoes")}
                    className={`px-6 py-3 font-medium text-sm transition-all ${activeMainTab === "cotacoes"
                        ? "text-[#44B16F] border-b-2 border-[#44B16F]"
                        : "text-gray-500 hover:text-gray-700"
                        }`}
                >
                    Cotações
                </button>
            </div>

            {/* Content based on active main tab */}
            {activeMainTab === "fornecedores" ? (
                <>
                    {/* Welcome Section */}
                    <div className="bg-white rounded-2xl p-8 shadow-sm flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-bold text-gray-900 mb-2">
                                Fornecedores
                            </h1>
                            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                                Gestão de Fornecedores
                            </h2>
                            <p className="text-gray-600">Gerencie os fornecedores cadastrados no sistema</p>
                        </div>
                        <div className="hidden lg:block">
                            <img
                                src="https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=400&h=200&fit=crop"
                                alt="Office"
                                className="w-96 h-32 object-cover rounded-xl"
                            />
                        </div>
                    </div>

                    {/* Actions Bar */}
                    <div className="flex flex-wrap items-center gap-4">
                        {/* Search */}
                        <div className="flex-1 min-w-[300px]">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="text"
                                    placeholder="Pesquisar por nome, email, nif..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#44B16F] focus:border-transparent transition-all"
                                />
                            </div>
                        </div>

                        {/* Filter Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setIsFilterOpen(!isFilterOpen)}
                                className={`flex items-center gap-2 px-4 py-3 border rounded-lg transition-colors ${selectedCategory ? 'bg-emerald-50 border-[#44B16F] text-[#44B16F]' : 'border-gray-200 hover:bg-gray-50 text-gray-600'}`}
                            >
                                <SlidersHorizontal size={20} />
                                <span className="font-medium">Filtros</span>
                                {selectedCategory && (
                                    <span className="ml-1 bg-[#44B16F] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">1</span>
                                )}
                            </button>

                            {isFilterOpen && (
                                <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 p-4 z-50">
                                    <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider">Categorias</h3>
                                    <div className="space-y-2 max-h-60 overflow-y-auto">
                                        <label className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                                            <input
                                                type="radio"
                                                name="category"
                                                className="text-[#44B16F] focus:ring-[#44B16F]"
                                                checked={selectedCategory === ""}
                                                onChange={() => {
                                                    setSelectedCategory("");
                                                    setIsFilterOpen(false);
                                                }}
                                            />
                                            <span className="text-gray-700 text-sm">Todas</span>
                                        </label>
                                        {categories.map(cat => (
                                            <label key={cat.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="category"
                                                    className="text-[#44B16F] focus:ring-[#44B16F]"
                                                    checked={String(selectedCategory) === String(cat.id)}
                                                    onChange={() => {
                                                        setSelectedCategory(cat.id);
                                                        setIsFilterOpen(false);
                                                    }}
                                                />
                                                <span className="text-gray-700 text-sm">{cat.name}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <button
                            onClick={() => setIsCotacaoModalOpen(true)}
                            className="px-6 py-3 text-[#44B16F] border border-[#44B16F] rounded-lg hover:bg-[#44B16F]/5 transition-colors font-medium"
                        >
                            + Solicitar cotação
                        </button>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="px-6 py-3 bg-[#44B16F] text-white rounded-lg hover:bg-[#3a9d5f] transition-colors font-medium"
                        >
                            + Add Fornecedor
                        </button>
                        <button className="px-6 py-3 bg-[#44B16F] text-white rounded-lg hover:bg-[#3a9d5f] transition-colors font-medium flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Atividade
                        </button>
                    </div>

                    {/* Fornecedores Table */}
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                        {error && (
                            <div className="p-4 bg-red-50 border-b border-red-200">
                                <p className="text-red-600 text-sm">
                                    <strong>Erro:</strong> {error}
                                </p>
                            </div>
                        )}

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4 text-left">
                                            <input type="checkbox" className="rounded border-gray-300" />
                                        </th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">ID</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Nome Comercial</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Nome Legal</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">NIF</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Telefone</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Email</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Avaliação</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Tipo de Atividade</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Província</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Município</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Data de Registo</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Status</th>
                                        <th className="px-6 py-4 text-center text-sm font-semibold text-gray-600">Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {isLoading ? (
                                        <FornecedorTableSkeleton rows={10} />
                                    ) : currentFornecedores.length === 0 ? (
                                        <tr>
                                            <td colSpan="13" className="px-6 py-12 text-center text-gray-500">
                                                <div className="flex flex-col items-center gap-2">
                                                    <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                                    </svg>
                                                    <p className="text-lg font-medium">Nenhum fornecedor encontrado</p>
                                                    <p className="text-sm">Adicione um fornecedor para começar</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        currentFornecedores.map((f) => (
                                            <tr key={f.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-8">
                                                    <input type="checkbox" className="rounded border-gray-300" />
                                                </td>
                                                <td className="px-6 py-8">
                                                    <div className="flex items-center gap-3">
                                                        <img
                                                            src={`https://api.dicebear.com/7.x/initials/svg?seed=${f.commercial_name || 'N/A'}`}
                                                            alt={f.commercial_name}
                                                            className="w-10 h-10 rounded-lg"
                                                        />
                                                        <span className="font-medium text-gray-700">#{f.id}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-8">
                                                    <span className="font-semibold text-gray-900">{f.commercial_name || 'N/A'}</span>
                                                </td>
                                                <td className="px-6 py-8 text-gray-700">{f.legal_name || 'N/A'}</td>
                                                <td className="px-6 py-8 text-gray-700">{f.nif || 'N/A'}</td>
                                                <td className="px-6 py-8 text-gray-700">{f.phone || 'N/A'}</td>
                                                <td className="px-6 py-8 text-gray-700">{f.email || 'N/A'}</td>
                                                <td className="px-6 py-8">
                                                    <div className="w-24">
                                                        <div className="flex justify-between mb-1">
                                                            <span className="text-sm font-bold text-[#44B16F]">
                                                                {classifications[f.id]?.overall_score || 0}%
                                                            </span>
                                                        </div>
                                                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                                                            <div
                                                                className="bg-[#44B16F] h-1.5 rounded-full"
                                                                style={{ width: `${classifications[f.id]?.overall_score || 0}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-8">
                                                    <span className={`px-4 py-2 rounded-xl text-sm font-medium ${f.activity_type === 'service' ? 'bg-blue-50 text-blue-900' :
                                                        f.activity_type === 'product' ? 'bg-purple-50 text-purple-900' :
                                                            'bg-gray-100 text-gray-800'
                                                        }`}>
                                                        {f.activity_type === 'service' ? 'Serviço' : f.activity_type === 'product' ? 'Produto' : f.activity_type || 'N/A'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-8 text-gray-700">{f.province || 'N/A'}</td>
                                                <td className="px-6 py-8 text-gray-700">{f.municipality || 'N/A'}</td>
                                                <td className="px-6 py-8 text-gray-700">
                                                    {f.created_at ? new Date(f.created_at).toLocaleDateString('pt-AO', {
                                                        day: '2-digit',
                                                        month: '2-digit',
                                                        year: 'numeric'
                                                    }) : 'N/A'}
                                                </td>
                                                <td className="px-6 py-8">
                                                    <span className={`px-4 py-2 rounded-xl text-sm font-medium ${f.is_active ? 'bg-emerald-50 text-emerald-900' : 'bg-red-50 text-red-900'
                                                        }`}>
                                                        {f.is_active ? 'Ativo' : 'Inativo'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-8">
                                                    <div className="relative flex justify-center dropdown-menu">
                                                        <button
                                                            onClick={() => setOpenMenuId(openMenuId === f.id ? null : f.id)}
                                                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                                        >
                                                            <MoreVertical size={20} className="text-gray-600" />
                                                        </button>

                                                        {openMenuId === f.id && (
                                                            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-50">
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedFornecedor(f);
                                                                        setIsDetalhesModalOpen(true);
                                                                        setOpenMenuId(null);
                                                                    }}
                                                                    className="w-full px-4 py-3 text-left hover:bg-gray-50 text-sm flex items-center gap-3 transition-colors rounded-lg mx-1"
                                                                >
                                                                    <Eye size={16} className="text-gray-500" />
                                                                    <span className="text-gray-700">Mais detalhes</span>
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedFornecedor(f);
                                                                        setIsModalOpen(true);
                                                                        setOpenMenuId(null);
                                                                    }}
                                                                    className="w-full px-4 py-3 text-left hover:bg-gray-50 text-sm flex items-center gap-3 transition-colors rounded-lg mx-1"
                                                                >
                                                                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                    </svg>
                                                                    <span className="text-gray-700">Editar</span>
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedFornecedor(f);
                                                                        setIsCotacaoModalOpen(true);
                                                                        setOpenMenuId(null);
                                                                    }}
                                                                    className="w-full px-4 py-3 text-left hover:bg-gray-50 text-sm flex items-center gap-3 transition-colors rounded-lg mx-1"
                                                                >
                                                                    <FileText size={16} className="text-gray-500" />
                                                                    <span className="text-gray-700">Pedir Cotação</span>
                                                                </button>
                                                                <div className="my-1 border-t border-gray-100"></div>
                                                                <button
                                                                    onClick={() => handleDeleteFornecedor(f)}
                                                                    className="w-full px-4 py-3 text-left hover:bg-gray-50 text-sm flex items-center gap-3 transition-colors rounded-lg mx-1"
                                                                >
                                                                    <Trash2 size={16} className="text-gray-500" />
                                                                    <span className="text-gray-700">Remover</span>
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {fornecedores.length >= 10 && (
                            <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200">
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${currentPage === 1
                                        ? 'text-gray-300 cursor-not-allowed'
                                        : 'text-gray-600 hover:bg-gray-50'
                                        }`}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                    Anterior
                                </button>

                                <div className="flex items-center gap-1">
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                        <button
                                            key={page}
                                            onClick={() => handlePageChange(page)}
                                            className={`px-3 py-1 rounded-lg text-sm transition-colors ${currentPage === page
                                                ? 'bg-[#44B16F] text-white'
                                                : 'text-gray-600 hover:bg-gray-50'
                                                }`}
                                        >
                                            {page.toString().padStart(2, '0')}
                                        </button>
                                    ))}
                                </div>

                                <button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${currentPage === totalPages
                                        ? 'text-gray-300 cursor-not-allowed'
                                        : 'text-gray-600 hover:bg-gray-50'
                                        }`}
                                >
                                    Próximo
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <>
                    {/* Cotações Sub-tabs */}
                    <div className="flex gap-6 border-b border-gray-200 mt-8">
                        <button
                            onClick={() => setActiveCotacaoTab("pedidos-enviados")}
                            className={`pb-3 font-medium text-sm transition-all ${activeCotacaoTab === "pedidos-enviados"
                                ? "text-[#44B16F] border-b-2 border-[#44B16F]"
                                : "text-gray-500 hover:text-gray-700"
                                }`}
                        >
                            Pedidos enviados
                        </button>
                        <button
                            onClick={() => setActiveCotacaoTab("pedidos-cancelados")}
                            className={`pb-3 font-medium text-sm transition-all ${activeCotacaoTab === "pedidos-cancelados"
                                ? "text-[#44B16F] border-b-2 border-[#44B16F]"
                                : "text-gray-500 hover:text-gray-700"
                                }`}
                        >
                            Pedidos Cancelados
                        </button>
                    </div>

                    {/* Action Buttons for Cotações */}
                    <div className="flex items-center justify-between gap-4">
                        <button
                            onClick={() => {
                                const fetchQuotations = async () => {
                                    try {
                                        setIsLoadingCotacoes(true);
                                        setCotacoesError(null);
                                        const response = await quotationRequestsAPI.getAll();
                                        setCotacoes(response.data || []);
                                    } catch (err) {
                                        console.error('Error fetching quotations:', err);
                                        setCotacoesError(err.message || 'Failed to load quotations');
                                    } finally {
                                        setIsLoadingCotacoes(false);
                                    }
                                };
                                fetchQuotations();
                            }}
                            disabled={isLoadingCotacoes}
                            className="flex items-center gap-2 px-4 py-3 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                            title="Atualizar lista"
                        >
                            <RefreshCw size={18} className={isLoadingCotacoes ? "animate-spin" : ""} />
                        </button>

                        <button
                            onClick={() => setIsCotacaoModalOpen(true)}
                            className="px-6 py-3 bg-[#44B16F] text-white rounded-lg hover:bg-[#3a9d5f] transition-colors font-medium flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Solicitar cotação
                        </button>
                    </div>

                    {/* Cotações Table */}
                    {renderCotacoesTable()}
                </>
            )}

            {/* Toast Notification */}
            {toast && (
                <Toast
                    type={toast.type}
                    message={toast.message}
                    onClose={() => setToast(null)}
                />
            )}

            {/* Modals */}
            <ModalCadastroFornecedor
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setSelectedFornecedor(null);
                }}
                fornecedor={selectedFornecedor}
            />
            <ModalDetalhesFornecedor
                isOpen={isDetalhesModalOpen}
                onClose={() => {
                    setIsDetalhesModalOpen(false);
                    setSelectedFornecedor(null);
                }}
                fornecedor={selectedFornecedor}
            />
            <ModalPedirCotacao
                isOpen={isCotacaoModalOpen}
                onClose={() => {
                    setIsCotacaoModalOpen(false);
                    setSelectedFornecedor(null);
                }}
                fornecedor={selectedFornecedor}
            />
            <ModalRevisarCotacao
                isOpen={isRevisarModalOpen}
                onClose={() => {
                    setIsRevisarModalOpen(false);
                    setSelectedCotacao(null);
                }}
                cotacao={selectedCotacao}
                onAprovar={(c) => {
                    handleAprovarProposta(c.id);
                    setIsRevisarModalOpen(false);
                }}
                onRejeitar={modalContext === 'response_review' ? null : (c) => {
                    handleRejeitarProposta(c.id);
                    setIsRevisarModalOpen(false);
                }}
                onSolicitarRevisao={modalContext === 'response_review' ? null : (c) => {
                    setIsRevisarModalOpen(false);
                    handleSolicitarRevisaoProposta(c.id);
                }}
                onGerarAquisicao={(c) => {
                    handleGerarAquisicaoProposta(c.id);
                    setIsRevisarModalOpen(false);
                }}
            />
            <ModalSolicitarRevisao
                isOpen={isSolicitarRevisaoModalOpen}
                onClose={() => setIsSolicitarRevisaoModalOpen(false)}
                onSubmit={confirmSolicitarRevisao}
                isLoading={isSubmittingReview}
            />
            <ModalConfirmarExclusaoFornecedor
                isOpen={isDeleteModalOpen}
                onClose={() => {
                    setIsDeleteModalOpen(false);
                    setSelectedFornecedor(null);
                }}
                onConfirm={confirmDeleteFornecedor}
                fornecedor={selectedFornecedor}
                isLoading={isDeleting}
            />
            <ModalRespostasPedido
                isOpen={isRespostasPedidoModalOpen}
                onClose={() => {
                    setIsRespostasPedidoModalOpen(false);
                    setSelectedPedidoForRespostas(null);
                }}
                quotationRequestId={selectedPedidoForRespostas?.id}
                quotationRequestTitle={selectedPedidoForRespostas?.title}
                onOpenRevisarModal={handleOpenRevisarModal}
                onAprovar={handleAprovarProposta}
                onRejeitar={handleRejeitarProposta}
                onSolicitarRevisao={handleSolicitarRevisaoProposta}
                onGerarAquisicao={handleGerarAquisicaoProposta}
            />
        </div>
    );
}