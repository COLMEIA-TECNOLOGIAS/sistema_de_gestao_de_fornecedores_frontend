import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

/**
 * Cabeçalho de coluna ordenável. Clique alterna asc → desc → sem ordenação.
 * `sort`/`dir` vêm tipicamente do useUrlFilters; `onSort(sort, dir)` actualiza-os.
 */
export default function SortableHeader({ label, sortKey, sort, dir, onSort, className = "", style }) {
    const active = sort === sortKey;
    const Icon = !active ? ArrowUpDown : dir === "desc" ? ArrowDown : ArrowUp;

    const handleClick = () => {
        if (!active) onSort(sortKey, "asc");
        else if (dir === "asc") onSort(sortKey, "desc");
        else onSort("", "");
    };

    return (
        <th
            className={className}
            style={style}
            aria-sort={active ? (dir === "desc" ? "descending" : "ascending") : "none"}
        >
            <button
                type="button"
                onClick={handleClick}
                className="inline-flex items-center gap-1.5 hover:opacity-80"
                style={{ font: 'inherit', letterSpacing: 'inherit', textTransform: 'inherit', color: active ? 'var(--color-primary)' : 'inherit' }}
            >
                {label}
                <Icon size={13} className={active ? "" : "opacity-40"} />
            </button>
        </th>
    );
}
