import { useState } from "react";
import { X, Send, Loader2 } from "lucide-react";
import { suppliersAPI } from "../../services/api";

export default function ModalLinkExterno({ isOpen, onClose, onSuccess }) {
    const [email, setEmail] = useState("");
    const [activityType, setActivityType] = useState("service");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (!email.trim()) {
            setError("Por favor, insira o email do fornecedor.");
            return;
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError("Por favor, insira um email válido.");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            await suppliersAPI.invite({
                email: email.trim(),
                activity_type: activityType
            });

            setSuccess(true);
            setTimeout(() => {
                handleClose();
                if (onSuccess) onSuccess();
            }, 2000);
        } catch (err) {
            console.error("Erro ao enviar convite:", err);
            setError(
                err.response?.data?.message || 
                "Erro ao enviar convite. Tente novamente."
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setEmail("");
        setActivityType("service");
        setError(null);
        setSuccess(false);
        setIsSubmitting(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-fadeIn">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#44B16F]/10 rounded-lg">
                            <Send className="w-5 h-5 text-[#44B16F]" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">Enviar convite</h2>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-5">
                    {success ? (
                        <div className="flex flex-col items-center py-6">
                            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
                                <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-1">Convite Enviado!</h3>
                            <p className="text-sm text-gray-500 text-center">
                                O convite de cadastro foi enviado com sucesso para <strong>{email}</strong>.
                            </p>
                        </div>
                    ) : (
                        <>
                            <p className="text-sm text-gray-500">
                                Envie um convite por email para o fornecedor se registrar no sistema. 
                                O fornecedor receberá um link para completar o cadastro.
                            </p>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Email do Fornecedor *
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        setError(null);
                                    }}
                                    placeholder="email@fornecedor.com"
                                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#44B16F] focus:border-transparent transition-all"
                                    disabled={isSubmitting}
                                />
                            </div>



                            {/* Error */}
                            {error && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                                    <svg className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <p className="text-sm text-red-600">{error}</p>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                {!success && (
                    <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-200">
                        <button
                            onClick={handleClose}
                            disabled={isSubmitting}
                            className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting || !email.trim()}
                            className="px-6 py-2.5 bg-[#44B16F] text-white rounded-lg hover:bg-[#3a9d5f] transition-colors font-medium flex items-center gap-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Enviando...
                                </>
                            ) : (
                                <>
                                    <Send className="w-4 h-4" />
                                    Enviar Convite
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
