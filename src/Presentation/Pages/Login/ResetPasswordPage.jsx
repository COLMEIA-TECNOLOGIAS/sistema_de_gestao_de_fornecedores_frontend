import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, Lock, CheckCircle2 } from "lucide-react";
import { authAPI } from "../../../services/api";
import PasswordStrength from "../../Components/Auth/PasswordStrength";
import PasswordCriteria from "../../Components/Auth/ResetPasswordCritia";

function getStrength(password) {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/\d/.test(password) && /[^A-Za-z0-9]/.test(password)) score++;
    return score;
}

const passwordCriteria = (password) => ({
    length: password.length >= 8,
    upperLower: /[a-z]/.test(password) && /[A-Z]/.test(password),
    number: /\d/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
});

export default function ResetPasswordPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { email = "", code = "", token = "" } = location.state || {};

    const [password, setPassword] = useState("");
    const [passwordConfirmation, setPasswordConfirmation] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const strength = getStrength(password);
    const criteria = passwordCriteria(password);
    const passwordsMatch = password === passwordConfirmation;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (strength < 3) {
            setError("A senha deve ter pelo menos 8 caracteres, maiúsculas, minúsculas, números e caracteres especiais.");
            return;
        }
        if (!passwordsMatch) {
            setError("As senhas não coincidem.");
            return;
        }

        setIsLoading(true);
        try {
            await authAPI.resetPassword({
                email,
                code,
                token,
                password,
                password_confirmation: passwordConfirmation,
            });
            navigate("/success-reset");
        } catch (err) {
            console.error("Reset password error:", err);
            setError(
                err.response?.data?.message ||
                err.response?.data?.errors?.password?.[0] ||
                "Erro ao redefinir a senha. Tente novamente."
            );
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
                            <h2 className="text-5xl font-bold mb-4">Definir</h2>
                            <h2 className="text-5xl font-bold">Nova Senha.</h2>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="flex items-center justify-center px-6 py-8" style={{ background: 'var(--color-surface)' }}>
                <div className="w-full max-w-md">
                    <button
                        onClick={() => navigate("/verify-code", { state: { email, purpose: "password" } })}
                        className="mb-8 flex items-center gap-2 text-sm font-medium hover:opacity-70 transition-opacity"
                        style={{ color: 'var(--color-text-secondary)' }}
                    >
                        <ArrowLeft size={16} />
                        Voltar
                    </button>

                    <div className="mb-8">
                        <h1 className="text-3xl font-bold mb-3" style={{ color: 'var(--color-text-primary)' }}>
                            Nova Senha
                        </h1>
                        <p className="text-base" style={{ color: 'var(--color-text-secondary)' }}>
                            Defina uma nova senha para a conta
                            {email ? ` ${email}` : ""}.
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
                                Nova senha
                            </label>
                            <div className="relative">
                                <Lock
                                    size={18}
                                    className="absolute left-4 top-1/2 -translate-y-1/2"
                                    style={{ color: 'var(--color-text-muted)' }}
                                />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Nova senha"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-12 pr-12 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#44B16F]/30 focus:border-[#44B16F] transition-all"
                                    style={{
                                        background: 'var(--color-bg)',
                                        border: '1px solid var(--color-border)',
                                        color: 'var(--color-text-primary)',
                                    }}
                                    required
                                    disabled={isLoading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
                                    style={{ color: 'var(--color-text-muted)' }}
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>

                            {strength > 0 && <PasswordStrength strength={strength} />}

                            <ul className="mt-4 space-y-2 list-none">
                                <PasswordCriteria checked={criteria.length}>Mínimo de 8 caracteres</PasswordCriteria>
                                <PasswordCriteria checked={criteria.upperLower}>Letras maiúsculas e minúsculas</PasswordCriteria>
                                <PasswordCriteria checked={criteria.number}>Pelo menos um número</PasswordCriteria>
                                <PasswordCriteria checked={criteria.special}>Pelo menos um carácter especial</PasswordCriteria>
                            </ul>
                        </div>

                        <div>
                            <label className="block text-sm mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                                Confirmar senha
                            </label>
                            <div className="relative">
                                <Lock
                                    size={18}
                                    className="absolute left-4 top-1/2 -translate-y-1/2"
                                    style={{ color: 'var(--color-text-muted)' }}
                                />
                                <input
                                    type={showConfirmation ? "text" : "password"}
                                    placeholder="Confirme a nova senha"
                                    value={passwordConfirmation}
                                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                                    className="w-full pl-12 pr-12 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#44B16F]/30 focus:border-[#44B16F] transition-all"
                                    style={{
                                        background: 'var(--color-bg)',
                                        border: '1px solid var(--color-border)',
                                        color: 'var(--color-text-primary)',
                                    }}
                                    required
                                    disabled={isLoading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmation(!showConfirmation)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
                                    style={{ color: 'var(--color-text-muted)' }}
                                >
                                    {showConfirmation ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                            {passwordConfirmation && !passwordsMatch && (
                                <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                                    <CheckCircle2 size={14} />
                                    As senhas não coincidem.
                                </p>
                            )}
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
                                    Redefinir Senha
                                </>
                            ) : (
                                'Redefinir Senha'
                            )}
                        </button>
                    </form>

                    <p className="text-sm mt-6" style={{ color: 'var(--color-text-muted)' }}>
                        Já tem senha?{" "}
                        <Link to="/login" className="text-[#44B16F] font-medium hover:underline">
                            Entrar
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}