import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: ""
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(formData);
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
                Plataforma de gestão
              </h2>
              <h2 className="text-5xl font-bold">
                de fornecedores.
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

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username Field */}
            <div>
              <label className="block text-sm text-gray-700 mb-2">
                Nome de usuário
              </label>
              <input
                type="text"
                placeholder="Crisvan Van-dunem"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full px-4 py-3 border border-[#DDE5E9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#44B16F]/20 focus:border-[#44B16F] transition-all"
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
                  placeholder="Escreve alguma coisa"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-3 border border-[#DDE5E9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#44B16F]/20 focus:border-[#44B16F] transition-all pr-12"
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
            <div className="flex items-center justify-between gap-4">
              <button
                type="submit"
                className="bg-[#44B16F] text-white py-2.5 px-8 rounded-lg font-medium hover:bg-[#3a9860] transition-colors shadow-sm"
              >
                Fazer Login
              </button>
              
              <a href="#" className="text-sm text-[#44B16F] hover:underline whitespace-nowrap">
                Esqueci minha senha
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}