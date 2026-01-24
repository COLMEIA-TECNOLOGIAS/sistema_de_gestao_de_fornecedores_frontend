import { useState } from 'react';
import { X, MessageSquare, Loader2 } from 'lucide-react';

export default function ModalSolicitarRevisao({ isOpen, onClose, onSubmit, isLoading }) {
    const [reason, setReason] = useState('Preço');
    const [message, setMessage] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({ reason, message });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <MessageSquare className="text-[#44B16F]" size={20} />
                        Solicitar Revisão
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-sm font-bold text-gray-700 px-1">Motivo</label>
                        <select
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#44B16F]/20 focus:border-[#44B16F]"
                        >
                            <option value="Preço">Preço</option>
                            <option value="Prazo">Prazo de Entrega</option>
                            <option value="Quantidade">Quantidade</option>
                            <option value="Especificações">Especificações Técnicas</option>
                            <option value="Outros">Outros</option>
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-bold text-gray-700 px-1">Mensagem</label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Descreva o que precisa ser revisto..."
                            required
                            rows="4"
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#44B16F]/20 focus:border-[#44B16F] resize-none"
                        />
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex-1 px-4 py-2.5 bg-[#44B16F] text-white font-bold rounded-xl hover:bg-[#368d58] transition-all shadow-lg shadow-[#44B16F]/20 flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <Loader2 size={18} className="animate-spin" />
                            ) : (
                                <MessageSquare size={18} />
                            )}
                            Solicitar Revisão
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
