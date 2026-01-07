import { useState } from "react";
import { X, UserPlus } from "lucide-react";
import ModalLinkExterno from "./ModalLinkExterno";

export default function ModalCadastroFornecedor({ isOpen, onClose }) {
    const [isLinkExternoOpen, setIsLinkExternoOpen] = useState(false);

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden animate-fadeIn">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-200">
                        <button
                            onClick={onClose}
                            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            <span className="text-sm font-medium">Voltar</span>
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-12 text-center">
                        {/* Icon */}
                        <div className="flex justify-center mb-6">
                            <div className="relative p-4 bg-[#44B16F]/10 rounded-full">
                                <UserPlus className="w-20 h-20 text-[#44B16F]" strokeWidth={1.5} />
                            </div>
                        </div>

                        {/* Title */}
                        <h2 className="text-3xl font-bold text-gray-900 mb-3">
                            Cadastrar um novo fornecedor
                        </h2>

                        {/* Subtitle */}
                        <p className="text-gray-600 mb-10">
                            Seleciona a forma de cadastro que pretende prosseguir.
                        </p>

                        {/* Buttons */}
                        <div className="flex gap-4 justify-center">
                            <button className="px-8 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">
                                Cadastro Directo
                            </button>
                            <button
                                onClick={() => setIsLinkExternoOpen(true)}
                                className="px-8 py-3 bg-[#44B16F] text-white rounded-lg hover:bg-[#3a9d5f] transition-colors font-medium"
                            >
                                Enviar link externo
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal Link Externo */}
            <ModalLinkExterno
                isOpen={isLinkExternoOpen}
                onClose={() => setIsLinkExternoOpen(false)}
            />
        </>
    );
}
