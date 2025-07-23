import { CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../../Components/Button';

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
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        Senha redefinida com sucesso!
      </h1>

      {/* Botão de ação */}
      <Button 
        onClick={() => navigate('/')}
        className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white text-lg"
      >
        Concluir
      </Button>
    </div>
  );
}