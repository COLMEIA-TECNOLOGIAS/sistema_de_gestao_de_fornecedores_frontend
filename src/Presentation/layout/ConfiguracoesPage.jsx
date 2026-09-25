import { useMemo, useState } from 'react';
import { Settings, Plus, List, Loader2, Save } from 'lucide-react';
import { menusAPI } from '../../services/api';
import SearchInput from '../Components/ui/SearchInput';
import RefreshButton from '../Components/ui/RefreshButton';
import FilterChips from '../Components/ui/FilterChips';
import SortableHeader from '../Components/ui/SortableHeader';
import { EmptyState, ErrorState, StaleDataBanner } from '../Components/ui/StateViews';
import { useMenus, useInvalidate } from '../../hooks/queries';
import { useUrlFilters } from '../../hooks/useUrlFilters';
import { useSortedItems } from '../../hooks/useTableData';
import { queryKeys } from '../../lib/queryKeys';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage, getFieldErrors, matchesSearch } from '../../utils/apiHelpers';

const EMPTY_FORM = {
    name: '',
    slug: '',
    parent_id: 0,
    description: '',
    icon: '',
    order: 0,
    is_active: true
};

const FILTER_DEFAULTS = { q: '', estado: '', sort: '', dir: '' };
const ESTADO_LABELS = { activo: 'Activo', inactivo: 'Inactivo' };

const isMenuActive = (m) => !!m.is_active;

const SORT_ACCESSORS = {
    nome: (m) => m.name,
    slug: (m) => m.slug,
    ordem: (m) => Number(m.order) || 0,
    estado: (m) => (isMenuActive(m) ? 0 : 1),
};

// Sem ordenação escolhida, mostrar pela ordem definida em cada menu
const DEFAULT_SORT = { sort: 'ordem', dir: 'asc' };

const inputClass = "w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#44B16F]/20 focus:border-[#44B16F] transition-all";
const thClass = "px-6 py-4";
const selectClass = "px-3 py-2.5 rounded-lg text-sm bg-white border border-gray-200 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#44B16F]";

function FieldError({ message }) {
    if (!message) return null;
    return <p className="mt-1 text-xs text-red-600">{message}</p>;
}

export default function ConfiguracoesPage() {
    const toast = useToast();
    const invalidate = useInvalidate();
    const [isCreating, setIsCreating] = useState(false);
    const [formData, setFormData] = useState(EMPTY_FORM);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});

    const { data: menus = [], isLoading, isFetching, isError, error, refetch, dataUpdatedAt } = useMenus();
    const { filters, setFilter, setFilters, resetFilters, activeCount } = useUrlFilters(FILTER_DEFAULTS);

    const filteredMenus = useMemo(() => menus.filter((m) => {
        if (!matchesSearch(filters.q, m.name, m.slug, m.description)) return false;
        if (filters.estado === 'activo' && !isMenuActive(m)) return false;
        if (filters.estado === 'inactivo' && isMenuActive(m)) return false;
        return true;
    }), [menus, filters.q, filters.estado]);

    const sortedMenus = useSortedItems(filteredMenus, filters.sort ? filters : DEFAULT_SORT, SORT_ACCESSORS);

    const chips = [
        filters.q && { key: 'q', label: `"${filters.q}"`, onRemove: () => setFilter('q', '') },
        filters.estado && { key: 'estado', label: `Estado: ${ESTADO_LABELS[filters.estado] || filters.estado}`, onRemove: () => setFilter('estado', '') },
    ];
    const clearFilters = () => resetFilters(['sort', 'dir']);
    const onSort = (sort, dir) => setFilters({ sort, dir });
    const hasData = menus.length > 0;

    const toggleCreating = (value) => {
        setIsCreating(value);
        setFieldErrors({});
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : (type === 'number' ? Number(value) : value)
        }));
        if (fieldErrors[name]) setFieldErrors(prev => ({ ...prev, [name]: undefined }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (submitLoading) return;
        setSubmitLoading(true);
        setFieldErrors({});
        try {
            await menusAPI.create({
                ...formData,
                name: formData.name.trim(),
                slug: formData.slug.trim(),
                // Menus de topo não têm pai: enviar null em vez de 0 (chave estrangeira)
                parent_id: Number(formData.parent_id) > 0 ? Number(formData.parent_id) : null,
            });
            toast.success('Menu criado com sucesso!');
            setIsCreating(false);
            setFormData(EMPTY_FORM);
            invalidate(queryKeys.menus.all);
        } catch (err) {
            setFieldErrors(getFieldErrors(err));
            toast.error(getErrorMessage(err, 'Erro ao criar o menu. Verifique os dados e tente novamente.'));
        } finally {
            setSubmitLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            <div className="flex justify-between items-center bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center text-[#44B16F]">
                        <Settings size={20} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Configurações e Menus</h1>
                        <p className="text-sm text-gray-500">Faça a gestão dos menus e configurações do sistema</p>
                    </div>
                </div>
                <button
                    onClick={() => toggleCreating(!isCreating)}
                    disabled={submitLoading}
                    className="flex items-center gap-2 bg-[#44B16F] hover:bg-[#3A9E61] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-70"
                >
                    {isCreating ? <List size={18} /> : <Plus size={18} />}
                    {isCreating ? 'Listar Menus' : 'Criar Novo Menu'}
                </button>
            </div>

            {isCreating ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                        <Plus size={18} className="text-[#44B16F]" />
                        Adicionar Novo Menu
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Menu *</label>
                                <input
                                    type="text"
                                    name="name"
                                    required
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className={inputClass}
                                    placeholder="Ex: Relatórios"
                                />
                                <FieldError message={fieldErrors.name} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Slug (Identificador) *</label>
                                <input
                                    type="text"
                                    name="slug"
                                    required
                                    value={formData.slug}
                                    onChange={handleInputChange}
                                    className={inputClass}
                                    placeholder="Ex: reports"
                                />
                                <FieldError message={fieldErrors.slug} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">ID do Menu Pai (0 = menu de topo)</label>
                                <input
                                    type="number"
                                    name="parent_id"
                                    min={0}
                                    value={formData.parent_id}
                                    onChange={handleInputChange}
                                    className={inputClass}
                                />
                                <FieldError message={fieldErrors.parent_id} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Ordem (Order)</label>
                                <input
                                    type="number"
                                    name="order"
                                    value={formData.order}
                                    onChange={handleInputChange}
                                    className={inputClass}
                                />
                                <FieldError message={fieldErrors.order} />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Ícone</label>
                                <input
                                    type="text"
                                    name="icon"
                                    value={formData.icon}
                                    onChange={handleInputChange}
                                    className={inputClass}
                                    placeholder="Nome do ícone (Ex: BarChart3, Settings)"
                                />
                                <FieldError message={fieldErrors.icon} />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    rows={3}
                                    className={inputClass}
                                    placeholder="Descrição opcional..."
                                />
                                <FieldError message={fieldErrors.description} />
                            </div>
                            <div className="md:col-span-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="is_active"
                                        checked={formData.is_active}
                                        onChange={handleInputChange}
                                        className="w-4 h-4 text-[#44B16F] bg-gray-100 border-gray-300 rounded focus:ring-[#44B16F]"
                                    />
                                    <span className="text-sm font-medium text-gray-700">Menu activo</span>
                                </label>
                            </div>
                        </div>
                        <div className="flex justify-end pt-4 border-t border-gray-100">
                            <button
                                type="button"
                                onClick={() => toggleCreating(false)}
                                disabled={submitLoading}
                                className="mr-3 px-5 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors disabled:opacity-60"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={submitLoading}
                                className="flex items-center gap-2 bg-[#44B16F] hover:bg-[#3A9E61] text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {submitLoading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                {submitLoading ? 'A guardar...' : 'Guardar Menu'}
                            </button>
                        </div>
                    </form>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-5 border-b border-gray-100 space-y-3">
                        <div className="flex flex-wrap items-center gap-3">
                            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mr-2">
                                <List size={18} className="text-gray-500" />
                                Menus do Sistema
                            </h2>
                            <SearchInput
                                value={filters.q}
                                onChange={(q) => setFilter('q', q)}
                                placeholder="Pesquisar por nome ou slug"
                                className="w-full sm:w-72"
                            />
                            <select value={filters.estado} onChange={(e) => setFilter('estado', e.target.value)} className={selectClass} aria-label="Filtrar por estado">
                                <option value="">Todos os estados</option>
                                <option value="activo">Activo</option>
                                <option value="inactivo">Inactivo</option>
                            </select>
                            <RefreshButton onClick={refetch} isFetching={isFetching} updatedAt={dataUpdatedAt} className="ml-auto" />
                        </div>
                        <FilterChips chips={chips} onClearAll={clearFilters} resultCount={activeCount > 0 ? filteredMenus.length : undefined} />
                        {isError && hasData && (
                            <StaleDataBanner onRetry={refetch} isRetrying={isFetching} />
                        )}
                    </div>
                    {isLoading ? (
                        <div className="p-12 flex flex-col items-center justify-center text-gray-400">
                            <Loader2 size={32} className="animate-spin mb-3 text-[#44B16F]" />
                            <p>A carregar menus...</p>
                        </div>
                    ) : isError && !hasData ? (
                        <ErrorState message={getErrorMessage(error, 'Erro ao carregar menus do sistema.')} onRetry={refetch} isRetrying={isFetching} />
                    ) : !hasData ? (
                        <EmptyState icon={List} title="Nenhum menu encontrado no sistema." />
                    ) : sortedMenus.length === 0 ? (
                        <EmptyState filtered onClearFilters={clearFilters} />
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-gray-600">
                                <thead className="bg-gray-50 border-b border-gray-100 text-gray-700 text-xs uppercase font-semibold">
                                    <tr>
                                        <SortableHeader label="Nome" sortKey="nome" sort={filters.sort} dir={filters.dir} onSort={onSort} className={thClass} />
                                        <SortableHeader label="Slug" sortKey="slug" sort={filters.sort} dir={filters.dir} onSort={onSort} className={thClass} />
                                        <SortableHeader label="Ordem" sortKey="ordem" sort={filters.sort} dir={filters.dir} onSort={onSort} className={thClass} />
                                        <SortableHeader label="Estado" sortKey="estado" sort={filters.sort} dir={filters.dir} onSort={onSort} className={`${thClass} text-center`} />
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {sortedMenus.map((menu, index) => (
                                        <tr key={menu.id ?? index} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-gray-900">{menu.name}</td>
                                            <td className="px-6 py-4"><span className="px-2 py-1 bg-gray-100 rounded text-xs font-mono text-gray-600">{menu.slug}</span></td>
                                            <td className="px-6 py-4">{menu.order}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isMenuActive(menu) ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                    {isMenuActive(menu) ? 'Activo' : 'Inactivo'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
