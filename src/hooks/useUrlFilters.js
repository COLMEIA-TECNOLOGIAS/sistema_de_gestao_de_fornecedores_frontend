import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Estado de filtros guardado no URL (?q=...&estado=...&page=2).
 *
 * - Sobrevive a refresh (F5), ao botão "voltar" e pode ser partilhado por link.
 * - Valores iguais ao default não aparecem no URL (URL limpo).
 * - O tipo de cada filtro segue o default: number → Number, boolean → Boolean, resto → string.
 *
 * @param {Record<string, string|number|boolean>} defaults
 * @param {{ resetPageOn?: boolean }} [options] - por omissão, alterar qualquer filtro
 *        (excepto `page`/`pageSize`) volta à página 1.
 *
 * @example
 * const { filters, setFilter, setFilters, resetFilters, activeCount } =
 *     useUrlFilters({ q: '', estado: '', page: 1, pageSize: 25 });
 */
export function useUrlFilters(defaults, { resetPageOn = true } = {}) {
    const [searchParams, setSearchParams] = useSearchParams();

    // `defaults` costuma ser um literal novo a cada render — estabilizar pelo conteúdo
    const defaultsKey = JSON.stringify(defaults);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const stableDefaults = useMemo(() => defaults, [defaultsKey]);

    const filters = useMemo(() => {
        const result = {};
        for (const [key, def] of Object.entries(stableDefaults)) {
            const raw = searchParams.get(key);
            if (raw === null) {
                result[key] = def;
            } else if (typeof def === 'number') {
                const n = Number(raw);
                result[key] = Number.isFinite(n) ? n : def;
            } else if (typeof def === 'boolean') {
                result[key] = raw === 'true' || raw === '1';
            } else {
                result[key] = raw;
            }
        }
        return result;
    }, [searchParams, stableDefaults]);

    const setFilters = useCallback((partial) => {
        setSearchParams((prev) => {
            const next = new URLSearchParams(prev);
            const changesOtherThanPaging = Object.keys(partial).some((k) => k !== 'page' && k !== 'pageSize');

            for (const [key, value] of Object.entries(partial)) {
                const def = stableDefaults[key];
                if (value === undefined || value === null || value === '' || value === def) {
                    next.delete(key);
                } else {
                    next.set(key, String(value));
                }
            }

            if (resetPageOn && 'page' in stableDefaults && (changesOtherThanPaging || 'pageSize' in partial) && !('page' in partial)) {
                next.delete('page');
            }
            return next;
        }, { replace: true });
    }, [setSearchParams, stableDefaults, resetPageOn]);

    const setFilter = useCallback((key, value) => setFilters({ [key]: value }), [setFilters]);

    /** Repõe os defaults. `keep` = chaves a preservar (ex.: ['tab', 'pageSize']). */
    const resetFilters = useCallback((keep = []) => {
        setSearchParams((prev) => {
            const next = new URLSearchParams(prev);
            for (const key of Object.keys(stableDefaults)) {
                if (!keep.includes(key)) next.delete(key);
            }
            return next;
        }, { replace: true });
    }, [setSearchParams, stableDefaults]);

    /** Número de filtros activos (ignora paginação, ordenação e as chaves em `ignore`). */
    const countActive = useCallback((ignore = []) => {
        const skip = new Set(['page', 'pageSize', 'sort', 'dir', ...ignore]);
        return Object.keys(stableDefaults).filter((k) => !skip.has(k) && filters[k] !== stableDefaults[k]).length;
    }, [filters, stableDefaults]);

    return { filters, setFilter, setFilters, resetFilters, countActive, activeCount: countActive() };
}
