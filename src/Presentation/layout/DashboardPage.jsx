import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import DashboardTableSkeleton from "../Components/DashboardTableSkeleton";
import RefreshButton from "../Components/ui/RefreshButton";
import { ErrorState, StaleDataBanner } from "../Components/ui/StateViews";
import { useDashboard, useQuotationRequests, useSuppliers, useQuotationResponses } from "../../hooks/queries";
import { getErrorMessage } from "../../utils/apiHelpers";
import { Package, AlertCircle, Users, FileText, ArrowUpRight, TrendingUp, ArrowRight } from "lucide-react";
const STATUS_CONFIG = {
    draft:       { label: 'Rascunho',    cls: 'badge badge-neutral' },
    pending:     { label: 'Pendente',    cls: 'badge badge-warning' },
    sent:        { label: 'Enviada',      cls: 'badge badge-info' },
    submitted:   { label: 'Submetida',    cls: 'badge badge-info' },
    pending_review: { label: 'Pendente',    cls: 'badge badge-warning' },
    in_review:   { label: 'Em Revisão',  cls: 'badge badge-warning' },
    revision_requested: { label: 'Revisão Solicitada', cls: 'badge badge-warning' },
    needs_revision: { label: 'Revisão Necessária', cls: 'badge badge-neutral' },
    approved:    { label: 'Aprovada',    cls: 'badge badge-success' },
    rejected:    { label: 'Rejeitada',   cls: 'badge badge-error' },
    published:   { label: 'Publicada',   cls: 'badge badge-info' },
    open:        { label: 'Em Curso',    cls: 'badge badge-info' },
    active:      { label: 'Activa',       cls: 'badge badge-info' },
    in_progress: { label: 'Em Progresso', cls: 'badge badge-warning' },
    completed:   { label: 'Concluída',   cls: 'badge badge-success' },
    cancelled:   { label: 'Cancelada',   cls: 'badge badge-error' },
    delivered:   { label: 'Entregue',    cls: 'badge badge-success' },
};

// Actualização automática do painel (só com o separador visível)
const AUTO_REFRESH_MS = 60 * 1000;
const FALLBACK_RESPONSES_PARAMS = {};

const ACTIVE_QUOTATION_STATUSES = ['sent', 'in_progress', 'open'];
const PENDING_REVIEW_STATUSES = ['pending', 'review', 'submitted'];

const toCount = (value) => {
    if (value === undefined || value === null || value === '') return undefined;
    const n = Number(value);
    return Number.isFinite(n) ? n : undefined;
};

const byCreatedDesc = (a, b) =>
    (new Date(b.created_at).getTime() || 0) - (new Date(a.created_at).getTime() || 0);

/**
 * Estado de um indicador: valor do endpoint /dashboard; se faltar (ou o endpoint falhar),
 * calculado a partir da lista correspondente. Cada indicador degrada de forma independente.
 */
function resolveWidget(primaryValue, primaryPending, fallbackQuery, compute) {
    if (primaryValue !== undefined) return { value: primaryValue, loading: false, failed: false };
    if (primaryPending) return { value: undefined, loading: true, failed: false };
    if (fallbackQuery.data) return { value: compute(fallbackQuery.data), loading: false, failed: false };
    if (fallbackQuery.isError) return { value: undefined, loading: false, failed: true };
    return { value: undefined, loading: true, failed: false };
}

export default function DashboardPage() {
    const navigate = useNavigate();

    const dashboardQuery = useDashboard({
        refetchInterval: AUTO_REFRESH_MS,
        refetchIntervalInBackground: false,
    });
    const dashboardData = dashboardQuery.data;
    const counts = dashboardData?.counts || {};

    const primary = {
        total_quotations: toCount(counts.total_quotations),
        active_quotations: toCount(counts.active_quotations),
        active_suppliers: toCount(counts.active_suppliers),
        pending_reviews: toCount(counts.pending_reviews),
    };
    const primaryRecent = Array.isArray(dashboardData?.recent_quotations) ? dashboardData.recent_quotations : undefined;
    const primaryPending = dashboardQuery.isPending;
    const primarySettled = !primaryPending;

    // Fontes alternativas: só são pedidas quando o /dashboard falha ou não traz o indicador
    const needQuotations = primarySettled && (
        primary.total_quotations === undefined || primary.active_quotations === undefined || primaryRecent === undefined
    );
    const needSuppliers = primarySettled && primary.active_suppliers === undefined;
    const needResponses = primarySettled && primary.pending_reviews === undefined;

    const fallbackOptions = { refetchInterval: AUTO_REFRESH_MS, refetchIntervalInBackground: false };
    const quotationsQuery = useQuotationRequests({ ...fallbackOptions, enabled: needQuotations });
    const suppliersQuery = useSuppliers({ ...fallbackOptions, enabled: needSuppliers });
    const responsesQuery = useQuotationResponses(FALLBACK_RESPONSES_PARAMS, { ...fallbackOptions, enabled: needResponses });

    const widgets = {
        total_quotations: resolveWidget(primary.total_quotations, primaryPending, quotationsQuery, (list) => list.length),
        active_quotations: resolveWidget(primary.active_quotations, primaryPending, quotationsQuery,
            (list) => list.filter((q) => ACTIVE_QUOTATION_STATUSES.includes(q.status)).length),
        active_suppliers: resolveWidget(primary.active_suppliers, primaryPending, suppliersQuery, (list) => list.length),
        pending_reviews: resolveWidget(primary.pending_reviews, primaryPending, responsesQuery,
            (list) => list.filter((r) => PENDING_REVIEW_STATUSES.includes(r.status)).length),
    };

    const recentFallback = quotationsQuery.data;
    const recentQuotations = useMemo(() => {
        if (primaryRecent) return primaryRecent;
        if (recentFallback) return [...recentFallback].sort(byCreatedDesc).slice(0, 5);
        return undefined;
    }, [primaryRecent, recentFallback]);
    const recentLoading = recentQuotations === undefined && (primaryPending || (needQuotations && !quotationsQuery.isError));
    const recentFailed = recentQuotations === undefined && !recentLoading;

    const activeQueries = [dashboardQuery, needQuotations && quotationsQuery, needSuppliers && suppliersQuery, needResponses && responsesQuery].filter(Boolean);
    const isFetching = activeQueries.some((q) => q.isFetching);
    const updatedAt = Math.max(0, ...activeQueries.map((q) => q.dataUpdatedAt || 0)) || undefined;
    const refreshAll = () => Promise.all(activeQueries.map((q) => q.refetch()));

    const anyWidgetFailed = Object.values(widgets).some((w) => w.failed) || recentFailed;
    // Falha numa actualização em segundo plano, mas há dados antigos em ecrã
    const staleFailure = activeQueries.some((q) => q.isError && q.data !== undefined);
    const renderCount = (widget, light = false) => {
        if (widget.failed) {
            return (
                <span title="Indicador indisponível" style={light ? undefined : { color: 'var(--color-text-muted)' }}>—</span>
            );
        }
        return widget.value ?? 0;
    };
    const cardsLoading = Object.values(widgets).every((w) => w.loading);

    const formatDate = (dateString) => {
        if (!dateString) return '—';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '—';
        return date.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const getStatusBadge = (status) => {
        const cfg = STATUS_CONFIG[status] || { label: 'Desconhecido', cls: 'badge badge-neutral' };
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
                    <p>Visão geral do sistema</p>
                </div>
                <div className="flex items-center gap-2">
                    <RefreshButton onClick={refreshAll} isFetching={isFetching} updatedAt={updatedAt} />
                </div>
            </div>

            {/* Falha numa actualização em segundo plano: manter os últimos dados visíveis */}
            {(staleFailure || anyWidgetFailed) && (
                <StaleDataBanner
                    message={staleFailure
                        ? "Não foi possível actualizar. A mostrar os últimos dados carregados."
                        : "Alguns indicadores não puderam ser carregados."}
                    onRetry={refreshAll}
                    isRetrying={isFetching}
                />
            )}

            {/* Stats Cards */}
            {cardsLoading ? (
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
                        onClick={() => navigate('/aquisicoes')}
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
                                {renderCount(widgets.total_quotations, true)}
                            </p>
                            <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.8)' }}>
                                Total de Cotações
                            </p>
                        </div>
                    </button>

                    {/* Card 2 */}
                    <button
                        onClick={() => navigate('/aquisicoes')}
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
                                {renderCount(widgets.active_quotations)}
                            </p>
                            <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                                Cotações Activas
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
                                {renderCount(widgets.active_suppliers)}
                            </p>
                            <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                                Fornecedores Activos
                            </p>
                        </div>
                    </button>

                    {/* Card 4 */}
                    <button
                        onClick={() => navigate('/aquisicoes')}
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
                                {renderCount(widgets.pending_reviews)}
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
                        onClick={() => navigate('/aquisicoes')}
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
                                <th className="table-header-cell">Estado</th>
                                <th className="table-header-cell hidden lg:table-cell">Criado em</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentLoading ? (
                                <DashboardTableSkeleton rows={4} columns={6} />
                            ) : recentFailed ? (
                                <tr>
                                    <td colSpan="6">
                                        <ErrorState
                                            message={getErrorMessage(quotationsQuery.error || dashboardQuery.error, "Erro ao carregar as cotações recentes.")}
                                            onRetry={refreshAll}
                                            isRetrying={isFetching}
                                        />
                                    </td>
                                </tr>
                            ) : recentQuotations.length > 0 ? (
                                recentQuotations.map((q, index) => (
                                    <tr
                                        key={q.id ?? index}
                                        className="table-row cursor-pointer hover:bg-gray-50"
                                        onClick={() => (q.id != null
                                            ? navigate(`/aquisicoes?pedido=${encodeURIComponent(q.id)}`)
                                            : navigate('/aquisicoes', { state: { openDetails: q } }))}
                                    >
                                        <td className="table-cell">
                                            {(() => {
                                                const ppRef = q.reference || q.activity_description;
                                                const systemRef = (q.reference_number && q.reference_number !== ppRef)
                                                    ? q.reference_number
                                                    : (q.id != null ? `CT-${String(q.id).padStart(3, '0')}` : '');
                                                return (
                                                    <div className="space-y-0.5">
                                                        <span className="text-xs block" style={{ color: 'var(--color-text-secondary)' }}>
                                                            Ref. PP: {ppRef || '—'}
                                                        </span>
                                                        <span className="text-xs block" style={{ color: 'var(--color-text-secondary)' }}>
                                                            Ref. Sistema: {systemRef || '—'}
                                                        </span>
                                                    </div>
                                                );
                                            })()}
                                        </td>
                                        <td className="table-cell font-medium" style={{ color: 'var(--color-text-primary)' }}>
                                            {q.title || '—'}
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
