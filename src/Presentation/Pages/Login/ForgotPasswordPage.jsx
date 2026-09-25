import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Mail } from "lucide-react";
import { authAPI } from "../../../services/api";
import { getErrorMessage } from "../../../utils/apiHelpers";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isLoading) return;
        setError("");
        setIsLoading(true);

        try {
            await authAPI.forgotPassword(email.trim());
            navigate("/verify-code", { state: { email: email.trim(), purpose: "password" } });
        } catch (err) {
            setError(getErrorMessage(err, "Erro ao enviar o código de recuperação. Verifique o e-mail."));
        } finally {
            setIsLoading(false);
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
                            <h2 className="text-5xl font-bold mb-4">Recuperar</h2>
                            <h2 className="text-5xl font-bold">a Senha.</h2>
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
                        Voltar ao login
                    </button>

                    <div className="mb-8">
                        <h1 className="text-4xl font-bold mb-3" style={{ color: 'var(--color-text-primary)' }}>
                            Esqueceu a senha?
                        </h1>
                        <p className="text-base" style={{ color: 'var(--color-text-secondary)' }}>
                            Introduza o seu e-mail para receber um código de recuperação
                            de 6 dígitos.
                        </p>
                    </div>

                    {error && (
                        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-red-600 text-sm">{error}</p>
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

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-[#44B16F] text-white py-3 px-4 rounded-lg font-medium hover:bg-[#3a9860] transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    A enviar...
                                </>
                            ) : (
                                'Enviar Código'
                            )}
                        </button>
                    </form>

                    <p className="text-sm mt-6" style={{ color: 'var(--color-text-muted)' }}>
                        Lembrou-se da senha?{" "}
                        <Link to="/login" className="text-[#44B16F] font-medium hover:underline">
                            Entrar
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}