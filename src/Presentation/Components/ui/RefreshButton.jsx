import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

function formatRelative(timestamp, now) {
    if (!timestamp) return null;
    const seconds = Math.max(0, Math.round((now - timestamp) / 1000));
    if (seconds < 10) return "agora mesmo";
    if (seconds < 60) return `há ${seconds} s`;
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return `há ${minutes} min`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `há ${hours} h`;
    return new Date(timestamp).toLocaleString("pt-PT", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

/**
 * Botão "Actualizar" com indicador de actualização em curso e da última actualização.
 * Usar com o resultado do useQuery: <RefreshButton onClick={refetch} isFetching={isFetching} updatedAt={dataUpdatedAt} />
 */
export default function RefreshButton({ onClick, isFetching = false, updatedAt, showLabel = true, className = "" }) {
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        if (!updatedAt) return;
        const timer = setInterval(() => setNow(Date.now()), 15000);
        return () => clearInterval(timer);
    }, [updatedAt]);

    const relative = formatRelative(updatedAt, Math.max(now, updatedAt || 0));
    const title = updatedAt
        ? `Actualizado ${relative} — clique para actualizar`
        : "Actualizar";

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            {showLabel && relative && (
                <span className="hidden md:inline text-xs whitespace-nowrap" style={{ color: 'var(--color-text-muted)' }}>
                    {isFetching ? "A actualizar..." : `Actualizado ${relative}`}
                </span>
            )}
            <button
                type="button"
                onClick={() => onClick?.()}
                disabled={isFetching}
                title={title}
                aria-label="Actualizar"
                className="p-2.5 rounded-lg border transition-colors hover:bg-gray-50 disabled:cursor-wait"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)', background: 'var(--color-surface)' }}
            >
                <RefreshCw size={18} className={isFetching ? "animate-spin" : ""} />
            </button>
        </div>
    );
}
