import { useState, useEffect } from "react";
import { Search, Plus, Filter, RefreshCw, MoreVertical, Edit2, Trash2, Package } from "lucide-react";
import { productsAPI } from "../../services/api";
import Toast from "../Components/Toast";
import ModalCriarProduto from "../Components/ModalCriarProduto";
import DashboardTableSkeleton from "../Components/DashboardTableSkeleton";

export default function ProdutosPage() {
    // Data states
    const [products, setProducts] = useState([]);
    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
        total: 0,
        per_page: 20
    });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // UI states
    const [searchTerm, setSearchTerm] = useState("");
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [productToEdit, setProductToEdit] = useState(null);
    const [openMenuId, setOpenMenuId] = useState(null);
    const [toast, setToast] = useState(null);

    useEffect(() => {
        fetchProducts();
    }, [pagination.current_page]);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (openMenuId && !event.target.closest('.dropdown-menu')) {
                setOpenMenuId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [openMenuId]);

    const fetchProducts = async (page = pagination.current_page) => {
        try {
            setIsLoading(true);
            setError(null);
            const data = await productsAPI.getAll(page);

            if (data.data) {
                setProducts(data.data);
                setPagination({
                    current_page: data.current_page || page,
                    last_page: data.last_page || 1,
                    total: data.total || 0,
                    per_page: data.per_page || 20
                });
            } else {
                // Handle case where API might return array directly (fallback)
                setProducts(Array.isArray(data) ? data : []);
            }
        } catch (err) {
            console.error("Erro ao carregar produtos:", err);
            setError("Não foi possível carregar a lista de produtos.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateSuccess = (message) => {
        showToast('success', message);
        fetchProducts();
    };

    const handleDelete = async (id) => {
        if (!confirm("Tem certeza que deseja excluir este produto?")) return;

        try {
            await productsAPI.delete(id);
            showToast('success', 'Produto excluído com sucesso!');
            fetchProducts();
        } catch (err) {
            console.error("Erro ao excluir produto:", err);
            showToast('error', 'Erro ao excluir produto.');
        } finally {
            setOpenMenuId(null);
        }
    };

    const showToast = (type, message) => {
        setToast({ type, message });
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.last_page) {
            setPagination(prev => ({ ...prev, current_page: newPage }));
        }
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.description || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-fadeIn">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Produtos</h1>
                    <p className="text-gray-500 mt-1">Gerencie o catálogo de produtos reutilizáveis</p>
                </div>
                <button
                    onClick={() => {
                        setProductToEdit(null);
                        setIsCreateModalOpen(true);
                    }}
                    className="flex items-center gap-2 px-5 py-3 bg-[#44B16F] text-white hover:bg-[#3a965d] active:bg-[#2f7d4e] rounded-xl font-medium transition-all shadow-sm shadow-emerald-100"
                >
                    <Plus size={20} />
                    <span>Novo Produto</span>
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar produtos..."
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-[#44B16F] focus:border-transparent rounded-xl outline-none transition-all text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button
                    onClick={() => fetchProducts()}
                    className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-xl transition-colors border border-gray-200"
                >
                    <RefreshCw size={18} />
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
                                <th className="px-6 py-5 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Nome</th>
                                <th className="px-6 py-5 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Categoria</th>
                                <th className="px-6 py-5 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Unidade</th>
                                <th className="px-6 py-5 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Data Criação</th>
                                <th className="px-6 py-5 text-center text-xs font-bold text-gray-500 uppercase tracking-widest">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {isLoading ? (
                                <DashboardTableSkeleton rows={8} />
                            ) : error ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-red-500 font-medium">
                                        {error}
                                    </td>
                                </tr>
                            ) : filteredProducts.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500 font-medium">
                                        <div className="flex flex-col items-center gap-2">
                                            <Package size={40} className="text-gray-300" />
                                            <p>Nenhum produto encontrado</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredProducts.map((product) => (
                                    <tr key={product.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-6 py-6 text-sm font-bold text-gray-900">#{product.id}</td>
                                        <td className="px-6 py-6">
                                            <div>
                                                <p className="font-semibold text-gray-900">{product.name}</p>
                                                {product.description && (
                                                    <p className="text-xs text-gray-500 mt-0.5 truncate max-w-xs">{product.description}</p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                                                {product.category?.name || product.category_id || "N/A"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-6 text-sm text-gray-600">
                                            {product.unit || "-"}
                                        </td>
                                        <td className="px-6 py-6 text-sm text-gray-500">
                                            {new Date(product.created_at).toLocaleDateString('pt-AO')}
                                        </td>
                                        <td className="px-6 py-6 text-center">
                                            <div className="relative inline-block text-left dropdown-menu">
                                                <button
                                                    onClick={() => setOpenMenuId(openMenuId === product.id ? null : product.id)}
                                                    className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
                                                >
                                                    <MoreVertical size={18} />
                                                </button>

                                                {openMenuId === product.id && (
                                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-10 animate-fadeIn">
                                                        <button
                                                            onClick={() => {
                                                                setProductToEdit(product);
                                                                setIsCreateModalOpen(true);
                                                                setOpenMenuId(null);
                                                            }}
                                                            className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                                        >
                                                            <Edit2 size={16} />
                                                            Editar
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(product.id)}
                                                            className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                                        >
                                                            <Trash2 size={16} />
                                                            Excluir
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
                {pagination.last_page > 1 && (
                    <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
                        <span className="text-sm text-gray-500">
                            Mostrando {((pagination.current_page - 1) * pagination.per_page) + 1} a {Math.min(pagination.current_page * pagination.per_page, pagination.total)} de {pagination.total} resultados
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handlePageChange(pagination.current_page - 1)}
                                disabled={pagination.current_page === 1}
                                className="px-3 py-1 text-sm border border-gray-200 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Anterior
                            </button>
                            {Array.from({ length: pagination.last_page }, (_, i) => i + 1).map(page => (
                                <button
                                    key={page}
                                    onClick={() => handlePageChange(page)}
                                    className={`px-3 py-1 text-sm rounded-lg ${pagination.current_page === page
                                        ? 'bg-[#44B16F] text-white font-medium'
                                        : 'border border-gray-200 hover:bg-white text-gray-600'
                                        }`}
                                >
                                    {page}
                                </button>
                            ))}
                            <button
                                onClick={() => handlePageChange(pagination.current_page + 1)}
                                disabled={pagination.current_page === pagination.last_page}
                                className="px-3 py-1 text-sm border border-gray-200 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Próxima
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal */}
            <ModalCriarProduto
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={handleCreateSuccess}
                productToEdit={productToEdit}
            />

            {/* Toast */}
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
