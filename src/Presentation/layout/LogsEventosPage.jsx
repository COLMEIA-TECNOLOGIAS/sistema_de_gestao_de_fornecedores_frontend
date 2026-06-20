import { useState, useMemo, useEffect, useCallback } from "react";
import { Search, SlidersHorizontal, Activity, Calendar, Users, Clock, AlertCircle, Loader2 } from "lucide-react";
import { auditLogsAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import ModalDetalhesLog from "../Components/ModalDetalhesLog";
import ErrorBoundary from "../Components/ErrorBoundary";

export default function LogsEventosPage() {
    const { isAdmin } = useAuth();
    const [searchTerm, setSearchTerm] = useState("");
    const [filterPeriodStart, setFilterPeriodStart] = useState("");
    const [filterPeriodEnd, setFilterPeriodEnd] = useState("");
    const [filterUser, setFilterUser] = useState("");
    const [filterEvent, setFilterEvent] = useState("");
    const [isFiltersVisible, setIsFiltersVisible] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });

    const [logs, setLogs] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [totalEvents, setTotalEvents] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [selectedLog, setSelectedLog] = useState(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

    const fetchLogs = useCallback(async () => {
        setIsLoading(true);
        try {
            const params = {
                page: currentPage,
                per_page: itemsPerPage,
                search: searchTerm || undefined,
                user: filterUser || undefined,
                event: filterEvent || undefined,
                start_date: filterPeriodStart || undefined,
                end_date: filterPeriodEnd || undefined,
            };
            const res = await auditLogsAPI.getAll(params);
            setLogs(res.data || []);
            setTotalEvents(res.total || 0);
            setTotalPages(res.last_page || 0);
        } catch (error) {
            console.error("Error fetching logs:", error);
        } finally {
            setIsLoading(false);
        }
    }, [currentPage, searchTerm, filterUser, filterEvent, filterPeriodStart, filterPeriodEnd]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const getEventBadge = (event) => {
        switch (event) {
            case 'supplier_created':
            case 'created':
                return { label: 'Criação', classes: 'bg-green-100 text-green-700 border-green-200' };
            case 'document_updated':
            case 'updated':
                return { label: 'Atualização', classes: 'bg-blue-100 text-blue-700 border-blue-200' };
            case 'deleted':
                return { label: 'Exclusão', classes: 'bg-red-100 text-red-700 border-red-200' };
            case 'login':
                return { label: 'Login', classes: 'bg-purple-100 text-purple-700 border-purple-200' };
            case 'logout':
                return { label: 'Logout', classes: 'bg-gray-100 text-gray-700 border-gray-200' };
            case 'document_uploaded':
                return { label: 'Upload Documento', classes: 'bg-orange-100 text-orange-700 border-orange-200' };
            default:
                return { label: event, classes: 'bg-gray-100 text-gray-700 border-gray-200' };
        }
    };

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('pt-AO', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const filteredAndSortedLogs = useMemo(() => {
        let result = [...logs];
        
        if (sortConfig.key !== null) {
            result.sort((a, b) => {
                let valA = a[sortConfig.key];
                let valB = b[sortConfig.key];

                if (sortConfig.key === 'user_name') {
                    valA = a.user?.name || '';
                    valB = b.user?.name || '';
                }

                if (valA < valB) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (valA > valB) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }
        return result;
    }, [logs, sortConfig]);

    const paginatedLogs = filteredAndSortedLogs;

    const handleClearFilters = () => {
        setSearchTerm("");
        setFilterPeriodStart("");
        setFilterPeriodEnd("");
        setFilterUser("");
        setFilterEvent("");
        setCurrentPage(1);
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
                        Histórico de ações (Total: {totalEvents})
                    </p>
                </div>
            </div>

            {/* Content Area */}
            <div className="rounded-2xl shadow-sm overflow-hidden mt-6" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border-light)' }}>
                <div className="flex flex-col p-6 gap-4 border-b" style={{ borderColor: 'var(--color-border-light)' }}>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4 flex-1">
                            <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Pesquisar utilizador, evento ou detalhes..."
                                    value={searchTerm}
                                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                    className="w-full pl-12 pr-4 py-3 border border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-[#44B16F]/20 focus:border-[#44B16F] transition-all text-sm"
                                    style={{ background: 'var(--color-bg)', color: 'var(--color-text-primary)' }}
                                />
                            </div>
                            <button 
                                onClick={() => setIsFiltersVisible(!isFiltersVisible)}
                                className={`p-3 rounded-xl transition-all ${isFiltersVisible ? 'bg-[#44B16F]/10 text-[#44B16F]' : ''}`} 
                                style={{ background: isFiltersVisible ? '' : 'var(--color-bg)', color: isFiltersVisible ? '#44B16F' : 'var(--color-text-secondary)' }}
                            >
                                <SlidersHorizontal size={20} />
                            </button>
                        </div>
                    </div>
                    
                    {isFiltersVisible && (
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 pt-4 mt-2 border-t" style={{ borderColor: 'var(--color-border-light)' }}>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Utilizador</label>
                                <input
                                    type="text"
                                    placeholder="Nome do utilizador"
                                    value={filterUser}
                                    onChange={(e) => { setFilterUser(e.target.value); setCurrentPage(1); }}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none text-sm transition-all focus:ring-2 focus:ring-[#44B16F]/20"
                                    style={{ background: 'var(--color-bg)', color: 'var(--color-text-primary)' }}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Tipo de Evento</label>
                                <select
                                    value={filterEvent}
                                    onChange={(e) => { setFilterEvent(e.target.value); setCurrentPage(1); }}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none text-sm transition-all focus:ring-2 focus:ring-[#44B16F]/20"
                                    style={{ background: 'var(--color-bg)', color: 'var(--color-text-primary)' }}
                                >
                                    <option value="">Todos</option>
                                    <option value="supplier_created">Criação de Fornecedor</option>
                                    <option value="created">Criação</option>
                                    <option value="document_updated">Atualização de Documento</option>
                                    <option value="updated">Atualização</option>
                                    <option value="deleted">Exclusão</option>
                                    <option value="login">Login</option>
                                    <option value="logout">Logout</option>
                                    <option value="document_uploaded">Upload de Documento</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Data Inicial</label>
                                <input
                                    type="date"
                                    value={filterPeriodStart}
                                    onChange={(e) => { setFilterPeriodStart(e.target.value); setCurrentPage(1); }}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none text-sm transition-all focus:ring-2 focus:ring-[#44B16F]/20"
                                    style={{ background: 'var(--color-bg)', color: 'var(--color-text-primary)' }}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Data Final</label>
                                <input
                                    type="date"
                                    value={filterPeriodEnd}
                                    onChange={(e) => { setFilterPeriodEnd(e.target.value); setCurrentPage(1); }}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none text-sm transition-all focus:ring-2 focus:ring-[#44B16F]/20"
                                    style={{ background: 'var(--color-bg)', color: 'var(--color-text-primary)' }}
                                />
                            </div>
                            <div className="flex items-end">
                                <button
                                    onClick={handleClearFilters}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition-all"
                                >
                                    Limpar Filtros
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead style={{ background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border-light)' }}>
                            <tr>
                                <th onClick={() => handleSort('user_name')} className="cursor-pointer px-6 py-5 text-left text-[10px] font-black uppercase tracking-widest hover:text-gray-700 transition-colors" style={{ color: 'var(--color-text-muted)' }}>Utilizador {sortConfig.key === 'user_name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                                <th onClick={() => handleSort('created_at')} className="cursor-pointer px-6 py-5 text-left text-[10px] font-black uppercase tracking-widest hover:text-gray-700 transition-colors" style={{ color: 'var(--color-text-muted)' }}>Data/Hora {sortConfig.key === 'created_at' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                                <th onClick={() => handleSort('event')} className="cursor-pointer px-6 py-5 text-left text-[10px] font-black uppercase tracking-widest hover:text-gray-700 transition-colors" style={{ color: 'var(--color-text-muted)' }}>Evento {sortConfig.key === 'event' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                                <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Descrição</th>
                                <th className="px-6 py-5 text-right text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y" style={{ divideColor: 'var(--color-border-light)' }}>
                            {isLoading ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <Loader2 size={32} className="text-[#44B16F] animate-spin mb-2" />
                                            <span className="text-sm font-bold text-gray-500 uppercase tracking-widest">A carregar eventos...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : paginatedLogs.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-12 text-center text-gray-400 font-bold uppercase tracking-widest text-[10px]">
                                        <div className="flex flex-col items-center gap-2">
                                            <AlertCircle size={32} className="text-gray-300 mb-2" />
                                            Nenhum log encontrado
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                paginatedLogs.map((log) => {
                                    const badge = getEventBadge(log.event);
                                    const userName = log.user?.name || "Desconhecido";
                                    return (
                                        <tr key={log.id} className="transition-colors group" onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'} style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-[#44B16F] flex items-center justify-center font-bold text-xs uppercase">
                                                        {userName.charAt(0)}
                                                    </div>
                                                    <span className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>{userName}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                                                <div className="flex items-center gap-2">
                                                    <Calendar size={14} className="text-gray-400" />
                                                    {formatDate(log.created_at)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${badge.classes}`}>
                                                    {badge.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                                                {log.description}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => { setSelectedLog(log); setIsDetailsModalOpen(true); }}
                                                    className="text-[#44B16F] font-bold text-xs uppercase hover:underline"
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
                {totalPages > 0 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t" style={{ borderColor: 'var(--color-border-light)', background: 'var(--color-bg)' }}>
                        <span className="text-sm text-gray-500">
                            Página {currentPage} de {totalPages}
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium disabled:opacity-50 transition-colors hover:bg-gray-50 text-gray-600"
                            >
                                Anterior
                            </button>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium disabled:opacity-50 transition-colors hover:bg-gray-50 text-gray-600"
                            >
                                Próximo
                            </button>
                        </div>
                    </div>
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
