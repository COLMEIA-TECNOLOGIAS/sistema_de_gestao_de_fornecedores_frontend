import { useState, useEffect } from "react";
import { Search, SlidersHorizontal, MoreVertical, RefreshCw, FileText, Trash2, CheckCircle, MessageSquare, Send, Eye } from "lucide-react";
import ModalCadastroFornecedor from "../Components/ModalCadastroFornecedor";
import ModalPedirCotacao from "../Components/ModalPedirCotacao";
import ModalRevisarCotacao from "../Components/ModalRevisarCotacao";
import ModalSolicitarRevisao from "../Components/ModalSolicitarRevisao";
import ModalDetalhesFornecedor from "../Components/ModalDetalhesFornecedor";
import ModalConfirmarExclusaoFornecedor from "../Components/ModalConfirmarExclusaoFornecedor";
import Toast from "../Components/Toast";
import FornecedorTableSkeleton from "../Components/FornecedorTableSkeleton";
import { suppliersAPI, quotationRequestsAPI, quotationResponsesAPI, categoriesAPI } from "../../services/api"; // Added categoriesAPI

export default function FornecedoresPage() {
  // Main tabs state
  const [activeMainTab, setActiveMainTab] = useState("fornecedores");

  // Cotações sub-tabs state  
  const [activeCotacaoTab, setActiveCotacaoTab] = useState("pedidos-enviados");

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

  // Fetch quotation responses when "respostas" sub-tab is active
  useEffect(() => {
    const fetchResponses = async () => {
      try {
        setIsLoadingRespostas(true);
        setRespostasError(null);

        // 1. Try direct endpoint first
        let directData = [];
        try {
          const response = await quotationResponsesAPI.getAll();
          directData = response.data || [];
        } catch (e) {
          console.warn("Direct responses endpoint failed, attempting fallback...", e);
        }

        if (directData.length > 0) {
          setRespostas(directData);
          return;
        }

        // 2. Fallback: Fetch Requests and extract responses manually
        // This is necessary if the user (Technician) doesn't have permission to list all responses 
        // but can see them via their requests.
        const requestsResponse = await quotationRequestsAPI.getAll();
        const requests = Array.isArray(requestsResponse) ? requestsResponse : (requestsResponse.data || []);

        let allResponses = [];

        // Fetch full details for requests to ensure we have nested quotation_suppliers
        // Limit concurrency if needed, but Promise.all is usually fine for < 50 items.
        const detailedRequests = await Promise.all(
          requests.map(req =>
            quotationRequestsAPI.getById(req.id)
              .then(r => r.data || r)
              .catch(e => {
                console.error(`Failed to load details for request ${req.id}`, e);
                return null;
              })
          )
        );

        detailedRequests.filter(Boolean).forEach(req => {
          // Strategy 1: Check for explicit quotation_suppliers array
          const suppliersList = [...(req.quotation_suppliers || [])];

          // Strategy 2: Check for suppliers array with pivot (Laravel style)
          if (req.suppliers && Array.isArray(req.suppliers)) {
            req.suppliers.forEach(s => {
              if (s.pivot) {
                // Identify this pivoting logic
                const pivotData = { ...s.pivot };
                if (!pivotData.supplier) pivotData.supplier = s; // Ensure supplier info is attached
                suppliersList.push(pivotData);
              }
            });
          }

          // Deduplicate by ID if possible to avoid double counting
          const uniqueSuppliers = Array.from(new Map(suppliersList.map(item => [item.id, item])).values());

          if (uniqueSuppliers.length > 0) {
            uniqueSuppliers.forEach(qs => {
              // PERMISSIVE: Include all links
              const realResponse = qs.response || {};
              let totalAmount = realResponse.total_amount || qs.price || qs.total_amount;

              // Calculate from items if total isn't explicit
              if (!totalAmount && (realResponse.items || qs.items)) {
                const items = realResponse.items || qs.items;
                if (Array.isArray(items)) {
                  totalAmount = items.reduce((acc, item) => {
                    const val = parseFloat(item.total_price || item.unit_price || item.price || 0);
                    // If total_price is missing, assume unit_price * quantity (if available) or just unit_price
                    const qty = parseFloat(item.quantity || 1);
                    return acc + (item.total_price ? val : val * qty);
                  }, 0);
                }
              }
              if (!totalAmount) totalAmount = 0;

              allResponses.push({
                id: realResponse.id || `qs-${qs.id}` || Math.random(),
                status: realResponse.status || qs.status || 'pending',
                history: [{ total_amount: totalAmount }],
                delivery_days: realResponse.delivery_days || qs.delivery_days || realResponse.deadline || qs.deadline || 0,

                // Map dates correctly for table: Table uses 'submitted_at'
                submitted_at: realResponse.created_at || qs.updated_at || qs.created_at || qs.response_date || req.created_at || req.updated_at,
                created_at: qs.updated_at || qs.created_at || req.created_at,

                quotation_supplier: {
                  ...qs,
                  supplier: qs.supplier || { commercial_name: 'Fornecedor' },
                  quotation_request: req
                }
              });
            });
          }
        });

        console.log("Derived Responses from Requests:", allResponses);
        setRespostas(allResponses);

      } catch (err) {
        console.error('Error fetching responses:', err);
        setRespostasError(err.message || 'Failed to load responses');
      } finally {
        setIsLoadingRespostas(false);
      }
    };

    if (activeMainTab === "cotacoes" && activeCotacaoTab === "respostas") {
      fetchResponses();
    }
  }, [activeMainTab, activeCotacaoTab]);

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

  const handleOpenRevisarModal = async (resposta) => {
    setIsLoadingDetails(true);
    try {
      // Fetch full details including items and history
      const data = await quotationResponsesAPI.getById(resposta.id);

      // If the API doesn't return quotation_request populated with items, 
      // we might need to look it up from the cotacoes list (which should be loaded)
      // or ensure the API returns it. 
      // For now, let's use the fetched data. 
      // If we need to patch it with request items from the list:
      let enrichedData = data;
      if (!data.quotation_supplier?.quotation_request?.items && cotacoes.length > 0) {
        const reqId = data.quotation_supplier?.quotation_request_id || data.quotation_request_id;
        const request = cotacoes.find(c => c.id === reqId);
        if (request) {
          // Determine where to attach it. The modal expects cotacao.quotation_supplier.quotation_request
          if (!enrichedData.quotation_supplier) enrichedData.quotation_supplier = {};
          if (!enrichedData.quotation_supplier.quotation_request) enrichedData.quotation_supplier.quotation_request = request;
        }
      }

      setSelectedCotacao(enrichedData);
      setSelectedResposta(enrichedData); // Update this too as it's used for actions
      setIsRevisarModalOpen(true);
    } catch (error) {
      console.error("Erro ao carregar detalhes da resposta:", error);
      showToast("error", "Erro ao carregar detalhes da resposta.");
    } finally {
      setIsLoadingDetails(false);
    }
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
    // Filter cotações based on active tab - you may need to adjust based on API response structure
    const currentCotacoes = cotacoes || [];

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
                                console.log('Editar fornecedor:', f);
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

                            {/* Remover */}
                            <button
                              onClick={() => {
                                if (confirm('Tem certeza que deseja remover esta cotação?')) {
                                  console.log('Remover cotação:', cotacao);
                                  // Logic to remove
                                }
                                setOpenMenuId(null);
                              }}
                              className="w-full px-4 py-2.5 text-left hover:bg-gray-50 text-sm flex items-center gap-3 transition-colors"
                            >
                              <Trash2 size={16} className="text-gray-400" />
                              <span className="text-gray-700">Remover</span>
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

  // Render Respostas Table
  const renderRespostasTable = () => {
    const getStatusLabel = (status) => {
      const labels = {
        'pending': 'Pendente',
        'submitted': 'Submetido',
        'approved': 'Aprovada',
        'rejected': 'Rejeitada',
        'revision_requested': 'Revisão Solicitada',
        'needs_revision': 'Revisão Necessária',
      };
      return labels[status] || status;
    };

    return (
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {respostasError && (
          <div className="p-4 bg-red-50 border-b border-red-200">
            <p className="text-red-600 text-sm">
              <strong>Erro:</strong> {respostasError}
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
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Cotação</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Fornecedor</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Valor Total</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Prazo Entrega</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Data Resposta</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Status</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-600">Acções</th>
              </tr>
            </thead>
            <tbody>
              {isLoadingRespostas ? (
                <FornecedorTableSkeleton rows={5} />
              ) : respostas.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                      <p className="text-lg font-medium">Nenhuma resposta encontrada</p>
                      <p className="text-sm">As respostas das cotações aparecerão aqui</p>
                    </div>
                  </td>
                </tr>
              ) : (
                respostas.map((resposta) => (
                  <tr key={resposta.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-6">
                      <input type="checkbox" className="rounded border-gray-300" />
                    </td>
                    <td className="px-6 py-6">
                      <span className="font-medium text-gray-700">#{resposta.id}</span>
                    </td>
                    <td className="px-6 py-6">
                      <span className="font-semibold text-gray-900">
                        {resposta.quotation_supplier?.quotation_request?.title || `Cotação #${resposta.quotation_supplier?.quotation_request_id || 'N/A'}`}
                      </span>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-3">
                        <img
                          src={`https://api.dicebear.com/7.x/initials/svg?seed=${resposta.quotation_supplier?.supplier?.commercial_name || 'N/A'}`}
                          alt={resposta.quotation_supplier?.supplier?.commercial_name}
                          className="w-8 h-8 rounded-lg"
                        />
                        <span className="text-gray-700">
                          {resposta.quotation_supplier?.supplier?.commercial_name ||
                            resposta.quotation_supplier?.supplier?.legal_name ||
                            'Fornecedor N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-6 text-gray-700 font-medium">
                      {resposta.history && resposta.history.length > 0
                        ? `${parseFloat(resposta.history[0].total_amount || 0).toLocaleString('pt-AO', { minimumFractionDigits: 2 })} AOA`
                        : 'N/A'}
                    </td>
                    <td className="px-6 py-6 text-gray-700">
                      {resposta.delivery_days ? `${resposta.delivery_days} dias` : 'N/A'}
                    </td>
                    <td className="px-6 py-6 text-gray-700">
                      {resposta.submitted_at ? new Date(resposta.submitted_at).toLocaleDateString('pt-AO', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      }) : 'N/A'}
                    </td>
                    <td className="px-6 py-6">
                      <span className={`px-4 py-2 rounded-xl text-sm font-medium ${getStatusColor(resposta.status)}`}>
                        {getStatusLabel(resposta.status)}
                      </span>
                    </td>
                    <td className="px-6 py-6">
                      <div className="relative flex justify-center dropdown-menu">
                        <button
                          onClick={() => setOpenMenuId(openMenuId === `resp-${resposta.id}` ? null : `resp-${resposta.id}`)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <MoreVertical size={20} className="text-gray-600" />
                        </button>

                        {openMenuId === `resp-${resposta.id}` && (
                          <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50">
                            {/* Revisar */}
                            <button
                              onClick={() => {
                                handleOpenRevisarModal(resposta);
                                setOpenMenuId(null);
                              }}
                              className="w-full px-4 py-2.5 text-left hover:bg-gray-50 text-sm flex items-center gap-3 transition-colors"
                            >
                              <FileText size={16} className="text-gray-400" />
                              <span className="text-gray-700">Revisar</span>
                            </button>

                            {/* Rejeitar proposta */}
                            <button
                              onClick={() => {
                                handleRejeitarProposta(resposta.id);
                                setOpenMenuId(null);
                              }}
                              className="w-full px-4 py-2.5 text-left hover:bg-gray-50 text-sm flex items-center gap-3 transition-colors"
                            >
                              <Trash2 size={16} className="text-gray-400" />
                              <span className="text-gray-700">Rejeitar proposta</span>
                            </button>

                            {/* Aprovar proposta */}
                            <button
                              onClick={() => {
                                handleAprovarProposta(resposta.id);
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
                                handleSolicitarRevisaoProposta(resposta.id);
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
                                handleGerarAquisicaoProposta(resposta.id);
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
              onClick={() => setActiveCotacaoTab("respostas")}
              className={`pb-3 font-medium text-sm transition-all ${activeCotacaoTab === "respostas"
                ? "text-[#44B16F] border-b-2 border-[#44B16F]"
                : "text-gray-500 hover:text-gray-700"
                }`}
            >
              Respostas
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

          {/* Cotações/Respostas Table based on active sub-tab */}
          {activeCotacaoTab === "respostas" ? renderRespostasTable() : renderCotacoesTable()}
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
        onRejeitar={(c) => {
          handleRejeitarProposta(c.id);
          setIsRevisarModalOpen(false);
        }}
        onSolicitarRevisao={(c) => {
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
    </div>
  );
}