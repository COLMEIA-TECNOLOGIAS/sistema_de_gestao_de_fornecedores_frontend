import { useState, useEffect } from "react";
import { Search, SlidersHorizontal, MoreVertical, RefreshCw, FileText, Trash2, CheckCircle, MessageSquare, Send, Eye, Clock } from "lucide-react";
import ModalPedirCotacao from "../Components/ModalPedirCotacao";
import ModalRevisarCotacao from "../Components/ModalRevisarCotacao";
import ModalSolicitarRevisao from "../Components/ModalSolicitarRevisao";
import ModalRespostasPedido from "../Components/ModalRespostasPedido";
import Toast from "../Components/Toast";
import FornecedorTableSkeleton from "../Components/FornecedorTableSkeleton";
import { quotationRequestsAPI, quotationResponsesAPI, suppliersAPI, categoriesAPI } from "../../services/api";

export default function CotacoesPage() {
    // Sub-tabs state (defaulting to por-atividade as requested)
    const [activeCotacaoTab, setActiveCotacaoTab] = useState("por-atividade");

    // Modal states
    const [isCotacaoModalOpen, setIsCotacaoModalOpen] = useState(false);
    const [isRevisarModalOpen, setIsRevisarModalOpen] = useState(false);
    const [isSolicitarRevisaoModalOpen, setIsSolicitarRevisaoModalOpen] = useState(false);
    const [isRespostasPedidoModalOpen, setIsRespostasPedidoModalOpen] = useState(false);
    
    const [selectedPedidoForRespostas, setSelectedPedidoForRespostas] = useState(null);
    const [selectedCotacao, setSelectedCotacao] = useState(null);
    const [selectedResposta, setSelectedResposta] = useState(null);
    const [openMenuId, setOpenMenuId] = useState(null);
    const [modalContext, setModalContext] = useState(null); // 'response_review', 'details'

    // Toast state
    const [toast, setToast] = useState(null);

    // Data states for Cotações, Suppliers and Categories
    const [isLoadingCotacoes, setIsLoadingCotacoes] = useState(false);
    const [cotacoes, setCotacoes] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [categories, setCategories] = useState([]);
    const [cotacoesError, setCotacoesError] = useState(null);

    // Data states for Respostas
    const [respostas, setRespostas] = useState([]);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);

    // Fetch quotation requests, suppliers, and categories on mount
    const fetchQuotationsAndData = async () => {
        try {
            setIsLoadingCotacoes(true);
            setCotacoesError(null);
            
            const [cotacoesRes, suppliersRes, categoriesRes] = await Promise.all([
                quotationRequestsAPI.getAll(),
                suppliersAPI.getAll().catch((err) => {
                    console.warn('Failed to load suppliers:', err);
                    return { data: [] };
                }),
                categoriesAPI.getAll().catch((err) => {
                    console.warn('Failed to load categories:', err);
                    return [];
                })
            ]);

            console.log('Cotações recebidas da API:', cotacoesRes);
            const rawCotacoes = cotacoesRes.data || [];
            setSuppliers(suppliersRes.data || []);
            setCategories(categoriesRes || []);

            // Fetch full details for each quotation request to get the 'suppliers' relation populated!
            const detailedCotacoes = await Promise.all(
                rawCotacoes.map(async (cot) => {
                    try {
                        const detailRes = await quotationRequestsAPI.getById(cot.id);
                        const detailData = detailRes.data || detailRes;
                        return {
                            ...cot,
                            suppliers: detailData.suppliers || []
                        };
                    } catch (e) {
                        console.warn(`Failed to fetch details for quotation ${cot.id}:`, e);
                        return cot;
                    }
                })
            );

            setCotacoes(detailedCotacoes);
        } catch (err) {
            console.error('Error fetching quotations:', err);
            setCotacoesError(err.message || 'Erro ao carregar cotações');
        } finally {
            setIsLoadingCotacoes(false);
        }
    };

    useEffect(() => {
        fetchQuotationsAndData();
    }, []);

    // Reload responses helper
    const reloadRespostas = async () => {
        try {
            const response = await quotationResponsesAPI.getAll();
            setRespostas(response.data || []);
        } catch (err) {
            console.error('Error reloading responses:', err);
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

    // Helper function to show toast
    const showToast = (type, message) => {
        setToast({ type, message });
    };

    // Handler to open respostas modal for a specific quotation request
    const handleVerRespostas = (cotacao) => {
        setSelectedPedidoForRespostas(cotacao);
        setIsRespostasPedidoModalOpen(true);
    };

    const handleOpenDetails = async (resposta, context = 'details') => {
        setIsLoadingDetails(true);
        setModalContext(context);

        console.group('🔍 Opening Details Modal');
        console.log('1. Original resposta object:', resposta);
        console.log('2. Context:', context);

        try {
            let responseDetails = resposta;

            if (resposta.id && !String(resposta.id).startsWith('qs-')) {
                try {
                    console.log('3. Fetching full details for ID:', resposta.id);
                    const res = await quotationResponsesAPI.getById(resposta.id);
                    responseDetails = res.data || res;
                    console.log('4. Fetched details:', responseDetails);
                } catch (innerError) {
                    console.warn("⚠️ Failed to load quotation response details, using fallback...", innerError);
                }
            }

            if (!responseDetails.quotation_supplier && responseDetails.supplier) {
                responseDetails.quotation_supplier = {
                    supplier: responseDetails.supplier,
                    quotation_request: responseDetails.quotation_request || {}
                };
            }

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

    const handleAprovarProposta = async (id) => {
        try {
            await quotationResponsesAPI.approve(id, "Aprovado, excelente preço");
            showToast('success', 'Proposta aprovada com sucesso!');
            await reloadRespostas();
            await fetchQuotationsAndData();
        } catch (err) {
            console.error('Erro ao aprovar proposta:', err);
            showToast('error', err.response?.data?.message || 'Erro ao aprovar proposta');
        }
    };

    const handleRejeitarProposta = async (id) => {
        try {
            await quotationResponsesAPI.reject(id, "Preço muito alto");
            showToast('success', 'Proposta rejeitada com sucesso!');
            await reloadRespostas();
            await fetchQuotationsAndData();
        } catch (err) {
            console.error('Erro ao rejeitar proposta:', err);
            showToast('error', err.response?.data?.message || 'Erro ao rejeitar proposta');
        }
    };

    const handleSolicitarRevisaoProposta = (id) => {
        const resposta = respostas.find(r => r.id === id);
        setSelectedResposta(resposta || { id });
        setIsSolicitarRevisaoModalOpen(true);
    };

    const confirmSolicitarRevisao = async ({ reason, message }) => {
        if (!selectedResposta) return;

        setIsSubmittingReview(true);
        try {
            await quotationResponsesAPI.requestRevision(selectedResposta.id, reason, message);
            showToast('success', 'Solicitação de revisão enviada com sucesso!');
            setIsSolicitarRevisaoModalOpen(false);
            setSelectedResposta(null);
            await reloadRespostas();
            await fetchQuotationsAndData();
        } catch (err) {
            console.error('Erro ao solicitar revisão:', err);
            showToast('error', err.response?.data?.message || 'Erro ao solicitar revisão');
        } finally {
            setIsSubmittingReview(false);
        }
    };

    const handleGerarAquisicaoProposta = async (id) => {
        try {
            await quotationResponsesAPI.createAcquisition(id, "2026-03-01", "Necessidade urgente de materiais");
            showToast('success', 'Aquisição gerada com sucesso!');
            await reloadRespostas();
            await fetchQuotationsAndData();
        } catch (err) {
            console.error('Erro ao gerar aquisição:', err);
            showToast('error', err.response?.data?.message || 'Erro ao gerar aquisição');
        }
    };

    const handleSendCotacao = async (cotacao) => {
        if (cotacao.status !== 'draft') {
            showToast('warning', 'Apenas cotações com status "Rascunho" podem ser enviadas.');
            return;
        }

        if (!confirm(`Deseja enviar a cotação "${cotacao.title}" para os fornecedores?`)) {
            return;
        }

        try {
            setOpenMenuId(null);
            const response = await quotationRequestsAPI.send(cotacao.id);
            showToast('success', response.message || 'Cotação enviada com sucesso!');
            await fetchQuotationsAndData();
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
            showToast('success', response.message || 'Cotação cancelada com sucesso!');
            await fetchQuotationsAndData();
        } catch (err) {
            console.error('Erro ao cancelar cotação:', err);
            showToast('error', err.response?.data?.message || 'Erro ao cancelar cotação');
        }
    };

    // Render Atividades View
    const renderAtividadesView = () => {
        if (isLoadingCotacoes) return (
            <div className="flex flex-col items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#44B16F]"></div>
                <p className="text-gray-500 mt-4 font-medium animate-pulse">Carregando atividades...</p>
            </div>
        );

        if (!cotacoes || cotacoes.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
                    <FileText size={48} className="text-gray-300 mb-4" />
                    <p className="text-gray-500 font-medium">Nenhuma atividade registrada ainda</p>
                </div>
            );
        }

        // Sort by created_at descending so that latest requests are displayed first
        const sortedCotacoes = [...cotacoes].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        return (
            <div className="grid grid-cols-1 gap-6 mt-4">
                {sortedCotacoes.map((cot) => {
                    const title = cot.title || 'Solicitação sem Título';
                    return (
                        <div key={cot.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                            <div className="bg-gray-50/50 px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-[#44B16F]/10 rounded-2xl flex items-center justify-center text-[#44B16F]">
                                        <FileText size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="bg-[#44B16F]/10 text-[#44B16F] text-[10px] uppercase font-bold px-3 py-1 rounded-full">
                                        Histórico de Atividade
                                    </span>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50/30 border-b border-gray-100">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-400">ID / DATA</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-400">FORNECEDORES CONVIDADOS</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-400">ESTADO</th>
                                            <th className="px-6 py-4 text-center text-xs font-bold text-gray-400">AÇÕES</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50 font-medium">
                                        <tr className="group hover:bg-emerald-50/30 transition-colors">
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col">
                                                    <span className="text-gray-900 font-bold">
                                                        {cot.reference_number || cot.reference || `COD-#${cot.id}`}
                                                    </span>
                                                    <span className="text-[11px] text-gray-400 italic">
                                                        Criado em: {new Date(cot.created_at).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-bold bg-[#44B16F]/10 text-[#44B16F] px-2.5 py-1 rounded-lg">
                                                        {(cot.suppliers || []).length} Fornecedores
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${cot.status === 'draft' ? 'bg-gray-100 text-gray-500' :
                                                    cot.status === 'sent' ? 'bg-amber-100 text-amber-700' :
                                                        cot.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                                                            cot.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                                                                'bg-red-100 text-red-700'
                                                    }`}>
                                                    {cot.status === 'draft' ? 'Rascunho' :
                                                     cot.status === 'sent' ? 'Enviado' :
                                                     cot.status === 'in_progress' ? 'Em andamento' :
                                                     cot.status === 'completed' ? 'Finalizado' :
                                                     cot.status === 'cancelled' ? 'Cancelado' : cot.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                <button
                                                    onClick={() => handleVerRespostas(cot)}
                                                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#44B16F] text-white rounded-xl text-xs font-bold hover:bg-[#3a9d5f] shadow-sm transform active:scale-95 transition-all"
                                                >
                                                    <Eye size={14} />
                                                    Acompanhar Processo
                                                </button>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    // Render Cotações Table
    const renderCotacoesTable = () => {
        let currentCotacoes = cotacoes || [];

        if (activeCotacaoTab === 'pedidos-cancelados') {
            currentCotacoes = currentCotacoes.filter(c => c.status === 'cancelled');
        } else {
            currentCotacoes = currentCotacoes.filter(c => c.status !== 'cancelled');
        }

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
                                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-600">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoadingCotacoes ? (
                                <FornecedorTableSkeleton rows={5} />
                            ) : currentCotacoes.length === 0 ? (
                                <tr>
                                    <td colSpan="11" className="px-6 py-12 text-center text-gray-500">
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
                                                        {cotacao.status !== 'cancelled' && cotacao.status !== 'completed' && (
                                                            <button
                                                                onClick={() => {
                                                                    handleCancelCotacao(cotacao);
                                                                    setOpenMenuId(null);
                                                                }}
                                                                className="w-full px-4 py-2.5 text-left hover:bg-gray-50 text-sm flex items-center gap-3 transition-colors text-red-600"
                                                            >
                                                                <Trash2 size={16} className="text-red-400" />
                                                                <span className="text-red-700">Cancelar Cotação</span>
                                                            </button>
                                                        )}

                                                        {/* Enviar para fornecedores - Apenas para Rascunho */}
                                                        {cotacao.status === 'draft' && (
                                                            <button
                                                                onClick={() => handleSendCotacao(cotacao)}
                                                                className="w-full px-4 py-2.5 text-left hover:bg-gray-50 text-sm flex items-center gap-3 transition-colors text-blue-600 font-medium"
                                                            >
                                                                <Send size={16} className="text-blue-500" />
                                                                <span>Enviar para fornecedores</span>
                                                            </button>
                                                        )}
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
            {/* Welcome Section */}
            <div className="bg-white rounded-2xl p-8 shadow-sm flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">
                        Cotações
                    </h1>
                    <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                        Gestão de Cotações
                    </h2>
                    <p className="text-gray-600">Gerencie e envie pedidos de cotação para os fornecedores</p>
                </div>
                <div className="hidden lg:block">
                    <img
                        src="/cotacoes_banner.png"
                        alt="Pedidos de Cotação e Contratos Agrícolas"
                        className="w-96 h-32 object-cover rounded-xl"
                    />
                </div>
            </div>

            {/* Cotações Sub-tabs */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200">
                <div className="flex gap-6">
                    {/* "Pedidos enviados" tab button hidden as requested */}
                    <button
                        onClick={() => setActiveCotacaoTab("por-atividade")}
                        className={`pb-3 font-medium text-sm transition-all ${activeCotacaoTab === "por-atividade"
                            ? "text-[#44B16F] border-b-2 border-[#44B16F]"
                            : "text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        Atividades
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

                {/* Actions */}
                <div className="flex items-center gap-2 pb-2">
                    <button
                        onClick={fetchQuotationsAndData}
                        disabled={isLoadingCotacoes}
                        className="flex items-center gap-2 px-3 py-2 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                        title="Atualizar lista"
                    >
                        <RefreshCw size={16} className={isLoadingCotacoes ? "animate-spin" : ""} />
                    </button>

                    <button
                        onClick={() => setIsCotacaoModalOpen(true)}
                        className="px-4 py-2 bg-[#44B16F] text-white rounded-lg hover:bg-[#3a9d5f] transition-colors font-medium flex items-center gap-2 text-sm"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Solicitar cotação
                    </button>
                </div>
            </div>

            {/* Content Table */}
            {activeCotacaoTab === "por-atividade" ? renderAtividadesView() : renderCotacoesTable()}

            {/* Toast Notification */}
            {toast && (
                <Toast
                    type={toast.type}
                    message={toast.message}
                    onClose={() => setToast(null)}
                />
            )}

            {/* Modals */}
            <ModalPedirCotacao
                isOpen={isCotacaoModalOpen}
                onClose={() => {
                    setIsCotacaoModalOpen(false);
                }}
                fornecedor={null}
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