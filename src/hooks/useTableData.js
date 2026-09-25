import { useMemo } from 'react';

/**
 * Ordena uma lista no cliente.
 * @param {Array} items
 * @param {{ sort: string, dir: 'asc'|'desc' }} sortState
 * @param {Record<string, (item) => any>} accessors - como obter o valor de cada coluna.
 *        Definir fora do componente (ou com useMemo) para ser estável entre renders.
 */
export function useSortedItems(items, { sort, dir }, accessors) {
    return useMemo(() => {
        const getValue = sort && accessors?.[sort];
        if (!getValue) return items;
        const factor = dir === 'desc' ? -1 : 1;
        const collator = new Intl.Collator('pt', { sensitivity: 'base', numeric: true });

        return [...items].sort((a, b) => {
            const va = getValue(a);
            const vb = getValue(b);
            // Valores vazios vão sempre para o fim
            const emptyA = va === null || va === undefined || va === '';
            const emptyB = vb === null || vb === undefined || vb === '';
            if (emptyA && emptyB) return 0;
            if (emptyA) return 1;
            if (emptyB) return -1;
            if (va instanceof Date || vb instanceof Date) return (new Date(va) - new Date(vb)) * factor;
            if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * factor;
            return collator.compare(String(va), String(vb)) * factor;
        });
    }, [items, sort, dir, accessors]);
}

/**
 * Paginação no cliente. Corrige automaticamente a página se ficar fora do intervalo
 * (ex.: depois de eliminar o último registo da última página).
 */
export function useClientPagination(items, page, pageSize) {
    return useMemo(() => {
        const total = items.length;
        const totalPages = Math.max(1, Math.ceil(total / pageSize));
        const safePage = Math.min(Math.max(1, page), totalPages);
        const startIndex = (safePage - 1) * pageSize;
        return {
            pageItems: items.slice(startIndex, startIndex + pageSize),
            total,
            totalPages,
            page: safePage,
            start: total === 0 ? 0 : startIndex + 1,
            end: Math.min(startIndex + pageSize, total),
        };
    }, [items, page, pageSize]);
}
