import { X } from "lucide-react";

/**
 * Mostra os filtros activos como "chips" removíveis + "Limpar tudo".
 * @param {{ key: string, label: string, onRemove: () => void }[]} chips
 */
export default function FilterChips({ chips = [], onClearAll, resultCount, className = "" }) {
    const visible = chips.filter(Boolean);
    if (visible.length === 0) return null;

    return (
        <div className={`flex flex-wrap items-center gap-2 ${className}`}>
            {resultCount !== undefined && (
                <span className="text-xs mr-1" style={{ color: 'var(--color-text-secondary)' }}>
                    {resultCount} {resultCount === 1 ? "resultado" : "resultados"} para:
                </span>
            )}
            {visible.map((chip) => (
                <span
                    key={chip.key}
                    className="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1 rounded-full text-xs font-medium"
                    style={{ background: 'var(--color-primary-10)', color: 'var(--color-primary-dark)' }}
                >
                    {chip.label}
                    <button
                        type="button"
                        onClick={chip.onRemove}
                        className="p-0.5 rounded-full hover:bg-black/10"
                        aria-label={`Remover filtro ${chip.label}`}
                    >
                        <X size={12} />
                    </button>
                </span>
            ))}
            {onClearAll && visible.length > 0 && (
                <button
                    type="button"
                    onClick={onClearAll}
                    className="text-xs font-semibold underline-offset-2 hover:underline ml-1"
                    style={{ color: 'var(--color-text-secondary)' }}
                >
                    Limpar filtros
                </button>
            )}
        </div>
    );
}
