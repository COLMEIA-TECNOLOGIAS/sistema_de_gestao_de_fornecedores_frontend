import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { ArrowLeft, MailCheck, Mail } from "lucide-react";
import { authAPI } from "../../../services/api";
import OtpInput from "../../Components/Auth/OtpInput";
import { useResendCooldown } from "../../Components/Auth/useResendCooldown";
import { getErrorMessage } from "../../../utils/apiHelpers";

export default function EmailVerificationPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const initialEmail = location.state?.email || new URLSearchParams(location.search).get("email") || "";

    const [email, setEmail] = useState(initialEmail);
    const [code, setCode] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [error, setError] = useState("");
    const [info, setInfo] = useState("");
    const [isVerified, setIsVerified] = useState(false);
    const cooldown = useResendCooldown(60);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isLoading) return;
        if (!email.trim()) {
            setError("Indique o seu e-mail.");
            return;
        }
        if (code.length !== 6) {
            setError("Insira o código de 6 dígitos.");
            return;
        }
        setError("");
        setIsLoading(true);

        try {
            await authAPI.verifyEmail(email.trim(), code);
            setIsVerified(true);
        } catch (err) {
            setError(getErrorMessage(err, "Código inválido ou expirado. Tente novamente."));
        } finally {
            setIsLoading(false);
        }
    };

    const handleResend = async () => {
        if (isResending || cooldown.isCoolingDown) return;
        if (!email.trim()) {
            setError("Indique o seu e-mail para receber um novo código.");
            return;
        }
        setIsResending(true);
        setError("");
        setInfo("");
        try {
            // O e-mail é necessário porque o utilizador ainda não tem sessão iniciada
            await authAPI.resendEmailVerification(email.trim());
            setCode("");
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
        <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
            {/* Left Side - Image */}
            <div className="hidden lg:flex items-center justify-center relative overflow-hidden py-4">
                <img
                    src="/login_bg.png"
                    alt="Background"
                    className="absolute inset-4 w-[calc(100%-2rem)] h-[calc(100%-2rem)] object-cover"
                />
                <div className="absolute inset-4 bg-black/50"></div>

                <div className="relative z-10 w-full h-full flex flex-col">
                    <div className="flex-1 flex flex-col items-center justify-center px-12">
                        <div className="flex justify-center mb-12">
                            <img src="/login1.svg" className="w-40 h-40" alt="MOSAP3 Logo" />
                        </div>
                        <div className="text-center text-white max-w-2xl">
                            <h2 className="text-5xl font-bold mb-4">Confirmação</h2>
                            <h2 className="text-5xl font-bold">de Email.</h2>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="flex items-center justify-center px-6 py-8" style={{ background: 'var(--color-surface)' }}>
                <div className="w-full max-w-md">
                    <button
                        onClick={() => navigate("/login")}
                        className="mb-8 flex items-center gap-2 text-sm font-medium hover:opacity-70 transition-opacity"
                        style={{ color: 'var(--color-text-secondary)' }}
                    >
                        <ArrowLeft size={16} />
                        Voltar
                    </button>

                    {isVerified ? (
                        <div className="text-center">
                            <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-50 mb-5">
                                <svg
                                    className="h-10 w-10 text-[#44B16F]"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h1 className="text-3xl font-bold mb-3" style={{ color: 'var(--color-text-primary)' }}>
                                Email confirmado!
                            </h1>
                            <p className="text-base mb-8" style={{ color: 'var(--color-text-secondary)' }}>
                                O seu endereço de email foi verificado com sucesso.
                            </p>
                            <button
                                onClick={() => navigate("/login", { replace: true })}
                                className="w-full bg-[#44B16F] text-white py-3 px-4 rounded-lg font-medium hover:bg-[#3a9860] transition-colors shadow-sm"
                            >
                                Entrar no Sistema
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="mb-8">
                                <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full mb-4 bg-[#44B16F]/10">
                                    <MailCheck size={24} className="text-[#44B16F]" />
                                </div>
                                <h1 className="text-3xl font-bold mb-3 text-center" style={{ color: 'var(--color-text-primary)' }}>
                                    Confirmar Email
                                </h1>
                                <p className="text-base text-center" style={{ color: 'var(--color-text-secondary)' }}>
                                    Introduza o código de 6 dígitos enviado para o seu e-mail
                                    para confirmar a sua conta.
                                </p>
                            </div>

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

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-sm mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                                        E-mail
                                    </label>
                                    <div className="relative">
                                        <Mail
                                            size={18}
                                            className="absolute left-4 top-1/2 -translate-y-1/2"
                                            style={{ color: 'var(--color-text-muted)' }}
                                        />
                                        <input
                                            type="email"
                                            placeholder="o.seu.email@exemplo.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full pl-12 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#44B16F]/30 focus:border-[#44B16F] transition-all"
                                            style={{
                                                background: 'var(--color-bg)',
                                                border: '1px solid var(--color-border)',
                                                color: 'var(--color-text-primary)',
                                            }}
                                            required
                                            disabled={isLoading}
                                        />
                                    </div>
                                </div>

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
                                            A confirmar...
                                        </>
                                    ) : (
                                        'Confirmar Email'
                                    )}
                                </button>
                            </form>

                            <div className="text-center mt-6">
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
                                <Link
                                    to="/login"
                                    className="text-sm mt-4 inline-block hover:underline"
                                    style={{ color: 'var(--color-text-secondary)' }}
                                >
                                    Voltar ao login
                                </Link>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}