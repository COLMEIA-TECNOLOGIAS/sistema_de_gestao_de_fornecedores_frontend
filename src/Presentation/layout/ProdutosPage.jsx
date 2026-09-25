import { useState, useEffect } from "react";
import { Plus, MoreVertical, Edit2, Trash2, Package, TrendingUp } from "lucide-react";
import { productsAPI } from "../../services/api";
import ModalCriarProduto from "../Components/ModalCriarProduto";
import ModalProdutoAnalytics from "../Components/ModalProdutoAnalytics";
import DashboardTableSkeleton from "../Components/DashboardTableSkeleton";
import SearchInput from "../Components/ui/SearchInput";
import RefreshButton from "../Components/ui/RefreshButton";
import FilterChips from "../Components/ui/FilterChips";
import Pagination from "../Components/ui/Pagination";
import { EmptyState, ErrorState, StaleDataBanner } from "../Components/ui/StateViews";
import { useProducts, useInvalidate } from "../../hooks/queries";
import { useUrlFilters } from "../../hooks/useUrlFilters";
import { queryKeys } from "../../lib/queryKeys";
import { useToast } from "../../context/ToastContext";
import { useConfirm } from "../../context/ConfirmContext";
import { getErrorMessage } from "../../utils/apiHelpers";

// Paginação e pesquisa feitas no servidor (a pesquisa abrange todas as páginas)
const FILTER_DEFAULTS = { q: "", page: 1 };

const thClass = "px-6 py-5 text-left text-xs font-bold uppercase tracking-widest";
const thStyle = { color: 'var(--color-text-secondary)' };

const formatDate = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString('pt-AO');
};

export default function ProdutosPage() {
    const toast = useToast();
    const confirm = useConfirm();
    const invalidate = useInvalidate();

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [productToEdit, setProductToEdit] = useState(null);
    const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false);
    const [productForAnalytics, setProductForAnalytics] = useState(null);
    const [openMenuId, setOpenMenuId] = useState(null);

    const { filters, setFilter, resetFilters, activeCount } = useUrlFilters(FILTER_DEFAULTS);
    const { data, isLoading, isFetching, isPlaceholderData, isError, error, refetch, dataUpdatedAt } =
        useProducts({ page: filters.page, search: filters.q });

    const products = data?.items ?? [];
    const serverPagination = data?.pagination;
    const lastPage = serverPagination?.lastPage ?? 1;
    const total = serverPagination?.total ?? products.length;
    const perPage = serverPagination?.perPage || products.length || 1;
    const currentPage = serverPagination?.currentPage ?? filters.page;

    // Página fora do intervalo (ex.: após eliminar o último produto da última página, ou URL antigo)
    useEffect(() => {
        if (isPlaceholderData || !serverPagination) return;
        if (filters.page > 1 && products.length === 0 && filters.page > serverPagination.lastPage) {
            setFilter("page", Math.max(1, serverPagination.lastPage));
        }
    }, [isPlaceholderData, serverPagination, products.length, filters.page, setFilter]);

    // Fechar o menu de acções ao clicar fora
    useEffect(() => {
        if (!openMenuId) return;
        const handleClickOutside = (event) => {
            if (!event.target.closest('.dropdown-menu')) setOpenMenuId(null);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [openMenuId]);

    const clearFilters = () => resetFilters();
    const chips = [
        filters.q && { key: "q", label: `"${filters.q}"`, onRemove: () => setFilter("q", "") },
    ];

    const handleShowAnalytics = (product) => {
        setOpenMenuId(null);
        setProductForAnalytics(product);
        setIsAnalyticsModalOpen(true);
    };

    const handleDelete = async (product) => {
        setOpenMenuId(null);
        const confirmed = await confirm({
            title: "Eliminar Produto",
            message: (
                <p style={{ color: 'var(--color-text-secondary)' }}>
                    Tem a certeza de que deseja eliminar o produto <strong style={{ color: 'var(--color-text-primary)' }}>{product.name}</strong>?
                    <span className="block text-sm mt-2">Esta acção não pode ser desfeita.</span>
                </p>
            ),
            confirmLabel: "Sim, eliminar",
            runningLabel: "A eliminar...",
            variant: "danger",
            onConfirm: () => productsAPI.delete(product.id),
            getErrorMessage: (err) => getErrorMessage(err, "Erro ao eliminar o produto."),
        });
        if (confirmed) {
            toast.success(`Produto "${product.name}" eliminado com sucesso.`);
            invalidate(queryKeys.products.all);
        }
    };

    const hasData = products.length > 0;
    const start = total === 0 ? 0 : (currentPage - 1) * perPage + 1;
    const end = Math.min(start + products.length - 1, total);

    return (
        <div className="space-y-8 animate-fadeIn">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--color-text-primary)' }}>Produtos</h1>
                    <p className="mt-1" style={{ color: 'var(--color-text-secondary)' }}>Faça a gestão do catálogo de produtos reutilizáveis</p>
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

            {/* Filtros */}
            <div className="p-6 rounded-2xl shadow-sm space-y-3" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border-light)' }}>
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    <SearchInput
                        value={filters.q}
                        onChange={(q) => setFilter("q", q)}
                        placeholder="Pesquisar produtos..."
                        className="w-full md:w-96"
                    />
                    <RefreshButton onClick={refetch} isFetching={isFetching} updatedAt={dataUpdatedAt} />
                </div>
                <FilterChips chips={chips} onClearAll={clearFilters} resultCount={activeCount > 0 && !isLoading ? total : undefined} />
            </div>

            {isError && hasData && <StaleDataBanner onRetry={refetch} isRetrying={isFetching} />}

            {/* Table */}
            <div className="rounded-2xl shadow-sm overflow-hidden" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border-light)' }}>
                {isError && !hasData ? (
                    <ErrorState message={getErrorMessage(error, "Não foi possível carregar a lista de produtos.")} onRetry={refetch} isRetrying={isFetching} />
                ) : (
                    <>
                        <div className={`overflow-x-auto transition-opacity ${isPlaceholderData ? 'opacity-60' : ''}`}>
                            <table className="w-full">
                                <thead style={{ background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border-light)' }}>
                                    <tr>
                                        <th className={thClass} style={thStyle}>ID</th>
                                        <th className={thClass} style={thStyle}>Nome</th>
                                        <th className={thClass} style={thStyle}>Categoria</th>
                                        <th className={thClass} style={thStyle}>Unidade</th>
                                        <th className={thClass} style={thStyle}>Data Criação</th>
                                        <th className="px-6 py-5 text-center text-xs font-bold uppercase tracking-widest" style={thStyle}>Análise</th>
                                        <th className="px-6 py-5 text-center text-xs font-bold uppercase tracking-widest" style={thStyle}>Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {isLoading ? (
                                        <DashboardTableSkeleton rows={8} columns={7} />
                                    ) : !hasData ? (
                                        <tr>
                                            <td colSpan="7">
                                                {activeCount > 0 ? (
                                                    <EmptyState filtered onClearFilters={clearFilters} />
                                                ) : (
                                                    <EmptyState icon={Package} title="Nenhum produto registado" description="Adicione um produto para começar." />
                                                )}
                                            </td>
                                        </tr>
                                    ) : (
                                        products.map((product) => (
                                            <tr key={product.id} className="transition-colors group" onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                                <td className="px-6 py-6 text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>#{product.id}</td>
                                                <td className="px-6 py-6">
                                                    <div>
                                                        <p className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{product.name}</p>
                                                        {product.description && (
                                                            <p className="text-xs mt-0.5 truncate max-w-xs" style={{ color: 'var(--color-text-secondary)' }}>{product.description}</p>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-6">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                                                        {product.category?.name || product.category_id || "N/A"}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-6 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                                                    {product.unit || "-"}
                                                </td>
                                                <td className="px-6 py-6 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                                                    {formatDate(product.created_at)}
                                                </td>
                                                <td className="px-6 py-6 text-center">
                                                    <button
                                                        onClick={() => handleShowAnalytics(product)}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-bold transition-colors border border-blue-100"
                                                        title="Ver Histórico de Preços"
                                                    >
                                                        <TrendingUp size={14} />
                                                        Ver Histórico
                                                    </button>
                                                </td>
                                                <td className="px-6 py-6 text-center">
                                                    <div className="relative inline-block text-left dropdown-menu">
                                                        <button
                                                            onClick={() => setOpenMenuId(openMenuId === product.id ? null : product.id)}
                                                            className="p-2 rounded-lg transition-colors"
                                                            style={{ color: 'var(--color-text-muted)' }}
                                                            aria-label={`Acções de ${product.name}`}
                                                            onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-bg)'; e.currentTarget.style.color = 'var(--color-text-secondary)'; }}
                                                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-text-muted)'; }}
                                                        >
                                                            <MoreVertical size={18} />
                                                        </button>

                                                        {openMenuId === product.id && (
                                                            <div className="absolute right-0 mt-2 w-48 rounded-xl shadow-lg py-1 z-10 animate-fadeIn" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                                                                <button
                                                                    onClick={() => handleShowAnalytics(product)}
                                                                    className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-blue-600 hover:bg-blue-50 transition-colors"
                                                                >
                                                                    <TrendingUp size={16} />
                                                                    Ver Análise
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        setProductToEdit(product);
                                                                        setIsCreateModalOpen(true);
                                                                        setOpenMenuId(null);
                                                                    }}
                                                                    className="flex items-center gap-2 w-full px-4 py-2.5 text-sm transition-colors"
                                                                    style={{ color: 'var(--color-text-secondary)' }}
                                                                    onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg)'}
                                                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                                                >
                                                                    <Edit2 size={16} />
                                                                    Editar
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDelete(product)}
                                                                    className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                                                >
                                                                    <Trash2 size={16} />
                                                                    Eliminar
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

                        {!isLoading && (
                            <Pagination
                                page={currentPage}
                                totalPages={lastPage}
                                onPageChange={(page) => setFilter("page", Math.min(Math.max(1, page), lastPage))}
                                total={total}
                                start={start}
                                end={end}
                                isFetching={isFetching && isPlaceholderData}
                            />
                        )}
                    </>
                )}
            </div>

            {/* Modal - Criar/Editar (invalida a lista e mostra o toast) */}
            <ModalCriarProduto
                isOpen={isCreateModalOpen}
                onClose={() => {
                    setIsCreateModalOpen(false);
                    setProductToEdit(null);
                }}
                productToEdit={productToEdit}
            />

            {/* Modal - Análise */}
            <ModalProdutoAnalytics
                isOpen={isAnalyticsModalOpen}
                onClose={() => setIsAnalyticsModalOpen(false)}
                product={productForAnalytics}
            />
        </div>
    );
}
