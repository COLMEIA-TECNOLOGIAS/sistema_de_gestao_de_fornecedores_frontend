import { AlertTriangle, Inbox, RefreshCw, SearchX } from "lucide-react";

/**
 * Estado vazio. Distinguir "não há dados" de "nenhum resultado para os filtros":
 * passar `filtered` + `onClearFilters` para o segundo caso.
 */
export function EmptyState({ title, description, icon: Icon, action, filtered = false, onClearFilters }) {
    const FinalIcon = Icon || (filtered ? SearchX : Inbox);
    return (
        <div className="flex flex-col items-center justify-center text-center py-12 px-4">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mb-3" style={{ background: 'var(--color-bg)' }}>
                <FinalIcon size={26} style={{ color: 'var(--color-text-muted)' }} />
            </div>
            <p className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                {title || (filtered ? "Nenhum resultado encontrado" : "Sem registos")}
            </p>
            {(description || filtered) && (
                <p className="text-sm mt-1 max-w-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    {description || "Tente outros termos de pesquisa ou remova alguns filtros."}
                </p>
            )}
            {filtered && onClearFilters && (
                <button
                    type="button"
                    onClick={onClearFilters}
                    className="mt-4 px-4 py-2 rounded-lg text-sm font-medium border hover:bg-gray-50"
                    style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                >
                    Limpar filtros
                </button>
            )}
            {action && <div className="mt-4">{action}</div>}
        </div>
    );
}

/** Estado de erro com botão "Tentar novamente". */
export function ErrorState({ title = "Não foi possível carregar os dados", message, onRetry, isRetrying = false }) {
    return (
        <div className="flex flex-col items-center justify-center text-center py-12 px-4" role="alert">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mb-3 bg-red-50">
                <AlertTriangle size={26} className="text-red-500" />
            </div>
            <p className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{title}</p>
            {message && (
                <p className="text-sm mt-1 max-w-md" style={{ color: 'var(--color-text-secondary)' }}>{message}</p>
            )}
            {onRetry && (
                <button
                    type="button"
                    onClick={() => onRetry()}
                    disabled={isRetrying}
                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-60"
                    style={{ background: 'var(--color-primary)' }}
                >
                    <RefreshCw size={15} className={isRetrying ? "animate-spin" : ""} />
                    Tentar novamente
                </button>
            )}
        </div>
    );
}

/**
 * Aviso discreto quando a actualização em segundo plano falha mas ainda há dados antigos visíveis.
 */
export function StaleDataBanner({ message = "Não foi possível actualizar. A mostrar os últimos dados carregados.", onRetry, isRetrying = false }) {
    return (
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg text-sm bg-amber-50 border border-amber-200 text-amber-800">
            <span className="flex items-center gap-2">
                <AlertTriangle size={16} className="text-amber-600 flex-shrink-0" />
                {message}
            </span>
            {onRetry && (
                <button
                    type="button"
                    onClick={() => onRetry()}
                    disabled={isRetrying}
                    className="font-semibold underline-offset-2 hover:underline whitespace-nowrap disabled:opacity-60"
                >
                    {isRetrying ? "A tentar..." : "Tentar novamente"}
                </button>
            )}
        </div>
    );
}
