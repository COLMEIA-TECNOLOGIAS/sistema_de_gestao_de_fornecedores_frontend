import { useState, useMemo } from "react";
import { Search, SlidersHorizontal, Activity, Calendar } from "lucide-react";
import DashboardTableSkeleton from "../Components/DashboardTableSkeleton";

export default function LogsEventosPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [filterPeriod, setFilterPeriod] = useState("");
    const [isFiltersVisible, setIsFiltersVisible] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });

    // Mock data for now, since there's no API defined in the requirements
    const [logs] = useState([
        { id: 1, user: "João Silva", date: "2026-06-07T10:30:00", event: "Login", details: "Acesso ao sistema via Web" },
        { id: 2, user: "Maria Santos", date: "2026-06-07T11:15:22", event: "Criação de Fornecedor", details: "Fornecedor 'Tech Lda' criado" },
        { id: 3, user: "Carlos Mendes", date: "2026-06-06T14:20:10", event: "Aprovação de Cotação", details: "Cotação #102 aprovada" },
        { id: 4, user: "Ana Paula", date: "2026-06-05T09:45:00", event: "Edição de Perfil", details: "Alteração de senha" },
        { id: 5, user: "João Silva", date: "2026-06-05T16:22:15", event: "Envio de Convite", details: "Convite enviado para 'Global Lda'" },
        { id: 6, user: "Admin", date: "2026-06-04T08:00:00", event: "Backup", details: "Backup automático concluído" },
        { id: 7, user: "Maria Santos", date: "2026-06-03T10:10:00", event: "Exclusão de Documento", details: "Documento NIF expirado removido" },
        { id: 8, user: "Carlos Mendes", date: "2026-06-03T11:20:00", event: "Pedido de Cotação", details: "Novo pedido de cotação de cadeiras" },
        { id: 9, user: "Ana Paula", date: "2026-06-02T15:30:00", event: "Aprovação de Fornecedor", details: "Fornecedor 'Tech Lda' aprovado" },
        { id: 10, user: "João Silva", date: "2026-06-02T16:00:00", event: "Logout", details: "Sessão encerrada" },
        { id: 11, user: "Admin", date: "2026-06-01T08:00:00", event: "Atualização de Sistema", details: "Versão 2.1 instalada" },
    ]);

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('pt-AO');
    };

    const filteredAndSortedLogs = useMemo(() => {
        let result = logs.filter(log => {
            const matchSearch = log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
                log.event.toLowerCase().includes(searchTerm.toLowerCase()) ||
                log.details.toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchPeriod = filterPeriod === "" || log.date.startsWith(filterPeriod);
            
            return matchSearch && matchPeriod;
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
    }, [logs, searchTerm, filterPeriod, sortConfig]);

    const paginatedLogs = filteredAndSortedLogs.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const totalPages = Math.ceil(filteredAndSortedLogs.length / itemsPerPage);

    return (
        <div className="space-y-8 animate-fadeIn">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Logs de Eventos</h1>
                    <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>Acompanhe todas as atividades realizadas no sistema</p>
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
                                    placeholder="Pesquisar por utilizador ou evento..."
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
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 mt-2 border-t" style={{ borderColor: 'var(--color-border-light)' }}>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Período (Data)</label>
                                <input
                                    type="date"
                                    value={filterPeriod}
                                    onChange={(e) => { setFilterPeriod(e.target.value); setCurrentPage(1); }}
                                    className="w-full px-4 py-2.5 rounded-xl border-none outline-none text-sm transition-all focus:ring-2 focus:ring-[#44B16F]/20"
                                    style={{ background: 'var(--color-bg)', color: 'var(--color-text-primary)' }}
                                />
                            </div>
                            <div className="flex items-end">
                                <button
                                    onClick={() => { setSearchTerm(""); setFilterPeriod(""); setCurrentPage(1); }}
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
                                <th onClick={() => handleSort('user')} className="cursor-pointer px-6 py-5 text-left text-[10px] font-black uppercase tracking-widest hover:text-gray-700 transition-colors" style={{ color: 'var(--color-text-muted)' }}>Utilizador {sortConfig.key === 'user' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                                <th onClick={() => handleSort('date')} className="cursor-pointer px-6 py-5 text-left text-[10px] font-black uppercase tracking-widest hover:text-gray-700 transition-colors" style={{ color: 'var(--color-text-muted)' }}>Data/Hora {sortConfig.key === 'date' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                                <th onClick={() => handleSort('event')} className="cursor-pointer px-6 py-5 text-left text-[10px] font-black uppercase tracking-widest hover:text-gray-700 transition-colors" style={{ color: 'var(--color-text-muted)' }}>Evento {sortConfig.key === 'event' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                                <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Detalhes</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y" style={{ divideColor: 'var(--color-border-light)' }}>
                            {paginatedLogs.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-12 text-center text-gray-400 font-bold uppercase tracking-widest text-[10px]">
                                        Nenhum log encontrado
                                    </td>
                                </tr>
                            ) : (
                                paginatedLogs.map((log) => (
                                    <tr key={log.id} className="transition-colors group" onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'} style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-emerald-100 text-[#44B16F] flex items-center justify-center font-bold text-xs">
                                                    {log.user.charAt(0)}
                                                </div>
                                                <span className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>{log.user}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                                            <div className="flex items-center gap-2">
                                                <Calendar size={14} className="text-gray-400" />
                                                {formatDate(log.date)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                                            <div className="flex items-center gap-2">
                                                <Activity size={14} className="text-blue-500" />
                                                {log.event}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                                            {log.details}
                                        </td>
                                    </tr>
                                ))
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
