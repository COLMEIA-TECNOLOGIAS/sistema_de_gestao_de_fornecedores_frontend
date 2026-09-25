import { useEffect, useState } from 'react';

/**
 * Devolve `value` apenas depois de ficar estável durante `delay` ms.
 * Útil para pesquisas: evita filtrar/pedir à API a cada tecla.
 */
export function useDebouncedValue(value, delay = 300) {
    const [debounced, setDebounced] = useState(value);

    useEffect(() => {
        const timer = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);

    return debounced;
}
