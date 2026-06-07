import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, SlidersHorizontal, MoreVertical, Trash2, Eye, FileText, CheckCircle, Send, Loader2 } from "lucide-react";
import ModalCadastroFornecedor from "../Components/ModalCadastroFornecedor";
import ModalPedirCotacao from "../Components/ModalPedirCotacao";
import ModalDetalhesFornecedor from "../Components/ModalDetalhesFornecedor";
import ModalConfirmarExclusaoFornecedor from "../Components/ModalConfirmarExclusaoFornecedor";
import Toast from "../Components/Toast";
import FornecedorTableSkeleton from "../Components/FornecedorTableSkeleton";
import { suppliersAPI, categoriesAPI } from "../../services/api";

export default function FornecedoresPage() {
    const navigate = useNavigate();
    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCotacaoModalOpen, setIsCotacaoModalOpen] = useState(false);
    const [isDetalhesModalOpen, setIsDetalhesModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedFornecedor, setSelectedFornecedor] = useState(null);
    const [openMenuId, setOpenMenuId] = useState(null);

    // Toast state
    const [toast, setToast] = useState(null);

    // Data states for Fornecedores
    const [isLoading, setIsLoading] = useState(true);
    const [fornecedores, setFornecedores] = useState([]);
    const [filteredFornecedores, setFilteredFornecedores] = useState([]); 
    const [error, setError] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [activeTab, setActiveTab] = useState("fornecedores");

    // Approve loading state
    const [approvingId, setApprovingId] = useState(null);

    // Search and Filter states
    const [searchQuery, setSearchQuery] = useState("");
    const [categories, setCategories] = useState([]); 
    const [selectedCategory, setSelectedCategory] = useState(""); 
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    // Classifications state
    const [classifications, setClassifications] = useState({});

    // Fetch suppliers and categories data on component mount
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
            setError(err.message || 'Falha ao carregar dados');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSuppliersAndCategories();
    }, []);

    // Filtering Logic
    useEffect(() => {
        let result = fornecedores;

        if (activeTab === 'convites') {
            result = result.filter(f => !f.is_active && (f.registration_status === 'invited' || f.registration_status === 'completed'));
        } else {
            result = result.filter(f => f.is_active || (f.registration_status !== 'invited' && f.registration_status !== 'completed'));
        }

        if (searchQuery) {
            const lowerQuery = searchQuery.toLowerCase();
            result = result.filter(f =>
                (f.commercial_name?.toLowerCase() || "").includes(lowerQuery) ||
                (f.legal_name?.toLowerCase() || "").includes(lowerQuery) ||
                (f.email?.toLowerCase() || "").includes(lowerQuery) ||
                (f.nif?.toLowerCase() || "").includes(lowerQuery)
            );
        }

        if (selectedCategory) {
            result = result.filter(f =>
                f.categories && f.categories.some(cat => String(cat.id) === String(selectedCategory))
            );
        }

        setFilteredFornecedores(result);
        setCurrentPage(1); 
    }, [fornecedores, searchQuery, selectedCategory, activeTab]);

    // Pagination logic
    const totalPages = Math.ceil(filteredFornecedores.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentFornecedores = filteredFornecedores.slice(startIndex, endIndex);

    // Fetch classifications for visible suppliers
    useEffect(() => {
        const fetchClassifications = async () => {
            if (currentFornecedores.length === 0) return;
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

        fetchClassifications();
    }, [currentPage, filteredFornecedores]);

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

    const handlePageChange = (page) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
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

    const showToast = (type, message) => {
        setToast({ type, message });
    };

    // Approve supplier handler
    const handleApproveSupplier = async (fornecedor) => {
        setApprovingId(fornecedor.id);
        setOpenMenuId(null);
        try {
            await suppliersAPI.approve(fornecedor.id);
            showToast('success', 'Fornecedor aprovado com sucesso!');
            await reloadSuppliers();
        } catch (err) {
            console.error('Error approving supplier:', err);
            showToast('error', err.response?.data?.message || 'Erro ao aprovar fornecedor');
        } finally {
            setApprovingId(null);
        }
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                        Fornecedores
                    </h1>
                    <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                        Gerencie os fornecedores cadastrados no sistema.
                    </p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="btn-primary"
                >
                    + Adicionar Fornecedor
                </button>
            </div>

            {/* Tabs Section */}
            <div className="tab-bar">
                <button
                    onClick={() => { setActiveTab("fornecedores"); setCurrentPage(1); }}
                    className={`tab-item ${activeTab === "fornecedores" ? 'active' : ''}`}
                >
                    Fornecedores
                </button>
                <button
                    onClick={() => { setActiveTab("convites"); setCurrentPage(1); }}
                    className={`tab-item ${activeTab === "convites" ? 'active' : ''}`}
                >
                    Convites Enviados
                </button>
            </div>

            {/* Actions Bar */}
            <div className="flex flex-wrap items-center gap-3">
                {/* Search */}
                <div className="search-bar" style={{ maxWidth: '360px' }}>
                    <Search className="search-icon" size={16} />
                    <input
                        type="text"
                        placeholder="Pesquisar por nome, email, nif..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="input-field"
                        style={{ paddingLeft: '42px' }}
                    />
                </div>

                {/* Filter Dropdown */}
                <div className="relative">
                    <button
                        onClick={() => setIsFilterOpen(!isFilterOpen)}
                        className="btn-secondary"
                        style={selectedCategory ? { borderColor: 'var(--color-primary)', color: 'var(--color-primary)' } : {}}
                    >
                        <SlidersHorizontal size={16} />
                        Filtros
                        {selectedCategory && (
                            <span
                                className="flex items-center justify-center rounded-full text-white text-xs font-bold"
                                style={{ background: 'var(--color-primary)', width: '18px', height: '18px', fontSize: '10px' }}
                            >1</span>
                        )}
                    </button>

                    {isFilterOpen && (
                        <div className="absolute left-0 top-full mt-2 w-64 rounded-xl p-4 z-50"
                            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-xl)' }}>
                            <h3 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--color-text-muted)' }}>Categorias</h3>
                            <div className="space-y-1 max-h-60 overflow-y-auto">
                                <label className="flex items-center gap-2 p-2 rounded-lg cursor-pointer" style={{ color: 'var(--color-text-secondary)' }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                    <input type="radio" name="category" checked={selectedCategory === ""}
                                        onChange={() => { setSelectedCategory(""); setIsFilterOpen(false); }} />
                                    <span className="text-sm">Todas</span>
                                </label>
                                {categories.map(cat => (
                                    <label key={cat.id} className="flex items-center gap-2 p-2 rounded-lg cursor-pointer" style={{ color: 'var(--color-text-secondary)' }}
                                        onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg)'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                        <input type="radio" name="category" checked={String(selectedCategory) === String(cat.id)}
                                            onChange={() => { setSelectedCategory(cat.id); setIsFilterOpen(false); }} />
                                        <span className="text-sm">{cat.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Fornecedores Table */}
            <div className="card overflow-hidden">
                {error && (
                    <div className="p-4 bg-red-50 border-b border-red-200">
                        <p className="text-red-600 text-sm">
                            <strong>Erro:</strong> {error}
                        </p>
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead style={{ background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }}>
                            <tr>
                                <th className="px-6 py-4 text-left">
                                    <input type="checkbox" className="rounded border-gray-300" />
                                </th>
                                <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>ID</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Nome Comercial</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Nome Legal</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>NIF</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Telefone</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Email</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Avaliação</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Categoria</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Província</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Município</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Data de Registo</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Status</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Registo</th>
                                <th className="px-6 py-4 text-center text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <FornecedorTableSkeleton rows={10} />
                            ) : currentFornecedores.length === 0 ? (
                                <tr>
                                    <td colSpan="15" className="px-6 py-12 text-center text-gray-500">
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
                                    <tr key={f.id} className="transition-colors" style={{ borderBottom: '1px solid var(--color-border-light)' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
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
                                                <span className="font-medium" style={{ color: 'var(--color-text-secondary)' }}>#{f.id}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-8">
                                            <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{f.commercial_name || 'N/A'}</span>
                                        </td>
                                        <td className="px-6 py-8" style={{ color: 'var(--color-text-secondary)' }}>{f.legal_name || 'N/A'}</td>
                                        <td className="px-6 py-8" style={{ color: 'var(--color-text-secondary)' }}>{f.nif || 'N/A'}</td>
                                        <td className="px-6 py-8" style={{ color: 'var(--color-text-secondary)' }}>{f.phone || 'N/A'}</td>
                                        <td className="px-6 py-8" style={{ color: 'var(--color-text-secondary)' }}>{f.email || 'N/A'}</td>
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
                                            <div className="flex flex-wrap gap-1">
                                                {f.categories && f.categories.length > 0 ? (
                                                    f.categories.map((cat, idx) => (
                                                        <span key={idx} className="px-2 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                                                            {cat.name}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Geral</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-8" style={{ color: 'var(--color-text-secondary)' }}>{f.province || 'N/A'}</td>
                                        <td className="px-6 py-8" style={{ color: 'var(--color-text-secondary)' }}>{f.municipality || 'N/A'}</td>
                                        <td className="px-6 py-8" style={{ color: 'var(--color-text-secondary)' }}>
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
                                            {(f.is_active && (f.registration_status === 'invited' || f.registration_status === 'completed')) || f.registration_status === 'approved' ? (
                                                <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1 w-fit">
                                                    <CheckCircle size={12} />
                                                    Aprovado
                                                </span>
                                            ) : f.registration_status === 'invited' ? (
                                                <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1 w-fit">
                                                    <Send size={12} />
                                                    Convidado
                                                </span>
                                            ) : f.registration_status === 'completed' ? (
                                                <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 w-fit">
                                                    <CheckCircle size={12} />
                                                    Completo
                                                </span>
                                            ) : (
                                                <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-gray-50 text-gray-600 border border-gray-200 w-fit">
                                                    {f.registration_status || 'Directo'}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-8">
                                            <div className="flex items-center justify-center gap-2">
                                                {!f.is_active && f.registration_status !== 'invited' && (
                                                    <button
                                                        onClick={() => handleApproveSupplier(f)}
                                                        disabled={approvingId === f.id}
                                                        className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors text-sm font-medium flex items-center gap-2 border border-emerald-200"
                                                    >
                                                        {approvingId === f.id ? (
                                                            <Loader2 size={14} className="animate-spin" />
                                                        ) : (
                                                            <CheckCircle size={14} />
                                                        )}
                                                        Aprovar
                                                    </button>
                                                )}

                                                <div className="relative dropdown-menu">
                                                    <button
                                                        onClick={() => setOpenMenuId(openMenuId === f.id ? null : f.id)}
                                                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                                    >
                                                        <MoreVertical size={20} style={{ color: 'var(--color-text-secondary)' }} />
                                                    </button>

                                                {openMenuId === f.id && (
                                                    <div className="absolute right-0 top-full mt-2 w-56 rounded-xl shadow-xl py-1 z-50" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                                                        <button
                                                            onClick={() => {
                                                                setSelectedFornecedor(f);
                                                                setIsDetalhesModalOpen(true);
                                                                setOpenMenuId(null);
                                                            }}
                                                            className="w-full px-4 py-3 text-left text-sm flex items-center gap-3 transition-colors rounded-lg mx-1"
                                                            onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg)'}
                                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                                        >
                                                            <Eye size={16} style={{ color: 'var(--color-text-muted)' }} />
                                                            <span style={{ color: 'var(--color-text-secondary)' }}>Mais detalhes</span>
                                                        </button>

                                                        <button
                                                            onClick={() => {
                                                                setSelectedFornecedor(f);
                                                                setIsModalOpen(true);
                                                                setOpenMenuId(null);
                                                            }}
                                                            className="w-full px-4 py-3 text-left text-sm flex items-center gap-3 transition-colors rounded-lg mx-1"
                                                            onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg)'}
                                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                                        >
                                                            <svg className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2-2V11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                            </svg>
                                                            <span style={{ color: 'var(--color-text-secondary)' }}>Editar</span>
                                                        </button>

                                                        {(f.is_active == 1 || f.is_active === true) ? (
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedFornecedor(f);
                                                                    setIsCotacaoModalOpen(true);
                                                                    setOpenMenuId(null);
                                                                }}
                                                                className="w-full px-4 py-3 text-left text-sm flex items-center gap-3 transition-colors rounded-lg mx-1"
                                                                onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg)'}
                                                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                                            >
                                                                <FileText size={16} style={{ color: 'var(--color-text-muted)' }} />
                                                                <span style={{ color: 'var(--color-text-secondary)' }}>Pedir Cotação</span>
                                                            </button>
                                                        ) : null}
                                                        <div className="my-1 border-t border-gray-100"></div>
                                                        <button
                                                            onClick={() => handleDeleteFornecedor(f)}
                                                            className="w-full px-4 py-3 text-left text-sm flex items-center gap-3 transition-colors rounded-lg mx-1"
                                                            onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg)'}
                                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                                        >
                                                            <Trash2 size={16} style={{ color: 'var(--color-text-muted)' }} />
                                                            <span style={{ color: 'var(--color-text-secondary)' }}>Remover</span>
                                                        </button>
                                                    </div>
                                                )}
                                                </div>
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
                    <div className="flex items-center justify-between px-6 py-3" style={{ borderTop: '1px solid var(--color-border)' }}>
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${currentPage === 1
                                ? 'cursor-not-allowed'
                                : ''
                                }`}
                            style={currentPage === 1 ? { color: 'var(--color-text-muted)' } : { color: 'var(--color-text-secondary)' }}
                            onMouseEnter={e => currentPage !== 1 && (e.currentTarget.style.background = 'var(--color-bg)')}
                            onMouseLeave={e => currentPage !== 1 && (e.currentTarget.style.background = 'transparent')}
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
                                        : ''
                                        }`}
                                    style={currentPage !== page ? { color: 'var(--color-text-secondary)' } : {}}
                                    onMouseEnter={e => currentPage !== page && (e.currentTarget.style.background = 'var(--color-bg)')}
                                    onMouseLeave={e => currentPage !== page && (e.currentTarget.style.background = 'transparent')}
                                >
                                    {page.toString().padStart(2, '0')}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${currentPage === totalPages
                                ? 'cursor-not-allowed'
                                : ''
                                }`}
                            style={currentPage === totalPages ? { color: 'var(--color-text-muted)' } : { color: 'var(--color-text-secondary)' }}
                            onMouseEnter={e => currentPage !== totalPages && (e.currentTarget.style.background = 'var(--color-bg)')}
                            onMouseLeave={e => currentPage !== totalPages && (e.currentTarget.style.background = 'transparent')}
                        >
                            Próximo
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                )}
            </div>

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
                onSuccess={reloadSuppliers}
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
