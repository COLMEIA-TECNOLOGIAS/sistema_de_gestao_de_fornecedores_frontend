import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function AddFornecedorPage() {
  const navigate = useNavigate();

  const handleVoltar = () => {
    navigate('/'); 
    
  };

  const handleComecar = () => {
    navigate('/FornecedorFormStep1');
  };

  const handleCancelar = () => {
    navigate(-1); // ou navigate('/fornecedores');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header com botão voltar */}
      <div className="p-8">
        <button 
          onClick={handleVoltar}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="text-sm font-medium">Add fornecedor</span>
        </button>
      </div>

      {/* Conteúdo centralizado */}
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="text-center max-w-3xl">
          {/* Grid de imagens */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            <div className="rounded-2xl overflow-hidden shadow-md">
              <img 
                src="/public/tea.png" 
                alt="Professional 1"
                className="w-full h-48 object-cover"
              />
            </div>
            <div className="rounded-2xl overflow-hidden shadow-md">
              <img 
                src="/public/Rectangle 1085.png" 
                alt="Professional 2"
                className="w-full h-48 object-cover"
              />
            </div>
            <div className="rounded-2xl overflow-hidden shadow-md">
              <img 
                src="/public/Rectangle 1086.png" 
                alt="Professional 3"
                className="w-full h-48 object-cover"
              />
            </div>
            <div className="rounded-2xl overflow-hidden shadow-md">
              <img 
                src="/public/Rectangle 1087.png" 
                alt="Professional 4"
                className="w-full h-48 object-cover"
              />
            </div>
          </div>

          {/* Título e descrição */}
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Cadastre um novo fornecedor!
          </h1>
          <p className="text-gray-600 text-lg mb-8">
            Vamos adicionar um novo fornecedor a sua base de dados.
          </p>

          {/* Botões */}
          <div className="flex items-center justify-center gap-4">
            <button 
              onClick={handleCancelar}
              className="px-8 py-3 border-2 border-[#44B16F] text-[#44B16F] rounded-lg font-medium hover:bg-[#44B16F]/5 transition-colors"
            >
              Cancelar
            </button>
            <button 
              onClick={handleComecar}
              className="px-8 py-3 bg-[#44B16F] text-white rounded-lg font-medium hover:bg-[#3a9d5f] transition-colors shadow-md"
            >
              Começar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}