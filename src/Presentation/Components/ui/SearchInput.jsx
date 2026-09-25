import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";

/**
 * Campo de pesquisa com debounce e botão para limpar.
 * `value` é o valor "confirmado" (ex.: vindo do URL); `onChange` só é chamado
 * depois de o utilizador parar de escrever `delay` ms (ou imediatamente com Enter/limpar).
 */
export default function SearchInput({ value = "", onChange, placeholder = "Pesquisar...", delay = 300, className = "", autoFocus = false }) {
    const [text, setText] = useState(value);
    const onChangeRef = useRef(onChange);
    const lastEmitted = useRef(value);

    useEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);

    // Sincronizar quando o valor externo muda (ex.: "Limpar filtros" ou navegação)
    useEffect(() => {
        if (value !== lastEmitted.current) {
            lastEmitted.current = value;
            setText(value);
        }
    }, [value]);

    useEffect(() => {
        if (text === lastEmitted.current) return;
        const timer = setTimeout(() => {
            lastEmitted.current = text;
            onChangeRef.current?.(text);
        }, delay);
        return () => clearTimeout(timer);
    }, [text, delay]);

    const emitNow = (next) => {
        lastEmitted.current = next;
        onChangeRef.current?.(next);
    };

    return (
        <div className={`relative ${className}`}>
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--color-text-muted)' }} />
            <input
                type="search"
                value={text}
                autoFocus={autoFocus}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === "Enter") emitNow(text);
                    if (e.key === "Escape" && text) {
                        setText("");
                        emitNow("");
                    }
                }}
                placeholder={placeholder}
                aria-label={placeholder}
                className="w-full pl-10 pr-9 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#44B16F] focus:border-transparent [&::-webkit-search-cancel-button]:hidden"
                style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
            />
            {text && (
                <button
                    type="button"
                    onClick={() => { setText(""); emitNow(""); }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-black/5"
                    aria-label="Limpar pesquisa"
                    title="Limpar pesquisa"
                >
                    <X size={14} style={{ color: 'var(--color-text-muted)' }} />
                </button>
            )}
        </div>
    );
}
