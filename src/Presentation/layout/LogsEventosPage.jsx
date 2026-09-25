import { useEffect, useMemo, useState } from "react";
import { SlidersHorizontal, Calendar, AlertCircle, Loader2, ScrollText } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import ModalDetalhesLog from "../Components/ModalDetalhesLog";
import ErrorBoundary from "../Components/ErrorBoundary";
import SearchInput from "../Components/ui/SearchInput";
import RefreshButton from "../Components/ui/RefreshButton";
import FilterChips from "../Components/ui/FilterChips";
import Pagination from "../Components/ui/Pagination";
import SortableHeader from "../Components/ui/SortableHeader";
import { EmptyState, ErrorState, StaleDataBanner } from "../Components/ui/StateViews";
import { useAuditLogs } from "../../hooks/queries";
import { useUrlFilters } from "../../hooks/useUrlFilters";
import { useSortedItems } from "../../hooks/useTableData";
import { getErrorMessage } from "../../utils/apiHelpers";

// Filtros, ordenação e página guardados no URL (sobrevivem a F5 e podem ser partilhados)
const FILTER_DEFAULTS = { q: "", utilizador: "", evento: "", de: "", ate: "", sort: "", dir: "", page: 1, pageSize: 10 };

const EVENT_OPTIONS = [
    { value: "Login", label: "Início de Sessão" },
    { value: "Logout", label: "Fim de Sessão" },
    { value: "Cadastro de Supplier", label: "Registo de Fornecedor" },
    { value: "Atualização de Supplier", label: "Actualização de Fornecedor" },
    { value: "Exclusão de Supplier", label: "Eliminação de Fornecedor" },
    { value: "Cadastro de User", label: "Registo de Utilizador" },
    { value: "Atualização de User", label: "Actualização de Utilizador" },
    { value: "Exclusão de User", label: "Eliminação de Utilizador" },
];
const EVENT_LABELS = Object.fromEntries(EVENT_OPTIONS.map((o) => [o.value, o.label]));

const getLogUserName = (log) => String(log.user?.name || log.user?.nome || log.user?.username || "Desconhecido");

// Ordenação dos registos da página actual (a API devolve os mais recentes primeiro)
const SORT_ACCESSORS = {
    utilizador: getLogUserName,
    data: (log) => new Date(log.created_at).getTime() || 0,
    evento: (log) => log.event,
};

const formatISODate = (iso) => {
    const [y, m, d] = String(iso).split("-");
    return y && m && d ? `${d}/${m}/${y}` : String(iso);
};

const thClass = "px-4 py-4 text-left text-[10px] font-black uppercase tracking-wider";
const thStyle = { color: 'var(--color-text-muted)' };
const fieldClass = "w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none text-sm transition-all focus:ring-2 focus:ring-[#44B16F]/20";
const fieldStyle = { background: 'var(--color-bg)', color: 'var(--color-text-primary)' };

export default function LogsEventosPage() {
    const { isAdmin } = useAuth();
    const { filters, setFilter, setFilters, resetFilters, countActive } = useUrlFilters(FILTER_DEFAULTS);
    // Painel de filtros avançados aberto por omissão se já houver algum activo (ex.: link partilhado)
    const [isFiltersVisible, setIsFiltersVisible] = useState(() => countActive(["q"]) > 0);
    const [selectedLog, setSelectedLog] = useState(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

    const isRangeInvalid = !!(filters.de && filters.ate && filters.de > filters.ate);

    const params = useMemo(() => {
        const result = { page: filters.page, per_page: filters.pageSize };
        const search = filters.q.trim();
        const user = filters.utilizador.trim();
        if (search) result.search = search;
        if (user) result.user = user;
        if (filters.evento) result.event = filters.evento;
        if (filters.de) result.start_date = filters.de;
        if (filters.ate) result.end_date = filters.ate;
        return result;
    }, [filters.page, filters.pageSize, filters.q, filters.utilizador, filters.evento, filters.de, filters.ate]);

    const {
        data,
        isLoading,
        isFetching,
        isError,
        error,
        refetch,
        dataUpdatedAt,
        isPlaceholderData,
    } = useAuditLogs(params, { enabled: isAdmin && !isRangeInvalid });

    const logs = useMemo(() => data?.items ?? [], [data]);
    const serverPagination = data?.pagination;
    const totalEvents = serverPagination?.total ?? logs.length;
    const totalPages = serverPagination?.lastPage ?? (logs.length > 0 ? 1 : 0);
    const currentPage = serverPagination?.currentPage ?? filters.page;
    const perPage = serverPagination?.perPage || filters.pageSize;
    const rangeStart = totalEvents === 0 ? 0 : (currentPage - 1) * perPage + 1;
    const rangeEnd = Math.min(rangeStart + logs.length - 1, totalEvents);

    // Página fora do intervalo (ex.: link antigo ou menos registos): ir para a última página
    useEffect(() => {
        if (!isPlaceholderData && serverPagination && serverPagination.lastPage >= 1 && filters.page > serverPagination.lastPage) {
            setFilter("page", serverPagination.lastPage);
        }
    }, [isPlaceholderData, serverPagination, filters.page, setFilter]);

    const sortedLogs = useSortedItems(logs, filters, SORT_ACCESSORS);

    const activeCount = countActive();
    const chips = [
        filters.q && { key: "q", label: `"${filters.q}"`, onRemove: () => setFilter("q", "") },
        filters.utilizador && { key: "utilizador", label: `Utilizador: ${filters.utilizador}`, onRemove: () => setFilter("utilizador", "") },
        filters.evento && { key: "evento", label: `Evento: ${EVENT_LABELS[filters.evento] || filters.evento}`, onRemove: () => setFilter("evento", "") },
        filters.de && { key: "de", label: `Desde ${formatISODate(filters.de)}`, onRemove: () => setFilter("de", "") },
        filters.ate && { key: "ate", label: `Até ${formatISODate(filters.ate)}`, onRemove: () => setFilter("ate", "") },
    ];
    const handleClearFilters = () => resetFilters(["pageSize", "sort", "dir"]);
    const onSort = (sort, dir) => setFilters({ sort, dir, page: filters.page });

    const hasData = logs.length > 0;

    const getEventBadge = (event) => {
        if (!event) return { label: '-', classes: 'bg-gray-100 text-gray-600 border-gray-200' };
        const lower = String(event).toLowerCase();
        if (lower.includes('login')) return { label: 'Login', classes: 'bg-purple-100 text-purple-700 border-purple-200' };
        if (lower.includes('logout')) return { label: 'Logout', classes: 'bg-gray-100 text-gray-600 border-gray-200' };
        if (lower.includes('cadastro') || lower.includes('criação') || lower.includes('created')) return { label: 'Criação', classes: 'bg-green-100 text-green-700 border-green-200' };
        if (lower.includes('atualiz') || lower.includes('updated')) return { label: 'Actualização', classes: 'bg-blue-100 text-blue-700 border-blue-200' };
        if (lower.includes('exclus') || lower.includes('deleted') || lower.includes('remov')) return { label: 'Exclusão', classes: 'bg-red-100 text-red-700 border-red-200' };
        if (lower.includes('upload') || lower.includes('document')) return { label: 'Documento', classes: 'bg-orange-100 text-orange-700 border-orange-200' };
        if (lower.includes('aprovad') || lower.includes('approv')) return { label: 'Aprovação', classes: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
        if (lower.includes('rejeit') || lower.includes('reject')) return { label: 'Rejeição', classes: 'bg-rose-100 text-rose-700 border-rose-200' };
        return { label: event, classes: 'bg-gray-100 text-gray-600 border-gray-200' };
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return String(dateString);
        return date.toLocaleString('pt-AO', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    if (!isAdmin) {
        return (
            <div className="flex flex-col items-center justify-center h-[70vh] animate-fadeIn">
                <AlertCircle size={64} className="text-red-500 mb-4 opacity-80" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h2>
                <p className="text-gray-500 text-center max-w-md">
                    Apenas administradores têm permissão para aceder aos registos de auditoria e eventos do sistema.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fadeIn">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Logs de Eventos</h1>
                    <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                        Histórico de acções (Total: {isLoading ? "…" : totalEvents})
                    </p>
                </div>
                <RefreshButton
                    onClick={() => { if (!isRangeInvalid) refetch(); }}
                    isFetching={isFetching}
                    updatedAt={isRangeInvalid ? undefined : dataUpdatedAt}
                />
            </div>

            {/* Falha numa actualização em segundo plano: manter os dados antigos visíveis */}
            {isError && hasData && !isRangeInvalid && (
                <StaleDataBanner onRetry={refetch} isRetrying={isFetching} />
            )}

            {/* Content Area */}
            <div className="rounded-2xl shadow-sm overflow-hidden mt-6" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border-light)' }}>
                <div className="flex flex-col p-6 gap-4 border-b" style={{ borderColor: 'var(--color-border-light)' }}>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4 flex-1">
                            <SearchInput
                                value={filters.q}
                                onChange={(q) => setFilter("q", q)}
                                placeholder="Pesquisar utilizador, evento ou detalhes..."
                                delay={400}
                                className="flex-1 max-w-md"
                            />
                            <button
                                onClick={() => setIsFiltersVisible(!isFiltersVisible)}
                                title={isFiltersVisible ? "Esconder filtros" : "Mostrar filtros"}
                                aria-expanded={isFiltersVisible}
                                aria-label={isFiltersVisible ? "Esconder filtros" : "Mostrar filtros"}
                                className={`p-3 rounded-xl transition-all ${isFiltersVisible ? 'bg-[#44B16F]/10 text-[#44B16F]' : ''}`} 
                                style={{ background: isFiltersVisible ? '' : 'var(--color-bg)', color: isFiltersVisible ? '#44B16F' : 'var(--color-text-secondary)' }}
                            >
                                <SlidersHorizontal size={20} />
                            </button>
                        </div>
                    </div>

                    <FilterChips
                        chips={chips}
                        onClearAll={handleClearFilters}
                        resultCount={activeCount > 0 && !isLoading && !isError ? totalEvents : undefined}
                    />

                    {isFiltersVisible && (
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 pt-4 mt-2 border-t" style={{ borderColor: 'var(--color-border-light)' }}>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Utilizador</label>
                                <SearchInput
                                    value={filters.utilizador}
                                    onChange={(value) => setFilter("utilizador", value)}
                                    placeholder="Nome do utilizador"
                                    delay={400}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Tipo de Evento</label>
                                <select
                                    value={filters.evento}
                                    onChange={(e) => setFilter("evento", e.target.value)}
                                    className={fieldClass}
                                    style={fieldStyle}
                                    aria-label="Tipo de evento"
                                >
                                    <option value="">Todos</option>
                                    {EVENT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Data Inicial</label>
                                <input
                                    type="date"
                                    value={filters.de}
                                    max={filters.ate || undefined}
                                    onChange={(e) => setFilter("de", e.target.value)}
                                    className={fieldClass}
                                    style={fieldStyle}
                                    aria-label="Data inicial"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Data Final</label>
                                <input
                                    type="date"
                                    value={filters.ate}
                                    min={filters.de || undefined}
                                    onChange={(e) => setFilter("ate", e.target.value)}
                                    className={fieldClass}
                                    style={fieldStyle}
                                    aria-label="Data final"
                                />
                            </div>
                            <div className="flex items-end">
                                <button
                                    onClick={handleClearFilters}
                                    disabled={activeCount === 0}
                                    className="disabled:opacity-50 disabled:cursor-not-allowed w-full px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition-all"
                                >
                                    Limpar Filtros
                                </button>
                            </div>
                        </div>
                    )}

                    {isRangeInvalid && (
                        <p role="alert" className="text-sm text-red-600 flex items-center gap-2">
                            <AlertCircle size={16} />
                            A data inicial não pode ser posterior à data final.
                        </p>
                    )}
                </div>

                {isError && !hasData && !isRangeInvalid ? (
                    <ErrorState
                        message={getErrorMessage(error, "Não foi possível carregar os registos de eventos.")}
                        onRetry={refetch}
                        isRetrying={isFetching}
                    />
                ) : (
                <>
                <div className={`overflow-x-auto transition-opacity ${isPlaceholderData ? 'opacity-60' : ''}`} aria-busy={isFetching || undefined}>
                    <table className="w-full">
                        <thead style={{ background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border-light)' }}>
                            <tr>
                                <SortableHeader label="Utilizador" sortKey="utilizador" sort={filters.sort} dir={filters.dir} onSort={onSort} className={thClass} style={thStyle} />
                                <SortableHeader label="Data/Hora" sortKey="data" sort={filters.sort} dir={filters.dir} onSort={onSort} className={thClass} style={thStyle} />
                                <SortableHeader label="Evento" sortKey="evento" sort={filters.sort} dir={filters.dir} onSort={onSort} className={thClass} style={thStyle} />
                                <th className="px-4 py-4 text-left text-[10px] font-black uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Descrição</th>
                                <th className="px-4 py-4 text-right text-[10px] font-black uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {isRangeInvalid ? (
                                <tr>
                                    <td colSpan="5">
                                        <EmptyState icon={Calendar} title="Intervalo de datas inválido" description="Corrija as datas para ver os registos." />
                                    </td>
                                </tr>
                            ) : isLoading ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <Loader2 size={32} className="text-[#44B16F] animate-spin mb-2" />
                                            <span className="text-sm font-bold text-gray-500 uppercase tracking-widest">A carregar eventos...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : sortedLogs.length === 0 ? (
                                <tr>
                                    <td colSpan="5">
                                        {activeCount > 0 ? (
                                            <EmptyState filtered onClearFilters={handleClearFilters} />
                                        ) : (
                                            <EmptyState icon={ScrollText} title="Nenhum log encontrado" description="Ainda não existem eventos registados." />
                                        )}
                                    </td>
                                </tr>
                            ) : (
                                sortedLogs.map((log, index) => {
                                    const badge = getEventBadge(log.event);
                                    const userName = getLogUserName(log);
                                    return (
                                        <tr key={log.id ?? index} className="transition-colors group" onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'} style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-7 h-7 rounded-full bg-emerald-100 text-[#44B16F] flex items-center justify-center font-bold text-[10px] uppercase">
                                                        {userName.charAt(0)}
                                                    </div>
                                                    <span className="text-xs font-bold" style={{ color: 'var(--color-text-primary)' }}>{userName}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-xs font-medium whitespace-nowrap" style={{ color: 'var(--color-text-secondary)' }}>
                                                <div className="flex items-center gap-2">
                                                    <Calendar size={13} className="text-gray-400" />
                                                    {formatDate(log.created_at)}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border whitespace-nowrap ${badge.classes}`}>
                                                    {badge.label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-xs max-w-[360px] truncate" style={{ color: 'var(--color-text-secondary)' }} title={typeof log.description === 'string' ? log.description : undefined}>
                                                {log.description}
                                            </td>
                                            <td className="px-4 py-3 text-right whitespace-nowrap">
                                                <button
                                                    onClick={() => { setSelectedLog(log); setIsDetailsModalOpen(true); }}
                                                    className="text-[#44B16F] font-bold text-[11px] uppercase hover:underline"
                                                >
                                                    Ver Detalhes
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {!isLoading && !isRangeInvalid && (
                    <Pagination
                        page={currentPage}
                        totalPages={Math.max(totalPages, 1)}
                        onPageChange={(page) => setFilter("page", page)}
                        total={totalEvents}
                        start={rangeStart}
                        end={rangeEnd}
                        pageSize={filters.pageSize}
                        onPageSizeChange={(pageSize) => setFilter("pageSize", pageSize)}
                        pageSizeOptions={[10, 25, 50, 100]}
                        isFetching={isFetching}
                    />
                )}
                </>
                )}
            </div>

            <ErrorBoundary>
                <ModalDetalhesLog
                    isOpen={isDetailsModalOpen}
                    onClose={() => setIsDetailsModalOpen(false)}
                    log={selectedLog}
                />
            </ErrorBoundary>
        </div>
    );
}
