import { useAuth } from "../../context/AuthContext";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    dashboardAPI,
    quotationRequestsAPI,
    suppliersAPI,
    quotationResponsesAPI
} from "../../services/api";
import DashboardTableSkeleton from "../Components/DashboardTableSkeleton";
import { Package, AlertCircle, Users, FileText, ArrowUpRight, TrendingUp, ArrowRight } from "lucide-react";

export default function DashboardPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const userName = user?.nome || user?.name || "Usuário";
    const [isLoading, setIsLoading] = useState(true);
    const [dashboardData, setDashboardData] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const data = await dashboardAPI.getData();
            setDashboardData(data);
        } catch (err) {
            console.error("Erro ao carregar dados do dashboard via API principal:", err);
            await fetchDashboardDataFallback();
        } finally {
            setIsLoading(false);
        }
    };

    const fetchDashboardDataFallback = async () => {
        try {
            const [quotations, suppliers, responses] = await Promise.all([
                quotationRequestsAPI.getAll().catch(() => []),
                suppliersAPI.getAll().catch(() => []),
                quotationResponsesAPI.getAll().catch(() => [])
            ]);
            const quotationsList = Array.isArray(quotations) ? quotations : (quotations.data || []);
            const suppliersList = Array.isArray(suppliers) ? suppliers : (suppliers.data || []);
            const responsesList = Array.isArray(responses) ? responses : (responses.data || []);

            const activeQuotationsCount = quotationsList.filter(q =>
                ['sent', 'in_progress', 'open'].includes(q.status)
            ).length;
            const pendingReviewsCount = responsesList.filter(r =>
                ['pending', 'review', 'submitted'].includes(r.status)
            ).length;
            const activeSuppliersCount = suppliersList.length;
            const totalQuotationsCount = quotationsList.length;

            const sortedQuotations = [...quotationsList].sort((a, b) =>
                new Date(b.created_at) - new Date(a.created_at)
            ).slice(0, 5);

            setDashboardData({
                counts: {
                    active_quotations: activeQuotationsCount,
                    pending_reviews: pendingReviewsCount,
                    active_suppliers: activeSuppliersCount,
                    total_quotations: totalQuotationsCount
                },
                recent_quotations: sortedQuotations
            });
        } catch (fallbackErr) {
            setDashboardData({
                counts: { active_quotations: 0, pending_reviews: 0, active_suppliers: 0, total_quotations: 0 },
                recent_quotations: []
            });
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const STATUS_CONFIG = {
        draft:       { label: 'Rascunho',    cls: 'badge badge-neutral' },
        sent:        { label: 'Enviada',      cls: 'badge badge-info' },
        in_progress: { label: 'Em Progresso', cls: 'badge badge-warning' },
        completed:   { label: 'Completa',     cls: 'badge badge-success' },
        cancelled:   { label: 'Cancelada',    cls: 'badge badge-error' },
    };

    const getStatusBadge = (status) => {
        const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
        return <span className={cfg.cls}>{cfg.label}</span>;
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                        Dashboard
                    </h1>
                    <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                        Aqui está o resumo das suas atividades de negócio.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => navigate('/relatorios')}
                        className="btn-secondary text-sm"
                        style={{ padding: '8px 16px' }}
                    >
                        Exportar
                    </button>
                    <button
                        onClick={fetchDashboardData}
                        className="btn-primary text-sm"
                        style={{ padding: '8px 16px' }}
                    >
                        Actualizar
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="card p-6">
                            <div className="skeleton h-4 w-3/4 mb-4 rounded" />
                            <div className="skeleton h-8 w-1/2 rounded" />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

                    {/* Card 1 — HIGHLIGHTED (gradient verde, como azul na referência) */}
                    <button
                        onClick={() => navigate('/cotacoes')}
                        className="rounded-xl p-6 text-left w-full relative overflow-hidden group transition-all duration-200"
                        style={{
                            background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)',
                            boxShadow: '0 8px 24px rgba(68,177,111,0.35)',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(68,177,111,0.45)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(68,177,111,0.35)'; }}
                    >
                        {/* Decorative circle */}
                        <div style={{
                            position: 'absolute', top: '-20px', right: '-20px',
                            width: '80px', height: '80px', borderRadius: '50%',
                            background: 'rgba(255,255,255,0.12)'
                        }} />
                        <div style={{
                            position: 'absolute', bottom: '-30px', right: '20px',
                            width: '60px', height: '60px', borderRadius: '50%',
                            background: 'rgba(255,255,255,0.08)'
                        }} />

                        <div className="flex items-start justify-between relative z-10">
                            <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center"
                                style={{ background: 'rgba(255,255,255,0.2)' }}
                            >
                                <FileText size={20} color="white" />
                            </div>
                            <ArrowUpRight size={18} color="rgba(255,255,255,0.7)" />
                        </div>
                        <div className="mt-4 relative z-10">
                            <p className="text-3xl font-bold text-white">
                                {dashboardData?.counts?.total_quotations ?? 0}
                            </p>
                            <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.8)' }}>
                                Total de Cotações
                            </p>
                        </div>
                    </button>

                    {/* Card 2 */}
                    <button
                        onClick={() => navigate('/fornecedores?tab=cotacoes')}
                        className="card p-6 text-left w-full group transition-all duration-200"
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
                    >
                        <div className="flex items-start justify-between">
                            <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center"
                                style={{ background: '#EFF8FF' }}
                            >
                                <Package size={20} style={{ color: '#0A90CD' }} />
                            </div>
                            <ArrowUpRight size={16} className="opacity-0 group-hover:opacity-60 transition-opacity" style={{ color: 'var(--color-text-muted)' }} />
                        </div>
                        <div className="mt-4">
                            <p className="text-3xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                                {dashboardData?.counts?.active_quotations ?? 0}
                            </p>
                            <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                                Cotações Ativas
                            </p>
                        </div>
                    </button>

                    {/* Card 3 */}
                    <button
                        onClick={() => navigate('/fornecedores')}
                        className="card p-6 text-left w-full group transition-all duration-200"
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
                    >
                        <div className="flex items-start justify-between">
                            <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center"
                                style={{ background: '#F0FFF4' }}
                            >
                                <Users size={20} style={{ color: 'var(--color-primary)' }} />
                            </div>
                            <ArrowUpRight size={16} className="opacity-0 group-hover:opacity-60 transition-opacity" style={{ color: 'var(--color-text-muted)' }} />
                        </div>
                        <div className="mt-4">
                            <p className="text-3xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                                {dashboardData?.counts?.active_suppliers ?? 0}
                            </p>
                            <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                                Fornecedores Ativos
                            </p>
                        </div>
                    </button>

                    {/* Card 4 */}
                    <button
                        onClick={() => navigate('/fornecedores?tab=cotacoes&subtab=respostas')}
                        className="card p-6 text-left w-full group transition-all duration-200"
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
                    >
                        <div className="flex items-start justify-between">
                            <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center"
                                style={{ background: '#FEF9C3' }}
                            >
                                <AlertCircle size={20} style={{ color: '#F59E0B' }} />
                            </div>
                            <ArrowUpRight size={16} className="opacity-0 group-hover:opacity-60 transition-opacity" style={{ color: 'var(--color-text-muted)' }} />
                        </div>
                        <div className="mt-4">
                            <p className="text-3xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                                {dashboardData?.counts?.pending_reviews ?? 0}
                            </p>
                            <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                                Revisões Pendentes
                            </p>
                        </div>
                    </button>
                </div>
            )}

            {/* Recent Quotations Table */}
            <div className="card overflow-hidden">
                <div
                    className="flex items-center justify-between px-6 py-4 border-b"
                    style={{ borderColor: 'var(--color-border-light)' }}
                >
                    <div className="flex items-center gap-2">
                        <TrendingUp size={18} style={{ color: 'var(--color-primary)' }} />
                        <h2 className="font-semibold text-base" style={{ color: 'var(--color-text-primary)' }}>
                            Cotações Recentes
                        </h2>
                    </div>
                    <button
                        onClick={() => navigate('/cotacoes')}
                        className="text-sm font-medium flex items-center gap-1 transition-colors"
                        style={{ color: 'var(--color-primary)' }}
                        onMouseEnter={e => e.currentTarget.style.color = 'var(--color-primary-dark)'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--color-primary)'}
                    >
                        Ver todas <ArrowRight size={14} />
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr>
                                <th className="table-header-cell">Referência</th>
                                <th className="table-header-cell">Título</th>
                                <th className="table-header-cell hidden md:table-cell">Descrição</th>
                                <th className="table-header-cell">Prazo</th>
                                <th className="table-header-cell">Status</th>
                                <th className="table-header-cell hidden lg:table-cell">Criado em</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <DashboardTableSkeleton rows={4} />
                            ) : error ? (
                                <tr>
                                    <td colSpan="6" className="py-8 text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>
                                        Erro ao carregar cotações
                                    </td>
                                </tr>
                            ) : dashboardData?.recent_quotations?.length > 0 ? (
                                dashboardData.recent_quotations.map((q) => (
                                    <tr key={q.id} className="table-row">
                                        <td className="table-cell">
                                            <span className="font-semibold text-sm" style={{ color: 'var(--color-primary)' }}>
                                                {q.reference_number}
                                            </span>
                                        </td>
                                        <td className="table-cell font-medium" style={{ color: 'var(--color-text-primary)' }}>
                                            {q.title}
                                        </td>
                                        <td className="table-cell hidden md:table-cell" style={{ color: 'var(--color-text-secondary)', maxWidth: '200px' }}>
                                            <span className="line-clamp-1">{q.description}</span>
                                        </td>
                                        <td className="table-cell" style={{ color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
                                            {formatDate(q.deadline)}
                                        </td>
                                        <td className="table-cell">
                                            {getStatusBadge(q.status)}
                                        </td>
                                        <td className="table-cell hidden lg:table-cell" style={{ color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                                            {formatDate(q.created_at)}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6">
                                        <div className="empty-state">
                                            <div className="empty-state-icon">
                                                <FileText size={28} style={{ color: 'var(--color-text-muted)' }} />
                                            </div>
                                            <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                                                Nenhuma cotação recente
                                            </p>
                                            <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                                                As cotações criadas aparecem aqui
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
