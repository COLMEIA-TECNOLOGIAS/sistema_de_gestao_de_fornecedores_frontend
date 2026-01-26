import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await login(formData.email, formData.password);
      navigate("/dashboard");
    } catch (err) {
      console.error("Login error:", err);
      setError(
        err.response?.data?.message ||
        "Erro ao fazer login. Verifique suas credenciais."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      {/* Left Side - Image with content - Menos espaço */}
      <div className="hidden lg:flex items-center justify-center relative overflow-hidden py-4">
        <img
          src="/public/Rectangle 1.png"
          alt="Background"
          className="absolute inset-4 w-[calc(100%-2rem)] h-[calc(100%-2rem)] object-cover"
        />
        <div className="absolute inset-4 bg-black/50"></div>

        <div className="relative z-10 w-full h-full flex flex-col">
          {/* Center Content */}
          <div className="flex-1 flex flex-col items-center justify-center px-12">
            {/* Logo acima do texto */}
            <div className="flex justify-center mb-12">
              <img src="/login1.svg" className="w-40 h-40" alt="MOSAP3 Logo" />
            </div>

            <div className="text-center text-white max-w-2xl">
              <h2 className="text-5xl font-bold mb-4">
                Sistema de Gestão
              </h2>
              <h2 className="text-5xl font-bold">
                de Fornecedores.
              </h2>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form - Menos espaço */}
      <div className="flex items-center justify-center px-6 py-8 bg-white">
        <div className="w-full max-w-md">
          {/* Logo for mobile */}
          <div className="lg:hidden flex justify-center mb-8">
            <img src="/login1.svg" className="w-40 h-40" alt="MOSAP3 Logo" />
          </div>

          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-3 text-gray-900">
              Login
            </h1>
            <p className="text-gray-600 text-base">
              Entre com as sua conta para continuar<br />
              com as suas atividades
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label className="block text-sm text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                placeholder="seu.email@exemplo.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 border border-[#DDE5E9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#44B16F]/20 focus:border-[#44B16F] transition-all"
                required
                disabled={isLoading}
              />
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm text-gray-700 mb-2">
                Senha
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Sua senha"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-3 border border-[#DDE5E9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#44B16F]/20 focus:border-[#44B16F] transition-all pr-12"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Submit Button and Forgot Password in same line */}
            <div className="flex items-center justify-end">
              <button
                type="submit"
                disabled={isLoading}
                className="bg-[#44B16F] text-white py-2.5 px-8 rounded-lg font-medium hover:bg-[#3a9860] transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Entrando...
                  </>
                ) : (
                  'Fazer Login'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}