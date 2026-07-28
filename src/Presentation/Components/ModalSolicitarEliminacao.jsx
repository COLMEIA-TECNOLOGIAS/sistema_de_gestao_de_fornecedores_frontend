import React, { useState } from 'react';
import { X, AlertTriangle, Send } from 'lucide-react';

export default function ModalSolicitarEliminacao({ isOpen, onClose, onSubmit, itemName, itemTypeLabel }) {
    const [reason, setReason] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!reason.trim()) return;

        setIsSubmitting(true);
        try {
            await onSubmit(reason);
            setReason("");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative rounded-2xl shadow-2xl w-full max-w-lg mx-4 flex flex-col overflow-hidden animate-fadeIn" style={{ background: 'var(--color-surface)' }}>
                
                {/* Header */}
                <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg text-red-500" style={{ background: 'rgba(239,68,68,0.1)' }}>
                            <AlertTriangle size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg" style={{ color: 'var(--color-text-primary)' }}>Solicitar Eliminação</h3>
                            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Pedido de aprovação ao administrador.</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="p-6" style={{ background: 'var(--color-bg)' }}>
                    <div className="mb-4 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                        Está prestes a solicitar a eliminação de <strong style={{ color: 'var(--color-text-primary)' }}>{itemName}</strong> ({itemTypeLabel}). 
                        Por favor, informe o motivo para que o administrador possa avaliar o seu pedido.
                    </div>

                    <div className="space-y-1.5">
                        <label className="block text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Motivo da Eliminação <span className="text-red-500">*</span></label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Descreva brevemente por que este registo deve ser eliminado..."
                            className="w-full p-3 border rounded-xl text-sm focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all resize-none h-28"
                            style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                            required
                        />
                    </div>

                    {/* Footer / Actions */}
                    <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-semibold rounded-lg transition-colors border"
                            style={{ background: 'transparent', borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-bg)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={!reason.trim() || isSubmitting}
                            className="px-4 py-2 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Send size={16} />
                            )}
                            Enviar Solicitação
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
