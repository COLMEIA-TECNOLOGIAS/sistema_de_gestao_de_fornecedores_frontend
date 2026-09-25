import { ChevronLeft, ChevronRight } from "lucide-react";

function getPageNumbers(page, totalPages) {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages = [1];
    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);
    if (start > 2) pages.push("…start");
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < totalPages - 1) pages.push("…end");
    pages.push(totalPages);
    return pages;
}

/**
 * Rodapé de paginação reutilizável.
 * Funciona com paginação no cliente (useClientPagination) ou no servidor (meta do Laravel).
 */
export default function Pagination({
    page,
    totalPages,
    onPageChange,
    total,
    start,
    end,
    pageSize,
    onPageSizeChange,
    pageSizeOptions = [10, 25, 50, 100],
    isFetching = false,
}) {
    if (!total) return null;
    const pages = getPageNumbers(page, totalPages);

    return (
        <div
            className="flex flex-col md:flex-row items-center justify-between gap-4 px-6 py-4"
            style={{ borderTop: '1px solid var(--color-border-light)' }}
        >
            <div className="flex flex-wrap items-center gap-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                <span>
                    {start !== undefined && end !== undefined
                        ? <>A mostrar <strong>{start}–{end}</strong> de <strong>{total}</strong></>
                        : <><strong>{total}</strong> registos</>}
                </span>
                {onPageSizeChange && (
                    <label className="flex items-center gap-2">
                        <span className="text-xs font-semibold whitespace-nowrap" style={{ color: 'var(--color-text-muted)' }}>Por página</span>
                        <select
                            value={pageSize}
                            onChange={(e) => onPageSizeChange(Number(e.target.value))}
                            className="rounded-lg border bg-transparent outline-none text-sm px-2 py-1.5"
                            style={{ borderColor: 'var(--color-border-light)', color: 'var(--color-text-primary)' }}
                        >
                            {pageSizeOptions.map((n) => <option key={n} value={n}>{n}</option>)}
                        </select>
                    </label>
                )}
                {isFetching && (
                    <span className="w-3.5 h-3.5 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--color-border)', borderTopColor: 'var(--color-primary)' }} />
                )}
            </div>

            {totalPages > 1 && (
                <nav className="flex items-center gap-1.5" aria-label="Paginação">
                    <button
                        onClick={() => onPageChange(page - 1)}
                        disabled={page <= 1}
                        className="px-3 py-2 rounded-lg border text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:bg-gray-50"
                        style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
                        aria-label="Página anterior"
                    >
                        <ChevronLeft size={18} />
                    </button>
                    {pages.map((p) => (typeof p === "string" ? (
                        <span key={p} className="w-9 text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>…</span>
                    ) : (
                        <button
                            key={p}
                            onClick={() => onPageChange(p)}
                            aria-current={p === page ? "page" : undefined}
                            className={`w-9 h-9 rounded-lg text-sm font-semibold transition-all border ${p === page ? 'bg-[#44B16F] text-white border-[#44B16F]' : 'border-gray-200 text-gray-700 hover:bg-gray-100'}`}
                        >
                            {p}
                        </button>
                    )))}
                    <button
                        onClick={() => onPageChange(page + 1)}
                        disabled={page >= totalPages}
                        className="px-3 py-2 rounded-lg border text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:bg-gray-50"
                        style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
                        aria-label="Página seguinte"
                    >
                        <ChevronRight size={18} />
                    </button>
                </nav>
            )}
        </div>
    );
}
