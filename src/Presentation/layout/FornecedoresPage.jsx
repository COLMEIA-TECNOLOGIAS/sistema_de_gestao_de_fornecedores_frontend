import { useState, useEffect, useMemo, useRef } from "react";
import { SlidersHorizontal, MoreVertical, Trash2, Eye, FileText, CheckCircle, Send, Loader2, Building2, Tags } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import ModalCadastroFornecedor from "../Components/ModalCadastroFornecedor";
import ModalPedirCotacao from "../Components/ModalPedirCotacao";
import ModalDetalhesFornecedor from "../Components/ModalDetalhesFornecedor";
import ModalSolicitarEliminacao from "../Components/ModalSolicitarEliminacao";
import FornecedorTableSkeleton from "../Components/FornecedorTableSkeleton";
import SearchInput from "../Components/ui/SearchInput";
import RefreshButton from "../Components/ui/RefreshButton";
import FilterChips from "../Components/ui/FilterChips";
import Pagination from "../Components/ui/Pagination";
import SortableHeader from "../Components/ui/SortableHeader";
import { EmptyState, ErrorState, StaleDataBanner } from "../Components/ui/StateViews";
import { suppliersAPI, categoriesAPI, pendingDeletionsAPI } from "../../services/api";
import { useSuppliers, useCategories, useSupplierClassification, useInvalidate } from "../../hooks/queries";
import { useUrlFilters } from "../../hooks/useUrlFilters";
import { useSortedItems, useClientPagination } from "../../hooks/useTableData";
import { queryKeys } from "../../lib/queryKeys";
import { useToast } from "../../context/ToastContext";
import { useConfirm } from "../../context/ConfirmContext";
import { getErrorMessage, matchesSearch, normalizeText } from "../../utils/apiHelpers";

// Fornecedor com status "activo" — aparece na lista principal e na criação de cotação
const isActiveFornecedor = (f) => (f.is_active === 1 || f.is_active === true);
const getSupplierName = (f) => f.company_name || f.commercial_name || f.legal_name || "";
const isInvitePending = (f) => f.registration_status === "invited" && !isActiveFornecedor(f);
const toTimestamp = (value) => {
    const t = value ? Date.parse(value) : NaN;
    return Number.isFinite(t) ? t : null;
};

const TABS = ["fornecedores", "pendentes", "categorias"];

// Um único conjunto de filtros no URL, partilhado pelos separadores (mudar de separador repõe-no)
const FILTER_DEFAULTS = {
    tab: "fornecedores",
    q: "",
    categoria: "",
    provincia: "",
    municipio: "",
    estado: "",
    sort: "",
    dir: "",
    page: 1,
    pageSize: 25,
};

// Estado dentro do separador "Pendentes & Convidados"
const ESTADO_LABELS = {
    convidado: "Convite pendente",
    aguarda: "A aguardar aprovação",
};

const SUPPLIER_SORT_ACCESSORS = {
    id: (f) => Number(f.id) || 0,
    nome: getSupplierName,
    nif: (f) => f.nif,
    categoria: (f) => f.categories?.[0]?.name || "",
    localizacao: (f) => [f.province, f.municipality].filter(Boolean).join(" "),
    data: (f) => toTimestamp(f.created_at),
    estado: (f) => (isActiveFornecedor(f) ? 0 : isInvitePending(f) ? 2 : 1),
};

const CATEGORY_SORT_ACCESSORS = {
    id: (c) => Number(c.id) || 0,
    nome: (c) => c.name,
    descricao: (c) => c.description,
    data: (c) => toTimestamp(c.created_at),
};

const thSupplier = "px-3 py-3 text-left text-[13px] font-semibold whitespace-nowrap";
const thCategory = "px-6 py-4 text-left text-sm font-semibold";
const thStyle = { color: 'var(--color-text-secondary)' };
const filterSelectClass = "w-full p-2 border rounded-lg text-sm bg-transparent outline-none";
const filterSelectStyle = { borderColor: 'var(--color-border-light)', color: 'var(--color-text-primary)' };

// Valores distintos (ignorando maiúsculas/acentos), ordenados
const distinctValues = (values) => {
    const map = new Map();
    values.forEach((v) => {
        const label = typeof v === "string" ? v.trim() : "";
        if (!label) return;
        const key = normalizeText(label);
        if (!map.has(key)) map.set(key, label);
    });
    return [...map.values()].sort((a, b) => a.localeCompare(b, "pt"));
};

/** Avaliação de um fornecedor — só é pedida para as linhas visíveis (cache por id). */
function ClassificationCell({ supplierId }) {
    const { data, isLoading, isError } = useSupplierClassification(supplierId, { retry: 1 });
    const score = Math.max(0, Math.min(100, Math.round(Number(data?.overall_score) || 0)));

    if (isLoading) {
        return <div className="w-16 h-3 rounded animate-pulse" style={{ background: 'var(--color-border)' }} />;
    }

    return (
        <div className="w-16" title={isError ? "Avaliação indisponível" : `Avaliação: ${score}%`}>
            <div className="flex justify-between mb-1">
                <span className="text-xs font-bold text-[#44B16F]">
                    {isError ? "—" : `${score}%`}
                </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1">
                <div className="bg-[#44B16F] h-1 rounded-full" style={{ width: `${isError ? 0 : score}%` }}></div>
            </div>
        </div>
    );
}

export default function FornecedoresPage() {
    const { isAdmin } = useAuth();
    const toast = useToast();
    const confirm = useConfirm();
    const invalidate = useInvalidate();

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCotacaoModalOpen, setIsCotacaoModalOpen] = useState(false);
    const [isDetalhesModalOpen, setIsDetalhesModalOpen] = useState(false);
    const [selectedSnapshot, setSelectedSnapshot] = useState(null);
    const [openMenuId, setOpenMenuId] = useState(null);
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    // Pedido de eliminação (não-admin): recolhe o motivo
    const [itemToDelete, setItemToDelete] = useState(null);

    // Nova categoria
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");
    const [newCategoryDesc, setNewCategoryDesc] = useState("");
    const [isSubmittingCategory, setIsSubmittingCategory] = useState(false);

    const suppliersQuery = useSuppliers();
    const categoriesQuery = useCategories();
    const fornecedores = useMemo(() => suppliersQuery.data ?? [], [suppliersQuery.data]);
    const categories = useMemo(() => categoriesQuery.data ?? [], [categoriesQuery.data]);

    const { filters, setFilter, setFilters, resetFilters, countActive } = useUrlFilters(FILTER_DEFAULTS);
    const activeTab = TABS.includes(filters.tab) ? filters.tab : "fornecedores";
    const isCategoriesTab = activeTab === "categorias";

    // Manter o fornecedor seleccionado sincronizado com os dados mais recentes
    const selectedFornecedor = useMemo(() => {
        if (!selectedSnapshot) return null;
        return fornecedores.find((f) => f.id === selectedSnapshot.id) || selectedSnapshot;
    }, [selectedSnapshot, fornecedores]);

    const activeSuppliers = useMemo(() => fornecedores.filter(isActiveFornecedor), [fornecedores]);
    const pendingSuppliers = useMemo(() => fornecedores.filter((f) => !isActiveFornecedor(f)), [fornecedores]);
    const tabSuppliers = activeTab === "pendentes" ? pendingSuppliers : activeSuppliers;

    // Opções dos filtros de localização (a partir dos dados existentes)
    const provinceOptions = useMemo(() => distinctValues(fornecedores.map((f) => f.province)), [fornecedores]);
    const municipalityOptions = useMemo(() => distinctValues(
        fornecedores
            .filter((f) => !filters.provincia || normalizeText(f.province) === normalizeText(filters.provincia))
            .map((f) => f.municipality)
    ), [fornecedores, filters.provincia]);

    const filteredFornecedores = useMemo(() => tabSuppliers.filter((f) => {
        if (!matchesSearch(filters.q, getSupplierName(f), f.commercial_name, f.email, f.nif, f.phone, f.id)) return false;
        if (filters.categoria && !(f.categories || []).some((cat) => String(cat.id) === String(filters.categoria))) return false;
        if (filters.provincia && normalizeText(f.province) !== normalizeText(filters.provincia)) return false;
        if (filters.municipio && normalizeText(f.municipality) !== normalizeText(filters.municipio)) return false;
        if (activeTab === "pendentes") {
            if (filters.estado === "convidado" && !isInvitePending(f)) return false;
            if (filters.estado === "aguarda" && isInvitePending(f)) return false;
        }
        return true;
    }), [tabSuppliers, activeTab, filters.q, filters.categoria, filters.provincia, filters.municipio, filters.estado]);

    const filteredCategories = useMemo(
        () => categories.filter((c) => matchesSearch(filters.q, c.name, c.description, c.id)),
        [categories, filters.q]
    );

    const sortedFornecedores = useSortedItems(filteredFornecedores, filters, SUPPLIER_SORT_ACCESSORS);
    const sortedCategories = useSortedItems(filteredCategories, filters, CATEGORY_SORT_ACCESSORS);
    const pagination = useClientPagination(isCategoriesTab ? sortedCategories : sortedFornecedores, filters.page, filters.pageSize);

    const categoryLabel = (id) => categories.find((c) => String(c.id) === String(id))?.name || `#${id}`;

    const chips = isCategoriesTab
        ? [filters.q && { key: "q", label: `"${filters.q}"`, onRemove: () => setFilter("q", "") }]
        : [
            filters.q && { key: "q", label: `"${filters.q}"`, onRemove: () => setFilter("q", "") },
            filters.categoria && { key: "categoria", label: `Categoria: ${categoryLabel(filters.categoria)}`, onRemove: () => setFilter("categoria", "") },
            filters.provincia && { key: "provincia", label: `Província: ${filters.provincia}`, onRemove: () => setFilters({ provincia: "", municipio: "" }) },
            filters.municipio && { key: "municipio", label: `Município: ${filters.municipio}`, onRemove: () => setFilter("municipio", "") },
            activeTab === "pendentes" && filters.estado && { key: "estado", label: `Estado: ${ESTADO_LABELS[filters.estado] || filters.estado}`, onRemove: () => setFilter("estado", "") },
        ];
    const activeCount = chips.filter(Boolean).length;
    const panelFiltersCount = countActive(["tab", "q"]);
    const clearFilters = () => resetFilters(["tab", "pageSize", "sort", "dir"]);
    const clearPanelFilters = () => setFilters({ categoria: "", provincia: "", municipio: "", estado: "" });

    const changeTab = (tab) => {
        if (tab === activeTab) return;
        setOpenMenuId(null);
        setIsFilterOpen(false);
        // Os filtros/ordenação de um separador não se aplicam aos outros
        setFilters({ tab, q: "", categoria: "", provincia: "", municipio: "", estado: "", sort: "", dir: "" });
    };

    const onSort = (sort, dir) => setFilters({ sort, dir });

    const refreshSuppliers = () => invalidate(queryKeys.suppliers.all, queryKeys.dashboard.all);

    const openDetails = (f) => {
        setSelectedSnapshot(f);
        setIsDetalhesModalOpen(true);
        setOpenMenuId(null);
    };

    const handleDeleteFornecedor = async (fornecedor) => {
        setOpenMenuId(null);
        const name = getSupplierName(fornecedor) || "Fornecedor";
        if (!isAdmin) {
            setItemToDelete({ type: 'supplier', id: fornecedor.id, name });
            return;
        }
        const confirmed = await confirm({
            title: "Eliminar Fornecedor",
            message: (
                <p className="text-gray-600">
                    Tem a certeza de que pretende eliminar <strong className="text-gray-900">{name}</strong>?
                    <span className="block text-sm text-gray-500 mt-2">Esta acção não pode ser desfeita e removerá todos os dados associados.</span>
                </p>
            ),
            confirmLabel: "Sim, eliminar",
            runningLabel: "A eliminar...",
            variant: "danger",
            onConfirm: () => suppliersAPI.delete(fornecedor.id),
            getErrorMessage: (err) => getErrorMessage(err, "Erro ao eliminar o fornecedor."),
        });
        if (confirmed) {
            toast.success(`Fornecedor "${name}" eliminado com sucesso.`);
            if (selectedSnapshot?.id === fornecedor.id) {
                setSelectedSnapshot(null);
                setIsDetalhesModalOpen(false);
            }
            invalidate(queryKeys.suppliers.all, queryKeys.deletionRequests.all, queryKeys.dashboard.all);
        }
    };

    // Contrato do ModalSolicitarEliminacao: lançar o erro mantém o modal aberto
    const confirmSolicitarEliminacao = async (reason) => {
        if (!itemToDelete) return;
        try {
            await pendingDeletionsAPI.requestDelete(itemToDelete.type, itemToDelete.id, reason);
            setItemToDelete(null);
            toast.success('Solicitação de eliminação enviada ao administrador.');
            invalidate(queryKeys.deletionRequests.all, queryKeys.suppliers.all, queryKeys.dashboard.all);
        } catch (err) {
            const status = err.response?.status;
            const message = status === 409
                ? 'Já existe uma solicitação de eliminação pendente para este fornecedor.'
                : status === 403
                    ? 'Não tem permissão para solicitar eliminações.'
                    : getErrorMessage(err, 'Erro ao solicitar a eliminação.');
            toast.error(message);
            throw err;
        }
    };

    const handleApproveSupplier = async (fornecedor) => {
        setOpenMenuId(null);
        const name = getSupplierName(fornecedor) || "este fornecedor";
        const confirmed = await confirm({
            title: "Aprovar Fornecedor",
            message: (
                <p className="text-gray-600">
                    Pretende aprovar <strong className="text-gray-900">{name}</strong>?
                    <span className="block text-sm text-gray-500 mt-2">O fornecedor passará a estar activo e disponível para pedidos de cotação.</span>
                </p>
            ),
            confirmLabel: "Aprovar",
            runningLabel: "A aprovar...",
            onConfirm: () => suppliersAPI.approve(fornecedor.id),
            getErrorMessage: (err) => getErrorMessage(err, "Erro ao aprovar o fornecedor."),
        });
        if (confirmed) {
            toast.success(`Fornecedor "${name}" aprovado com sucesso.`);
            refreshSuppliers();
        }
    };

    const closeCategoryModal = () => {
        if (isSubmittingCategory) return;
        setIsCategoryModalOpen(false);
        setNewCategoryName('');
        setNewCategoryDesc('');
    };

    const handleCreateCategory = async () => {
        if (isSubmittingCategory) return;
        const name = newCategoryName.trim();
        if (!name) {
            toast.error('O nome da categoria é obrigatório.');
            return;
        }
        if (categories.some((c) => normalizeText(c.name) === normalizeText(name))) {
            toast.error(`Já existe uma categoria com o nome "${name}".`);
            return;
        }
        setIsSubmittingCategory(true);
        try {
            await categoriesAPI.create({ name, description: newCategoryDesc.trim() });
            toast.success('Categoria criada com sucesso.');
            setIsCategoryModalOpen(false);
            setNewCategoryName('');
            setNewCategoryDesc('');
            invalidate(queryKeys.categories.all, queryKeys.suppliers.all);
        } catch (err) {
            toast.error(getErrorMessage(err, 'Erro ao criar a categoria.'));
        } finally {
            setIsSubmittingCategory(false);
        }
    };

    const handleDeleteCategory = async (cat) => {
        const confirmed = await confirm({
            title: "Remover Categoria",
            message: (
                <p className="text-gray-600">
                    Tem a certeza de que pretende remover a categoria <strong className="text-gray-900">{cat.name}</strong>?
                </p>
            ),
            confirmLabel: "Sim, remover",
            runningLabel: "A remover...",
            variant: "danger",
            onConfirm: () => categoriesAPI.delete(cat.id),
            getErrorMessage: (err) => getErrorMessage(err, "Erro ao remover a categoria."),
        });
        if (confirmed) {
            toast.success(`Categoria "${cat.name}" removida com sucesso.`);
            if (String(filters.categoria) === String(cat.id)) setFilter("categoria", "");
            invalidate(queryKeys.categories.all, queryKeys.suppliers.all);
        }
    };

    // Fechar o menu de acções ao clicar fora
    useEffect(() => {
        if (!openMenuId) return;
        const handleClickOutside = (event) => {
            if (!event.target.closest('.dropdown-menu')) setOpenMenuId(null);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [openMenuId]);

    // Fechar o painel de filtros ao clicar fora
    const filterRef = useRef(null);
    useEffect(() => {
        if (!isFilterOpen) return;
        const handleClickOutside = (event) => {
            if (filterRef.current && !filterRef.current.contains(event.target)) setIsFilterOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isFilterOpen]);

    // Estado do separador activo
    const current = isCategoriesTab ? categoriesQuery : suppliersQuery;
    const hasData = isCategoriesTab ? categories.length > 0 : tabSuppliers.length > 0;
    const hasAnyData = isCategoriesTab ? categories.length > 0 : fornecedores.length > 0;
    const isFiltered = activeCount > 0;

    const pageFooter = !current.isLoading && (
        <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={(page) => setFilter("page", page)}
            total={pagination.total}
            start={pagination.start}
            end={pagination.end}
            pageSize={filters.pageSize}
            onPageSizeChange={(pageSize) => setFilter("pageSize", pageSize)}
            pageSizeOptions={[10, 25, 50, 100]}
        />
    );

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                        Fornecedores
                    </h1>
                    <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                        Faça a gestão dos fornecedores registados no sistema.
                    </p>
                </div>
                {isCategoriesTab ? (
                    <button onClick={() => setIsCategoryModalOpen(true)} className="btn-primary">
                        + Adicionar Categoria
                    </button>
                ) : (
                    <button onClick={() => { setSelectedSnapshot(null); setIsModalOpen(true); }} className="btn-primary">
                        + Adicionar Fornecedor
                    </button>
                )}
            </div>

            {/* Tabs Section */}
            <div className="tab-bar">
                <button
                    onClick={() => changeTab("fornecedores")}
                    className={`tab-item ${activeTab === "fornecedores" ? 'active' : ''}`}
                >
                    Fornecedores
                    <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#44B16F]/10 text-[#44B16F]">
                        {activeSuppliers.length}
                    </span>
                </button>
                <button
                    onClick={() => changeTab("pendentes")}
                    className={`tab-item ${activeTab === "pendentes" ? 'active' : ''}`}
                >
                    Pendentes & Convidados
                    <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${activeTab === "pendentes" ? 'bg-amber-100 text-amber-700' : 'bg-amber-50 text-amber-600'}`}>
                        {pendingSuppliers.length}
                    </span>
                </button>
                <button
                    onClick={() => changeTab("categorias")}
                    className={`tab-item ${activeTab === "categorias" ? 'active' : ''}`}
                >
                    Categorias
                </button>
            </div>

            {/* Toolbar: pesquisa, filtros e actualização */}
            <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                    <SearchInput
                        key={activeTab}
                        value={filters.q}
                        onChange={(q) => setFilter("q", q)}
                        placeholder={isCategoriesTab ? "Pesquisar categoria..." : "Pesquisar por nome, email, NIF..."}
                        className="w-full sm:w-80"
                    />

                    {!isCategoriesTab && (
                        <div className="relative" ref={filterRef}>
                            <button
                                onClick={() => setIsFilterOpen((open) => !open)}
                                className="btn-secondary"
                                aria-expanded={isFilterOpen}
                                style={panelFiltersCount > 0 ? { borderColor: 'var(--color-primary)', color: 'var(--color-primary)' } : {}}
                            >
                                <SlidersHorizontal size={16} />
                                Filtros
                                {panelFiltersCount > 0 && (
                                    <span
                                        className="flex items-center justify-center rounded-full text-white text-xs font-bold"
                                        style={{ background: 'var(--color-primary)', width: '18px', height: '18px', fontSize: '10px' }}
                                    >{panelFiltersCount}</span>
                                )}
                            </button>

                            {isFilterOpen && (
                                <div className="absolute left-0 top-full mt-2 w-80 rounded-xl p-4 z-50 overflow-y-auto max-h-96"
                                    style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-xl)' }}>
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Filtros</h3>
                                        <button onClick={clearPanelFilters} className="text-xs text-red-500 font-medium hover:text-red-700 transition-colors">Limpar filtros</button>
                                    </div>

                                    <div className="space-y-4">
                                        {/* Categoria */}
                                        <div>
                                            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-text-secondary)' }}>Categoria</label>
                                            <select
                                                value={filters.categoria}
                                                onChange={(e) => setFilter("categoria", e.target.value)}
                                                className={filterSelectClass}
                                                style={filterSelectStyle}
                                                disabled={categoriesQuery.isLoading}
                                            >
                                                <option value="">{categoriesQuery.isLoading ? "A carregar..." : "Todas"}</option>
                                                {categories.map(cat => (
                                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Província */}
                                        <div>
                                            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-text-secondary)' }}>Província</label>
                                            <select
                                                value={filters.provincia}
                                                onChange={(e) => setFilters({ provincia: e.target.value, municipio: "" })}
                                                className={filterSelectClass}
                                                style={filterSelectStyle}
                                            >
                                                <option value="">Todas</option>
                                                {provinceOptions.map((p) => <option key={p} value={p}>{p}</option>)}
                                            </select>
                                        </div>

                                        {/* Município */}
                                        <div>
                                            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-text-secondary)' }}>Município</label>
                                            <select
                                                value={filters.municipio}
                                                onChange={(e) => setFilter("municipio", e.target.value)}
                                                className={filterSelectClass}
                                                style={filterSelectStyle}
                                            >
                                                <option value="">Todos</option>
                                                {municipalityOptions.map((m) => <option key={m} value={m}>{m}</option>)}
                                            </select>
                                        </div>

                                        {/* Estado (apenas nos pendentes: no separador principal todos estão activos) */}
                                        {activeTab === "pendentes" && (
                                            <div>
                                                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-text-secondary)' }}>Estado</label>
                                                <select
                                                    value={filters.estado}
                                                    onChange={(e) => setFilter("estado", e.target.value)}
                                                    className={filterSelectClass}
                                                    style={filterSelectStyle}
                                                >
                                                    <option value="">Todos</option>
                                                    <option value="convidado">{ESTADO_LABELS.convidado}</option>
                                                    <option value="aguarda">{ESTADO_LABELS.aguarda}</option>
                                                </select>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <RefreshButton
                        onClick={() => current.refetch()}
                        isFetching={current.isFetching}
                        updatedAt={current.dataUpdatedAt}
                        className="ml-auto"
                    />
                </div>
                <FilterChips chips={chips} onClearAll={clearFilters} resultCount={isFiltered ? pagination.total : undefined} />
            </div>

            {/* Falha numa actualização em segundo plano: manter os dados antigos visíveis */}
            {current.isError && hasAnyData && (
                <StaleDataBanner onRetry={() => current.refetch()} isRetrying={current.isFetching} />
            )}

            {/* Content Area */}
            {isCategoriesTab ? (
                <div className="card overflow-hidden">
                    {categoriesQuery.isError && !hasAnyData ? (
                        <ErrorState
                            message={getErrorMessage(categoriesQuery.error, "Erro ao carregar categorias.")}
                            onRetry={() => categoriesQuery.refetch()}
                            isRetrying={categoriesQuery.isFetching}
                        />
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead style={{ background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }}>
                                        <tr>
                                            <SortableHeader label="ID" sortKey="id" sort={filters.sort} dir={filters.dir} onSort={onSort} className={thCategory} style={thStyle} />
                                            <SortableHeader label="Nome" sortKey="nome" sort={filters.sort} dir={filters.dir} onSort={onSort} className={thCategory} style={thStyle} />
                                            <SortableHeader label="Descrição" sortKey="descricao" sort={filters.sort} dir={filters.dir} onSort={onSort} className={thCategory} style={thStyle} />
                                            <SortableHeader label="Data de Registo" sortKey="data" sort={filters.sort} dir={filters.dir} onSort={onSort} className={thCategory} style={thStyle} />
                                            <th className="px-6 py-4 text-center text-sm font-semibold" style={thStyle}>Acções</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {categoriesQuery.isLoading ? (
                                            <tr>
                                                <td colSpan="5" className="px-6 py-12 text-center" style={{ color: 'var(--color-text-secondary)' }}>
                                                    <Loader2 size={24} className="animate-spin mx-auto" />
                                                </td>
                                            </tr>
                                        ) : pagination.total === 0 ? (
                                            <tr>
                                                <td colSpan="5">
                                                    {hasData ? (
                                                        <EmptyState filtered onClearFilters={clearFilters} />
                                                    ) : (
                                                        <EmptyState icon={Tags} title="Nenhuma categoria encontrada" description="Adicione uma categoria para organizar os fornecedores." />
                                                    )}
                                                </td>
                                            </tr>
                                        ) : (
                                            pagination.pageItems.map(cat => (
                                                <tr key={cat.id} className="transition-colors" style={{ borderBottom: '1px solid var(--color-border-light)' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                                    <td className="px-6 py-4 font-medium" style={{ color: 'var(--color-text-secondary)' }}>#{cat.id}</td>
                                                    <td className="px-6 py-4 font-semibold" style={{ color: 'var(--color-text-primary)' }}>{cat.name}</td>
                                                    <td className="px-6 py-4" style={{ color: 'var(--color-text-secondary)' }}>{cat.description || '-'}</td>
                                                    <td className="px-6 py-4" style={{ color: 'var(--color-text-secondary)' }}>
                                                        {cat.created_at ? new Date(cat.created_at).toLocaleDateString('pt-AO') : '-'}
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <button
                                                            onClick={() => handleDeleteCategory(cat)}
                                                            className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
                                                            title="Remover categoria"
                                                            aria-label={`Remover categoria ${cat.name}`}
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            {pageFooter}
                        </>
                    )}
                </div>
            ) : (
                <div className="card overflow-hidden">
                    {suppliersQuery.isError && !hasAnyData ? (
                        <ErrorState
                            message={getErrorMessage(suppliersQuery.error, "Erro ao carregar fornecedores.")}
                            onRetry={() => suppliersQuery.refetch()}
                            isRetrying={suppliersQuery.isFetching}
                        />
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead style={{ background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }}>
                                        <tr>
                                            <th className="px-3 py-3 text-left">
                                                <input type="checkbox" className="rounded border-gray-300" aria-label="Seleccionar todos" />
                                            </th>
                                            <SortableHeader label="ID" sortKey="id" sort={filters.sort} dir={filters.dir} onSort={onSort} className={thSupplier} style={thStyle} />
                                            <SortableHeader label="Fornecedor" sortKey="nome" sort={filters.sort} dir={filters.dir} onSort={onSort} className={`${thSupplier} w-[240px]`} style={thStyle} />
                                            <SortableHeader label="NIF" sortKey="nif" sort={filters.sort} dir={filters.dir} onSort={onSort} className={`${thSupplier} w-[140px]`} style={thStyle} />
                                            <th className={thSupplier} style={thStyle}>Contactos</th>
                                            <th className={thSupplier} style={thStyle}>Avaliação</th>
                                            <SortableHeader label="Categoria" sortKey="categoria" sort={filters.sort} dir={filters.dir} onSort={onSort} className={thSupplier} style={thStyle} />
                                            <SortableHeader label="Localização" sortKey="localizacao" sort={filters.sort} dir={filters.dir} onSort={onSort} className={thSupplier} style={thStyle} />
                                            <SortableHeader label="Data Registo" sortKey="data" sort={filters.sort} dir={filters.dir} onSort={onSort} className={thSupplier} style={thStyle} />
                                            <SortableHeader label="Status" sortKey="estado" sort={filters.sort} dir={filters.dir} onSort={onSort} className={thSupplier} style={thStyle} />
                                            <th className="px-3 py-3 text-center text-[13px] font-semibold whitespace-nowrap" style={thStyle}>Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {suppliersQuery.isLoading ? (
                                            <FornecedorTableSkeleton rows={10} />
                                        ) : pagination.total === 0 ? (
                                            <tr>
                                                <td colSpan="11">
                                                    {hasData ? (
                                                        <EmptyState filtered onClearFilters={clearFilters} />
                                                    ) : activeTab === 'pendentes' ? (
                                                        <EmptyState
                                                            icon={Send}
                                                            title="Nenhum fornecedor pendente"
                                                            description="Os convidados que ainda não concluíram o registo aparecerão aqui"
                                                        />
                                                    ) : (
                                                        <EmptyState
                                                            icon={Building2}
                                                            title="Nenhum fornecedor encontrado"
                                                            description="Adicione um fornecedor para começar"
                                                        />
                                                    )}
                                                </td>
                                            </tr>
                                        ) : (
                                            pagination.pageItems.map((f) => (
                                                <tr key={f.id} className="transition-colors" style={{ borderBottom: '1px solid var(--color-border-light)' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                                    <td className="px-3 py-3">
                                                        <input type="checkbox" className="rounded border-gray-300" aria-label={`Seleccionar ${getSupplierName(f)}`} />
                                                    </td>
                                                    <td className="px-3 py-3 cursor-pointer" onClick={() => openDetails(f)}>
                                                        <span className="font-medium" style={{ color: 'var(--color-text-secondary)' }}>#{f.id}</span>
                                                    </td>
                                                    <td className="px-3 py-3 cursor-pointer max-w-[240px]" onClick={() => openDetails(f)}>
                                                        <div className="flex items-center gap-2 min-w-0">
                                                            <img
                                                                src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(getSupplierName(f) || 'N/A')}`}
                                                                alt={getSupplierName(f)}
                                                                className="w-10 h-10 rounded-lg flex-shrink-0"
                                                            />
                                                            <span
                                                                className="block min-w-0 flex-1 font-semibold text-[13px] truncate"
                                                                style={{ color: 'var(--color-text-primary)' }}
                                                                title={getSupplierName(f) || 'N/A'}
                                                            >
                                                                {getSupplierName(f) || 'N/A'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-3 cursor-pointer text-[13px] whitespace-nowrap w-[140px]" style={{ color: 'var(--color-text-secondary)' }} onClick={() => openDetails(f)}>
                                                        <span>{f.nif || 'N/A'}</span>
                                                    </td>
                                                    <td className="px-3 py-3 cursor-pointer text-[13px]" style={{ color: 'var(--color-text-secondary)' }} onClick={() => openDetails(f)}>
                                                        <div className="flex flex-col">
                                                            <span className="whitespace-nowrap">{f.phone || 'N/A'}</span>
                                                            <span className="text-xs truncate max-w-[140px]" title={f.email}>{f.email || 'N/A'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-3">
                                                        <ClassificationCell supplierId={f.id} />
                                                    </td>
                                                    <td className="px-3 py-3">
                                                        <div className="flex flex-wrap gap-1 max-w-[150px]">
                                                            {f.categories && f.categories.length > 0 ? (
                                                                <span
                                                                    className="px-2 py-1 rounded-md text-xs font-bold truncate max-w-full"
                                                                    style={{ color: '#059669', background: 'rgba(16,185,129,0.1)' }}
                                                                    title={f.categories.map((c) => c.name).join(', ')}
                                                                >
                                                                    {f.categories[0].name} {f.categories.length > 1 && `+${f.categories.length - 1}`}
                                                                </span>
                                                            ) : (
                                                                <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Geral</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-3 text-[13px]" style={{ color: 'var(--color-text-secondary)' }}>
                                                        <span className="line-clamp-1 truncate block max-w-[120px]" title={`${f.municipality || 'N/A'}, ${f.province || 'N/A'}`}>{f.municipality || 'N/A'}, {f.province || 'N/A'}</span>
                                                    </td>
                                                    <td className="px-3 py-3 text-[13px]" style={{ color: 'var(--color-text-secondary)' }}>
                                                        <span className="whitespace-nowrap">
                                                            {f.created_at ? new Date(f.created_at).toLocaleDateString('pt-AO', { day: '2-digit', month: '2-digit', year: '2-digit' }) : 'N/A'}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 py-3">
                                                        <div className="flex flex-col gap-2">
                                                            {isInvitePending(f) ? (
                                                                <span className="px-2 py-1 rounded-md text-xs font-medium w-fit" style={{ color: '#d97706', background: 'rgba(245,158,11,0.1)' }}>
                                                                    Pendente
                                                                </span>
                                                            ) : (
                                                                <span className="px-2 py-1 rounded-md text-xs font-medium w-fit" style={{ color: f.is_active ? '#059669' : '#dc2626', background: f.is_active ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)' }}>
                                                                    {f.is_active ? 'Ativo' : 'Inativo'}
                                                                </span>
                                                            )}

                                                            {(f.is_active && (f.registration_status === 'invited' || f.registration_status === 'completed')) || f.registration_status === 'approved' ? (
                                                                <span className="px-2 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 w-fit" style={{ color: '#2563eb', background: 'rgba(59,130,246,0.1)' }}>
                                                                    <CheckCircle size={12} /> Aprovado
                                                                </span>
                                                            ) : f.registration_status === 'invited' ? (
                                                                <span className="px-2 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 w-fit" style={{ color: '#d97706', background: 'rgba(245,158,11,0.1)' }}>
                                                                    <Send size={12} /> Pendente
                                                                </span>
                                                            ) : f.registration_status === 'completed' ? (
                                                                <span className="px-2 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 w-fit" style={{ color: '#059669', background: 'rgba(16,185,129,0.1)' }}>
                                                                    <CheckCircle size={12} /> Completo
                                                                </span>
                                                            ) : (
                                                                <span className="px-2 py-1 rounded-md text-[11px] font-bold w-fit" style={{ color: 'var(--color-text-secondary)', background: 'var(--color-bg)' }}>
                                                                    {f.registration_status || 'Externo'}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-3">
                                                        <div className="flex items-center justify-center gap-2">
                                                            {!f.is_active && f.registration_status !== 'invited' && (
                                                                <button
                                                                    onClick={() => handleApproveSupplier(f)}
                                                                    className="p-1.5 bg-emerald-50 text-emerald-700 rounded-md hover:bg-emerald-100 transition-colors flex items-center justify-center border border-emerald-200"
                                                                    title="Aprovar"
                                                                    aria-label={`Aprovar ${getSupplierName(f)}`}
                                                                >
                                                                    <CheckCircle size={14} />
                                                                </button>
                                                            )}

                                                            <div className="relative dropdown-menu">
                                                                <button
                                                                    onClick={() => setOpenMenuId(openMenuId === f.id ? null : f.id)}
                                                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                                                    aria-label={`Acções para ${getSupplierName(f)}`}
                                                                    aria-expanded={openMenuId === f.id}
                                                                >
                                                                    <MoreVertical size={20} style={{ color: 'var(--color-text-secondary)' }} />
                                                                </button>

                                                                {openMenuId === f.id && (
                                                                    <div className="absolute right-0 top-full mt-2 w-56 rounded-xl shadow-xl py-1 z-50" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                                                                        <button
                                                                            onClick={() => openDetails(f)}
                                                                            className="w-full px-4 py-3 text-left text-sm flex items-center gap-3 transition-colors rounded-lg mx-1"
                                                                            onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg)'}
                                                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                                                        >
                                                                            <Eye size={16} style={{ color: 'var(--color-text-muted)' }} />
                                                                            <span style={{ color: 'var(--color-text-secondary)' }}>Mais detalhes</span>
                                                                        </button>

                                                                        <button
                                                                            onClick={() => {
                                                                                setSelectedSnapshot(f);
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

                                                                        {isActiveFornecedor(f) ? (
                                                                            <button
                                                                                onClick={() => {
                                                                                    setSelectedSnapshot(f);
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
                                                                            <span style={{ color: 'var(--color-text-secondary)' }}>{isAdmin ? 'Eliminar' : 'Solicitar eliminação'}</span>
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
                            {pageFooter}
                        </>
                    )}
                </div>
            )}

            {/* Modals */}
            <ModalCadastroFornecedor
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setSelectedSnapshot(null);
                }}
                fornecedor={selectedFornecedor}
            />

            <ModalDetalhesFornecedor
                isOpen={isDetalhesModalOpen}
                onClose={() => {
                    setIsDetalhesModalOpen(false);
                    setSelectedSnapshot(null);
                }}
                onEdit={() => {
                    setIsDetalhesModalOpen(false);
                    setIsModalOpen(true);
                }}
                fornecedor={selectedFornecedor}
            />

            <ModalPedirCotacao
                isOpen={isCotacaoModalOpen}
                onClose={() => {
                    setIsCotacaoModalOpen(false);
                    setSelectedSnapshot(null);
                }}
                onSuccess={() => toast.success('Pedido de cotação criado e enviado com sucesso.')}
                fornecedor={selectedFornecedor}
            />

            <ModalSolicitarEliminacao
                isOpen={!!itemToDelete}
                onClose={() => setItemToDelete(null)}
                onSubmit={confirmSolicitarEliminacao}
                itemName={itemToDelete?.name}
                itemTypeLabel="fornecedor"
            />

            {/* Category Modal */}
            {isCategoryModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={closeCategoryModal}>
                    <div
                        className="rounded-2xl max-w-md w-full p-6 shadow-2xl animate-scaleIn"
                        style={{ background: 'var(--color-surface)' }}
                        onClick={e => e.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                        onKeyDown={(e) => { if (e.key === 'Escape') closeCategoryModal(); }}
                    >
                        <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>Nova Categoria</h2>
                        <form onSubmit={(e) => { e.preventDefault(); handleCreateCategory(); }}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold mb-2" style={{ color: 'var(--color-text-secondary)' }}>Nome</label>
                                    <input
                                        type="text"
                                        value={newCategoryName}
                                        onChange={e => setNewCategoryName(e.target.value)}
                                        className="input-field"
                                        placeholder="Ex: Material de Escritório"
                                        maxLength={255}
                                        disabled={isSubmittingCategory}
                                        autoFocus
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold mb-2" style={{ color: 'var(--color-text-secondary)' }}>Descrição (Opcional)</label>
                                    <textarea
                                        value={newCategoryDesc}
                                        onChange={e => setNewCategoryDesc(e.target.value)}
                                        className="input-field resize-none"
                                        placeholder="Descrição da categoria..."
                                        rows={3}
                                        disabled={isSubmittingCategory}
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 justify-end mt-6">
                                <button
                                    type="button"
                                    onClick={closeCategoryModal}
                                    disabled={isSubmittingCategory}
                                    className="btn-secondary"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmittingCategory || !newCategoryName.trim()}
                                    className="px-4 py-2 font-bold text-white bg-[#44B16F] hover:bg-[#3a9d5f] rounded-lg transition-colors flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {isSubmittingCategory && <Loader2 size={16} className="animate-spin" />}
                                    {isSubmittingCategory ? 'A criar...' : 'Criar Categoria'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
