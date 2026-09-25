import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CheckCircle, XCircle, Info, AlertCircle, X } from "lucide-react";

const ToastContext = createContext(null);

const STYLES = {
    success: { icon: CheckCircle, bg: "bg-green-50", border: "border-green-200", iconColor: "text-green-600", text: "text-green-800" },
    error:   { icon: XCircle,     bg: "bg-red-50",   border: "border-red-200",   iconColor: "text-red-600",   text: "text-red-800" },
    info:    { icon: Info,        bg: "bg-blue-50",  border: "border-blue-200",  iconColor: "text-blue-600",  text: "text-blue-800" },
    warning: { icon: AlertCircle, bg: "bg-amber-50", border: "border-amber-200", iconColor: "text-amber-600", text: "text-amber-800" },
};

const DEFAULT_DURATION = { success: 3500, info: 4000, warning: 5000, error: 6000 };
const MAX_VISIBLE = 4;

/**
 * Notificações globais empilháveis.
 *
 * const toast = useToast();
 * toast.success("Fornecedor eliminado");
 * toast.error(getErrorMessage(err));
 */
export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const timers = useRef(new Map());
    const nextId = useRef(0);

    const dismiss = useCallback((id) => {
        setToasts((list) => list.filter((t) => t.id !== id));
        const timer = timers.current.get(id);
        if (timer) {
            clearTimeout(timer);
            timers.current.delete(id);
        }
    }, []);

    const show = useCallback((type, message, { duration } = {}) => {
        if (!message) return null;
        const id = ++nextId.current;
        setToasts((list) => {
            // Não repetir a mesma mensagem já visível (ex.: vários pedidos a falhar ao mesmo tempo)
            if (list.some((t) => t.type === type && t.message === message)) return list;
            return [...list, { id, type, message }].slice(-MAX_VISIBLE);
        });
        const ms = duration ?? DEFAULT_DURATION[type] ?? 4000;
        if (ms > 0) {
            timers.current.set(id, setTimeout(() => dismiss(id), ms));
        }
        return id;
    }, [dismiss]);

    const api = useMemo(() => ({
        show,
        dismiss,
        success: (message, opts) => show("success", message, opts),
        error: (message, opts) => show("error", message, opts),
        info: (message, opts) => show("info", message, opts),
        warning: (message, opts) => show("warning", message, opts),
    }), [show, dismiss]);

    return (
        <ToastContext.Provider value={api}>
            {children}
            {createPortal(
                <div
                    className="fixed top-4 right-4 z-[10000] flex flex-col gap-2 pointer-events-none"
                    role="region"
                    aria-live="polite"
                    aria-label="Notificações"
                >
                    {toasts.map((t) => {
                        const { icon: Icon, bg, border, iconColor, text } = STYLES[t.type] || STYLES.info;
                        return (
                            <div
                                key={t.id}
                                role={t.type === "error" ? "alert" : "status"}
                                className={`${bg} ${border} border rounded-xl shadow-lg p-4 flex items-center gap-3 min-w-[300px] max-w-md pointer-events-auto animate-slide-in-right`}
                            >
                                <Icon className={`${iconColor} flex-shrink-0`} size={20} />
                                <p className={`${text} flex-1 text-sm font-medium`}>{t.message}</p>
                                <button
                                    onClick={() => dismiss(t.id)}
                                    className="p-1 hover:bg-black/5 rounded transition-colors"
                                    aria-label="Fechar notificação"
                                >
                                    <X size={16} className="text-gray-500" />
                                </button>
                            </div>
                        );
                    })}
                </div>,
                document.body
            )}
        </ToastContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error("useToast must be used within ToastProvider");
    return ctx;
}
