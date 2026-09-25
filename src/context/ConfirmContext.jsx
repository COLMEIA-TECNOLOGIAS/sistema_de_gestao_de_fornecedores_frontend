import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, HelpCircle, X } from "lucide-react";
import { useModalLock } from "../hooks/useModalLock";

const ConfirmContext = createContext(null);

/**
 * Diálogo de confirmação global baseado em Promise (substitui window.confirm).
 *
 * const confirm = useConfirm();
 * if (!(await confirm({ title: "Eliminar produto", message: "Esta acção não pode ser desfeita.",
 *                       confirmLabel: "Sim, eliminar", variant: "danger" }))) return;
 *
 * Com `onConfirm` (async), o diálogo fica aberto com spinner até a acção terminar;
 * se lançar erro, o diálogo mantém-se aberto e o erro é mostrado.
 */
export function ConfirmProvider({ children }) {
    const [dialog, setDialog] = useState(null);
    const [isRunning, setIsRunning] = useState(false);
    const [error, setError] = useState(null);
    const resolver = useRef(null);
    const confirmButtonRef = useRef(null);

    useModalLock(!!dialog);

    const close = useCallback((result) => {
        resolver.current?.(result);
        resolver.current = null;
        setDialog(null);
        setError(null);
        setIsRunning(false);
    }, []);

    const confirm = useCallback((options = {}) => {
        // Se já houver um diálogo aberto, cancelá-lo
        resolver.current?.(false);
        setError(null);
        setIsRunning(false);
        setDialog({
            title: "Confirmar",
            message: "Tem a certeza?",
            confirmLabel: "Confirmar",
            cancelLabel: "Cancelar",
            variant: "default",
            ...options,
        });
        return new Promise((resolve) => {
            resolver.current = resolve;
        });
    }, []);

    const handleConfirm = async () => {
        if (!dialog?.onConfirm) {
            close(true);
            return;
        }
        setIsRunning(true);
        setError(null);
        try {
            await dialog.onConfirm();
            close(true);
        } catch (err) {
            setIsRunning(false);
            setError(dialog.getErrorMessage ? dialog.getErrorMessage(err) : (err?.response?.data?.message || err?.message || "Ocorreu um erro."));
        }
    };

    // Esc fecha, foco no botão principal ao abrir
    useEffect(() => {
        if (!dialog) return;
        confirmButtonRef.current?.focus();
        const onKey = (e) => {
            if (e.key === "Escape" && !isRunning) close(false);
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [dialog, isRunning, close]);

    const isDanger = dialog?.variant === "danger";
    const Icon = isDanger ? AlertTriangle : HelpCircle;

    return (
        <ConfirmContext.Provider value={confirm}>
            {children}
            {dialog && createPortal(
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] animate-overlayFade"
                    onClick={() => !isRunning && close(false)}
                >
                    <div
                        role="alertdialog"
                        aria-modal="true"
                        aria-labelledby="confirm-dialog-title"
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-modalFadeIn"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${isDanger ? "bg-red-100" : "bg-green-100"}`}>
                                    <Icon className={`w-5 h-5 ${isDanger ? "text-red-600" : "text-green-600"}`} />
                                </div>
                                <h2 id="confirm-dialog-title" className="text-lg font-bold text-gray-900">{dialog.title}</h2>
                            </div>
                            <button
                                onClick={() => close(false)}
                                disabled={isRunning}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                                aria-label="Fechar"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        <div className="p-6">
                            {typeof dialog.message === "string"
                                ? <p className="text-gray-600">{dialog.message}</p>
                                : dialog.message}
                            {error && (
                                <p className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{error}</p>
                            )}
                        </div>

                        <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-200">
                            <button
                                onClick={() => close(false)}
                                disabled={isRunning}
                                className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium disabled:opacity-50"
                            >
                                {dialog.cancelLabel}
                            </button>
                            <button
                                ref={confirmButtonRef}
                                onClick={handleConfirm}
                                disabled={isRunning}
                                className={`px-5 py-2.5 text-white rounded-lg transition-colors font-medium flex items-center gap-2 disabled:opacity-60 ${isDanger ? "bg-red-600 hover:bg-red-700" : "bg-[#44B16F] hover:bg-[#3a9d5f]"}`}
                            >
                                {isRunning && (
                                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                )}
                                {isRunning ? (dialog.runningLabel || "A processar...") : dialog.confirmLabel}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </ConfirmContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useConfirm() {
    const ctx = useContext(ConfirmContext);
    if (!ctx) throw new Error("useConfirm must be used within ConfirmProvider");
    return ctx;
}
