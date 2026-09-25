import { CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function SuccessPasswordReset() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 text-center">
      {/* Ícone de sucesso */}
      <CheckCircle
        className="h-20 w-20 text-green-500 mb-4"
        strokeWidth={1.5}
      />

      {/* Mensagem principal */}
      <h1 className="text-3xl font-bold text-gray-900 mb-3">
        Senha redefinida com sucesso!
      </h1>
      <p className="text-gray-500 mb-6">
        Já pode iniciar sessão com a sua nova senha.
      </p>

      {/* Botão de acção */}
      <button
        type="button"
        onClick={() => navigate('/login', { replace: true })}
        className="px-8 py-3 bg-[#44B16F] hover:bg-[#3a9860] text-white text-lg font-medium rounded-lg transition-colors shadow-sm"
      >
        Iniciar Sessão
      </button>
    </div>
  );
}
