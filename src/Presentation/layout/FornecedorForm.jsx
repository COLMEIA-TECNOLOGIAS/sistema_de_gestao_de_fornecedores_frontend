import { ArrowLeft, AlertCircle, FileText, CheckCircle } from "lucide-react";
import { useState, useEffect } from "react";

export default function FornecedorFormStep1() {
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadedFiles, setUploadedFiles] = useState([]);

  // Função para simular upload de arquivo
  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    if (files.length > 0) {
      const newFiles = files.map(file => ({
        name: file.name,
        type: file.type,
        size: file.size
      }));
      setUploadedFiles([...uploadedFiles, ...newFiles]);
    }
  };

  // Step 4 - Finalização
  if (currentStep === 4) {
    return (
      <div className="h-screen bg-[#F8FDF9] flex flex-col overflow-hidden">
        <div className="px-8 py-6">
          <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
            <ArrowLeft size={20} />
            <span className="text-sm font-medium">Add fornecedor</span>
          </button>
        </div>

        <div className="flex-1 flex items-center justify-center px-8">
          <div className="w-full max-w-5xl">
            {/* Stepper */}
            <div className="flex items-center justify-center mb-10">
              <div className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-[#44B16F] text-white flex items-center justify-center font-semibold mb-2">
                    1
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-semibold text-gray-900">Identificação</p>
                    <p className="text-xs text-gray-900">da Empresa</p>
                  </div>
                </div>

                <div className="w-32 h-0.5 bg-[#44B16F] mb-8 mx-2"></div>

                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-[#44B16F] text-white flex items-center justify-center font-semibold mb-2">
                    2
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-semibold text-gray-900">Documentos-Chave</p>
                  </div>
                </div>

                <div className="w-32 h-0.5 bg-[#44B16F] mb-8 mx-2"></div>

                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-[#44B16F] text-white flex items-center justify-center font-semibold mb-2">
                    3
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-semibold text-gray-900">Informações</p>
                    <p className="text-xs font-semibold text-gray-900">Comerciais</p>
                  </div>
                </div>

                <div className="w-32 h-0.5 bg-[#44B16F] mb-8 mx-2"></div>

                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-[#44B16F] text-white flex items-center justify-center font-semibold mb-2">
                    4
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-semibold text-gray-900">Finalizar</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Conteúdo de finalização */}
            <div className="bg-[#DAFFE9]/30 rounded-2xl p-10 mb-6 min-h-[480px] flex flex-col items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 bg-[#44B16F] rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle size={40} className="text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Novo fornecedor adicionado com sucesso!</h2>
                <p className="text-gray-600 mb-8">O fornecedor foi cadastrado no sistema e está pronto para uso.</p>
                <button className="px-10 py-3 bg-[#44B16F] text-white rounded-lg font-medium hover:bg-[#3a9d5f] transition-colors shadow-md">
                  Começar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 1 - Formulário de identificação
  if (currentStep === 1) {
    return (
      <div className="h-screen bg-[#F8FDF9] flex flex-col overflow-hidden">
        <div className="px-8 py-6">
          <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
            <ArrowLeft size={20} />
            <span className="text-sm font-medium">Add fornecedor</span>
          </button>
        </div>

        <div className="flex-1 flex items-center justify-center px-8">
          <div className="w-full max-w-5xl">
            {/* Stepper */}
            <div className="flex items-center justify-center mb-10">
              <div className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-[#44B16F] text-white flex items-center justify-center font-semibold mb-2">
                    1
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-semibold text-gray-900">Identificação</p>
                    <p className="text-xs text-gray-900">da Empresa</p>
                  </div>
                </div>

                <div className="w-32 h-0.5 bg-[#44B16F] mb-8 mx-2"></div>

                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center font-semibold mb-2">
                    2
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-medium text-gray-500">Documentos-Chave</p>
                  </div>
                </div>

                <div className="w-32 h-0.5 bg-gray-300 mb-8 mx-2"></div>

                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center font-semibold mb-2">
                    3
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-medium text-gray-400">Informações</p>
                    <p className="text-xs text-gray-400">Comerciais</p>
                  </div>
                </div>

                <div className="w-32 h-0.5 bg-gray-300 mb-8 mx-2"></div>

                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center font-semibold mb-2">
                    4
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-medium text-gray-400">Finalizar</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#DAFFE9]/30 rounded-2xl p-10 mb-6">
              <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome legal
                    </label>
                    <input
                      type="text"
                      placeholder="Crivian Van-dunem"
                      className="w-full px-4 py-3 bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#44B16F] focus:border-transparent"
                    />
                    <div className="flex items-center gap-1 mt-1.5 text-xs text-gray-500">
                      <AlertCircle size={12} />
                      <span>Empty text</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Província
                      </label>
                      <select className="w-full px-4 py-3 bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#44B16F] focus:border-transparent appearance-none cursor-pointer">
                        <option>Luanda</option>
                        <option>Benguela</option>
                      </select>
                      <div className="flex items-center gap-1 mt-1.5 text-xs text-gray-500">
                        <AlertCircle size={12} />
                        <span>Empty text</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Município
                      </label>
                      <select className="w-full px-4 py-3 bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#44B16F] focus:border-transparent appearance-none cursor-pointer">
                        <option>Viana</option>
                        <option>Luanda</option>
                      </select>
                      <div className="flex items-center gap-1 mt-1.5 text-xs text-gray-500">
                        <AlertCircle size={12} />
                        <span>Empty text</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      placeholder="exemplo@email.ao"
                      className="w-full px-4 py-3 bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#44B16F] focus:border-transparent"
                    />
                    <div className="flex items-center gap-1 mt-1.5 text-xs text-gray-500">
                      <AlertCircle size={12} />
                      <span>Empty text</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome Comercial
                    </label>
                    <input
                      type="text"
                      placeholder="Escreve alguma coisa"
                      className="w-full px-4 py-3 bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#44B16F] focus:border-transparent"
                    />
                    <div className="flex items-center gap-1 mt-1.5 text-xs text-gray-500">
                      <AlertCircle size={12} />
                      <span>Empty text</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nº Telefone
                    </label>
                    <input
                      type="tel"
                      placeholder="+244 923 456 789"
                      className="w-full px-4 py-3 bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#44B16F] focus:border-transparent"
                    />
                    <div className="flex items-center gap-1 mt-1.5 text-xs text-gray-500">
                      <AlertCircle size={12} />
                      <span>Empty text</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      placeholder="outro@email.ao"
                      className="w-full px-4 py-3 bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#44B16F] focus:border-transparent"
                    />
                    <div className="flex items-center gap-1 mt-1.5 text-xs text-gray-500">
                      <AlertCircle size={12} />
                      <span>Empty text</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <button className="px-10 py-3 border-2 border-[#44B16F] text-[#44B16F] rounded-lg font-medium hover:bg-[#44B16F]/5 transition-colors">
                Voltar
              </button>
              <button 
                onClick={() => setCurrentStep(2)}
                className="px-10 py-3 bg-[#44B16F] text-white rounded-lg font-medium hover:bg-[#3a9d5f] transition-colors shadow-md"
              >
                Avançar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 2 - Upload de documentos
  if (currentStep === 2) {
    return (
      <div className="h-screen bg-[#F8FDF9] flex flex-col overflow-hidden">
        <div className="px-8 py-6">
          <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
            <ArrowLeft size={20} />
            <span className="text-sm font-medium">Add fornecedor</span>
          </button>
        </div>

        <div className="flex-1 flex items-center justify-center px-8">
          <div className="w-full max-w-5xl">
            {/* Stepper */}
            <div className="flex items-center justify-center mb-10">
              <div className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-[#44B16F] text-white flex items-center justify-center font-semibold mb-2">
                    1
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-semibold text-gray-900">Identificação</p>
                    <p className="text-xs text-gray-900">da Empresa</p>
                  </div>
                </div>

                <div className="w-32 h-0.5 bg-[#44B16F] mb-8 mx-2"></div>

                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-[#44B16F] text-white flex items-center justify-center font-semibold mb-2">
                    2
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-semibold text-gray-900">Documentos-Chave</p>
                  </div>
                </div>

                <div className="w-32 h-0.5 bg-gray-300 mb-8 mx-2"></div>

                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center font-semibold mb-2">
                    3
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-medium text-gray-400">Informações</p>
                    <p className="text-xs text-gray-400">Comerciais</p>
                  </div>
                </div>

                <div className="w-32 h-0.5 bg-gray-300 mb-8 mx-2"></div>

                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center font-semibold mb-2">
                    4
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-medium text-gray-400">Finalizar</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Área de upload */}
            <div className="bg-[#DAFFE9]/30 rounded-2xl p-10 mb-6 min-h-[480px] flex flex-col">
              {/* Zona de arrastar arquivo */}
              <label className="border-2 border-dashed border-[#44B16F]/40 rounded-xl p-12 text-center bg-white/50 cursor-pointer hover:bg-white/70 transition-colors">
                <input 
                  type="file" 
                  className="hidden" 
                  multiple
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={handleFileUpload}
                />
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-[#44B16F]/10 rounded-lg flex items-center justify-center">
                    <FileText size={32} className="text-[#44B16F]" />
                  </div>
                </div>
                <p className="text-gray-600 mb-1">
                  Arraste aqui o seu arquivo ou clique em <span className="text-gray-900 font-semibold">Carregar.</span>
                </p>
                <p className="text-sm text-gray-400">Tamanho máximo do arquivo: 45MB</p>
              </label>

              {/* Documentos carregados */}
              {uploadedFiles.length > 0 && (
                <>
                  <p className="text-center text-gray-400 text-sm my-4">
                    {uploadedFiles.length} documento(s) carregado(s)
                  </p>

                  <div className="grid grid-cols-2 gap-4">
                    {uploadedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 rounded-lg bg-[#44B16F]/10 border-2 border-[#44B16F]"
                      >
                        <div className="flex items-center gap-3">
                          <FileText size={20} className="text-[#44B16F]" />
                          <span className="text-sm text-[#44B16F] font-medium">
                            {file.name}
                          </span>
                        </div>
                        <CheckCircle size={20} className="text-[#44B16F]" />
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Botões sempre visíveis */}
            <div className="flex items-center justify-between">
              <button 
                onClick={() => setCurrentStep(1)}
                className="px-10 py-3 border-2 border-[#44B16F] text-[#44B16F] rounded-lg font-medium hover:bg-[#44B16F]/5 transition-colors"
              >
                Voltar
              </button>
              <button 
                onClick={() => setCurrentStep(3)}
                className="px-10 py-3 bg-[#44B16F] text-white rounded-lg font-medium hover:bg-[#3a9d5f] transition-colors shadow-md"
              >
                Avançar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 3 - Informações Comerciais
  return (
    <div className="h-screen bg-[#F8FDF9] flex flex-col overflow-hidden">
      <div className="px-8 py-6">
        <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
          <ArrowLeft size={20} />
          <span className="text-sm font-medium">Add fornecedor</span>
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center px-8">
        <div className="w-full max-w-5xl">
          {/* Stepper */}
          <div className="flex items-center justify-center mb-10">
            <div className="flex items-center">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-[#44B16F] text-white flex items-center justify-center font-semibold mb-2">
                  1
                </div>
                <div className="text-center">
                  <p className="text-xs font-semibold text-gray-900">Identificação</p>
                  <p className="text-xs text-gray-900">da Empresa</p>
                </div>
              </div>

              <div className="w-32 h-0.5 bg-[#44B16F] mb-8 mx-2"></div>

              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-[#44B16F] text-white flex items-center justify-center font-semibold mb-2">
                  2
                </div>
                <div className="text-center">
                  <p className="text-xs font-semibold text-gray-900">Documentos-Chave</p>
                </div>
              </div>

              <div className="w-32 h-0.5 bg-[#44B16F] mb-8 mx-2"></div>

              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-[#44B16F] text-white flex items-center justify-center font-semibold mb-2">
                  3
                </div>
                <div className="text-center">
                  <p className="text-xs font-semibold text-gray-900">Informações</p>
                  <p className="text-xs font-semibold text-gray-900">Comerciais</p>
                </div>
              </div>

              <div className="w-32 h-0.5 bg-gray-300 mb-8 mx-2"></div>

              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center font-semibold mb-2">
                  4
                </div>
                <div className="text-center">
                  <p className="text-xs font-medium text-gray-400">Finalizar</p>
                </div>
              </div>
            </div>
          </div>

          {/* Formulário de Informações Comerciais */}
          <div className="bg-[#DAFFE9]/30 rounded-2xl p-10 mb-6">
            <div className="grid grid-cols-2 gap-x-8 gap-y-6">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Capacidade de fornecimento
                  </label>
                  <input
                    type="text"
                    placeholder="sua empresa"
                    className="w-full px-4 py-3 bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#44B16F] focus:border-transparent"
                  />
                  <div className="flex items-center gap-1 mt-1.5 text-xs text-gray-500">
                    <AlertCircle size={12} />
                    <span>Empty text</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tempo médio de entrega
                  </label>
                  <select className="w-full px-4 py-3 bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#44B16F] focus:border-transparent appearance-none cursor-pointer">
                    <option>Selecionar tempo...</option>
                    <option>1-2 dias</option>
                    <option>3-5 dias</option>
                    <option>1 semana</option>
                    <option>2 semanas</option>
                    <option>1 mês</option>
                  </select>
                  <div className="flex items-center gap-1 mt-1.5 text-xs text-gray-500">
                    <AlertCircle size={12} />
                    <span>Empty text</span>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    O que a empresa fornece?
                  </label>
                  <input
                    type="text"
                    placeholder="Descreva os produtos/serviços"
                    className="w-full px-4 py-3 bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#44B16F] focus:border-transparent"
                  />
                  <div className="flex items-center gap-1 mt-1.5 text-xs text-gray-500">
                    <AlertCircle size={12} />
                    <span>Empty text</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Botões sempre visíveis */}
          <div className="flex items-center justify-between">
            <button 
              onClick={() => setCurrentStep(2)}
              className="px-10 py-3 border-2 border-[#44B16F] text-[#44B16F] rounded-lg font-medium hover:bg-[#44B16F]/5 transition-colors"
            >
              Voltar
            </button>
            <button 
              onClick={() => setCurrentStep(4)}
              className="px-10 py-3 bg-[#44B16F] text-white rounded-lg font-medium hover:bg-[#3a9d5f] transition-colors shadow-md"
            >
              Avançar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}