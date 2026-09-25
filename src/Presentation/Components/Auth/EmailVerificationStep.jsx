import { useState } from "react";
import { authAPI, usersAPI } from "../../../services/api";
import OtpInput from "./OtpInput";
import { useResendCooldown } from "./useResendCooldown";
import { getErrorMessage } from "../../../utils/apiHelpers";

export default function EmailVerificationStep({ email, userId, onVerified, message }) {
    const [code, setCode] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [error, setError] = useState("");
    const [info, setInfo] = useState("");
    const cooldown = useResendCooldown(60);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isLoading) return;
        if (code.length !== 6) {
            setError("Insira o código de 6 dígitos.");
            return;
        }
        setError("");
        setIsLoading(true);
        try {
            await authAPI.verifyEmail(email, code);
            onVerified?.();
        } catch (err) {
            setError(getErrorMessage(err, "Código inválido ou expirado. Tente novamente."));
        } finally {
            setIsLoading(false);
        }
    };

    const handleResend = async () => {
        if (isResending || cooldown.isCoolingDown) return;
        setIsResending(true);
        setError("");
        setInfo("");
        try {
            if (userId) {
                await usersAPI.resendVerification(userId);
            } else {
                await authAPI.resendEmailVerification();
            }
            setInfo("Se existir uma conta por confirmar com este email, foi enviado um novo código.");
            cooldown.start();
        } catch (err) {
            if (err?.response?.status === 429) cooldown.start();
            setError(getErrorMessage(err, "Erro ao reenviar o código."));
        } finally {
            setIsResending(false);
        }
    };

    return (
        <div>
            {message && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-blue-700 text-sm">{message}</p>
                </div>
            )}

            {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600 text-sm">{error}</p>
                </div>
            )}

            {info && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-700 text-sm">{info}</p>
                </div>
            )}

            <p className="text-sm text-center mb-5" style={{ color: 'var(--color-text-secondary)' }}>
                Foi enviado um código de 6 dígitos para{" "}
                <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{email}</span>.
                Confirme-o para ativar a conta.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
                <OtpInput value={code} onChange={setCode} disabled={isLoading} />

                <button
                    type="submit"
                    disabled={isLoading || code.length !== 6}
                    className="w-full bg-[#44B16F] text-white py-3 px-4 rounded-lg font-medium hover:bg-[#3a9860] transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {isLoading ? (
                        <>
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Confirmar Email
                        </>
                    ) : (
                        'Confirmar Email'
                    )}
                </button>
            </form>

            <div className="text-center mt-5">
                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                    Não recebeu o código?{" "}
                    <button
                        type="button"
                        onClick={handleResend}
                        disabled={isResending || isLoading || cooldown.isCoolingDown}
                        className="text-[#44B16F] font-medium hover:underline disabled:opacity-50"
                    >
                        {isResending ? "A enviar..." : cooldown.isCoolingDown ? `Reenviar código (${cooldown.remaining}s)` : "Reenviar código"}
                    </button>
                </p>
            </div>
        </div>
    );
}