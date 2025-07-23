import { useState } from "react";
import Button from "./Button";
import Input from "./Input";
import SuccessModal from "../SucessModal";


export default function ForgetPasswordModal({ onClose }) {
  const [email, setEmail] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setShowSuccess(true);
    } catch (error) {
      console.error("Erro ao enviar email:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Modal principal de recuperação */}
      {!showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
            onClick={onClose}
          />
          
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Recupere sua senha</h2>
              <p className="text-gray-600 mb-6">
                Adicione seu email para enviarmos o link de recuperação
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
                <Input
                  label="Email"
                  type="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                />

                <div className="flex gap-4">
                
                  <Button
                    type="submit"
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="inline-flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Enviando...
                      </span>
                    ) : (
                      "Enviar "
                    )}
                  </Button>

                    <Button
                    type="button"
                    onClick={onClose}
                    className="flex-1 bg-gray-100 text-gray-800 hover:bg-gray-200"
                    disabled={isLoading}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de sucesso */}
      {showSuccess && (
        <SuccessModal 
          onClose={() => {
            setShowSuccess(false);
            onClose(); 
          }} 
          email={email}
        />
      )}
    </>
  );
}