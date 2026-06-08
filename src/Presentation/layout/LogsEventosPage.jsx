import { useState, useMemo } from "react";
import { Search, SlidersHorizontal, Activity, Calendar, Users, Clock, AlertCircle } from "lucide-react";

export default function LogsEventosPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [filterPeriodStart, setFilterPeriodStart] = useState("");
    const [filterPeriodEnd, setFilterPeriodEnd] = useState("");
    const [filterUser, setFilterUser] = useState("");
    const [filterEvent, setFilterEvent] = useState("");
    const [isFiltersVisible, setIsFiltersVisible] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });

    // Mock data based on the API Prep requirement
    const [logs] = useState([
        { id: 1, user_name: "João Silva", event: "supplier_created", details: "Fornecedor ID #102 criado", created_at: "2026-06-08T09:15:00" },
        { id: 2, user_name: "Maria Santos", event: "document_updated", details: "Certificado Comercial atualizado", created_at: "2026-06-08T10:42:00" },
        { id: 3, user_name: "Admin Sistema", event: "deleted", details: "Cotação ID #58 removida", created_at: "2026-06-08T11:30:00" },
        { id: 4, user_name: "Carlos Mendes", event: "login", details: "Sessão iniciada via Web", created_at: "2026-06-08T08:00:00" },
        { id: 5, user_name: "Ana Paula", event: "logout", details: "Sessão encerrada", created_at: "2026-06-07T18:00:00" },
        { id: 6, user_name: "João Silva", event: "document_uploaded", details: "Upload de Alvará", created_at: "2026-06-07T15:20:00" },
    ]);

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
        let result = logs.filter(log => {
            const matchSearch = log.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                log.event.toLowerCase().includes(searchTerm.toLowerCase()) ||
                log.details.toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchUser = filterUser === "" || log.user_name.toLowerCase().includes(filterUser.toLowerCase());
            const matchEvent = filterEvent === "" || log.event.toLowerCase().includes(filterEvent.toLowerCase());
            
            let matchPeriodStart = true;
            let matchPeriodEnd = true;
            const logDate = new Date(log.created_at).getTime();

            if (filterPeriodStart) {
                const start = new Date(filterPeriodStart).getTime();
                matchPeriodStart = logDate >= start;
            }
            if (filterPeriodEnd) {
                const end = new Date(filterPeriodEnd);
                end.setHours(23, 59, 59, 999);
                matchPeriodEnd = logDate <= end.getTime();
            }
            
            return matchSearch && matchUser && matchEvent && matchPeriodStart && matchPeriodEnd;
        });

        if (sortConfig.key !== null) {
            result.sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (a[sortConfig.key] > b[sortConfig.key]) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }

        return result;
    }, [logs, searchTerm, filterPeriodStart, filterPeriodEnd, filterUser, filterEvent, sortConfig]);

    const paginatedLogs = filteredAndSortedLogs.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const totalPages = Math.ceil(filteredAndSortedLogs.length / itemsPerPage);

    const handleClearFilters = () => {
        setSearchTerm("");
        setFilterPeriodStart("");
        setFilterPeriodEnd("");
        setFilterUser("");
        setFilterEvent("");
        setCurrentPage(1);
    };

    return (
        <div className="space-y-8 animate-fadeIn">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Logs de Eventos</h1>
                    <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>Histórico completo das ações realizadas pelos utilizadores do sistema.</p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-6 rounded-2xl shadow-sm" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border-light)' }}>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-blue-600 bg-blue-50">
                            <Activity size={24} />
                        </div>
                        <div>
                            <p className="text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Total de Eventos</p>
                            <h3 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>1,245</h3>
                        </div>
                    </div>
                </div>
                <div className="p-6 rounded-2xl shadow-sm" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border-light)' }}>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-emerald-600 bg-emerald-50">
                            <Calendar size={24} />
                        </div>
                        <div>
                            <p className="text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Eventos Hoje</p>
                            <h3 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>38</h3>
                        </div>
                    </div>
                </div>
                <div className="p-6 rounded-2xl shadow-sm" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border-light)' }}>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-purple-600 bg-purple-50">
                            <Users size={24} />
                        </div>
                        <div>
                            <p className="text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Utilizadores Ativos</p>
                            <h3 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>12</h3>
                        </div>
                    </div>
                </div>
                <div className="p-6 rounded-2xl shadow-sm" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border-light)' }}>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-amber-600 bg-amber-50">
                            <Clock size={24} />
                        </div>
                        <div>
                            <p className="text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Última Atividade</p>
                            <h3 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Há 5 min</h3>
                        </div>
                    </div>
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
                                <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Detalhes</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y" style={{ divideColor: 'var(--color-border-light)' }}>
                            {paginatedLogs.length === 0 ? (
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
                                    return (
                                        <tr key={log.id} className="transition-colors group" onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'} style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-[#44B16F] flex items-center justify-center font-bold text-xs">
                                                        {log.user_name.charAt(0)}
                                                    </div>
                                                    <span className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>{log.user_name}</span>
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
                                                {log.details}
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
        </div>
    );
}
