import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, CheckCircle } from 'lucide-react';
import Input from '../../Components/Input';
import Button from '../../Components/Button';

export default function RegisterPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    // Validação básica das senhas
    if (password !== confirmPassword) {
      alert('As senhas não coincidem!');
      return;
    }
    
    // Simulação de sucesso no registro
    navigate('/success-reset', {
      state: { email: 'usuario@exemplo.com' } // Pode substituir por dados reais
    });
  };

  return (
    <div className="flex h-screen">
      {/* Seção da Imagem (50%) */}
      <div className="w-1/2 h-full bg-gray-100 overflow-hidden">
        <img 
          src="/Register.jpg" 
          alt="Imagem decorativa de segurança"
          className="w-full h-full object-cover object-center"
        />
      </div>

      {/* Seção do Formulário (50%) */}
      <div className="w-1/2 flex items-center justify-center p-12">
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Nova Senha</h1>
          <p className="text-gray-600 mb-8 text-lg">
            Crie uma nova senha, única e discreta que seja fácil de lembrar
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Campo Nova Senha */}
            <Input
              type={showPassword ? 'text' : 'password'}
              label="Nova senha"
              placeholder="Nova senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              iconRight={
                <button
                  type="button"
                  className="text-gray-500 hover:text-gray-700 focus:outline-none"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              }
            />

            {/* Campo Confirmar Senha */}
            <Input
              type={showConfirmPassword ? 'text' : 'password'}
              label="Confirmar senha"
              placeholder="Confirme sua senha"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              iconRight={
                <button
                  type="button"
                  className="text-gray-500 hover:text-gray-700 focus:outline-none"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              }
            />

            {/* Botão Confirmar */}
            <Button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 text-lg"
            >
              Confirmar
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
