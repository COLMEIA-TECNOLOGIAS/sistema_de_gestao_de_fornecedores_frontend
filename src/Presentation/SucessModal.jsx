import Button from "./Components/Button";
import { useNavigate } from "react-router-dom";

export default function SuccessModal({ onClose, email }) {
  const navigate = useNavigate();

  const handleCompletion = () => {
    onClose(); 
    navigate('./register'); 
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="success-modal-title"
    >
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden transform transition-all">
        <div className="p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-50 mb-5 animate-pulse">
            <svg
              className="h-8 w-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          <h2 
            id="success-modal-title"
            className="text-2xl font-bold text-gray-900 mb-3 leading-tight"
          >
            Link enviado com sucesso!
          </h2>
          
          <div className="mb-6">
            <p className="text-gray-600">
              Verifique sua caixa de entrada em:
            </p>
            <p className="font-medium text-gray-900 text-lg mt-1 px-4 py-2 bg-gray-50 rounded-lg inline-block">
              {email}
            </p>
            <p className="text-gray-500 text-sm mt-3">
              Caso não encontre, verifique sua pasta de spam.
            </p>
          </div>

          <div className="border-t border-gray-100 pt-6">
            <Button
              onClick={handleCompletion}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 text-lg"
              aria-label="Ir para redefinição de senha"
            >
              Concluído
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}