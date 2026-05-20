import { useState, useEffect } from "react";
import { Search, SlidersHorizontal, MoreVertical, Trash2, Eye, FileText } from "lucide-react";
import ModalCadastroFornecedor from "../Components/ModalCadastroFornecedor";
import ModalPedirCotacao from "../Components/ModalPedirCotacao";
import ModalDetalhesFornecedor from "../Components/ModalDetalhesFornecedor";
import ModalConfirmarExclusaoFornecedor from "../Components/ModalConfirmarExclusaoFornecedor";
import Toast from "../Components/Toast";
import FornecedorTableSkeleton from "../Components/FornecedorTableSkeleton";
import { suppliersAPI, categoriesAPI } from "../../services/api";

export default function FornecedoresPage() {
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
    }, [fornecedores, searchQuery, selectedCategory]);

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

    return (
        <div className="space-y-6">
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
                        src="/fornecedores_banner.png"
                        alt="Parcerias e Fornecedores Agrícolas"
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
                    onClick={() => setIsModalOpen(true)}
                    className="px-6 py-3 bg-[#44B16F] text-white rounded-lg hover:bg-[#3a9d5f] transition-colors font-medium"
                >
                    + Add Fornecedor
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
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Categoria</th>
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
                                    <td colSpan="14" className="px-6 py-12 text-center text-gray-500">
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
                                            <div className="flex flex-wrap gap-1">
                                                {f.categories && f.categories.length > 0 ? (
                                                    f.categories.map((cat, idx) => (
                                                        <span key={idx} className="px-2 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                                                            {cat.name}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-xs text-gray-400">Geral</span>
                                                )}
                                            </div>
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
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2-2V11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
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