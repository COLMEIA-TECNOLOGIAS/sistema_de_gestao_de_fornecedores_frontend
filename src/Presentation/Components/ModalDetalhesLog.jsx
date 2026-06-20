import { useModalLock } from '../../hooks/useModalLock';
import { createPortal } from 'react-dom';
import { X, Calendar, Activity, Info } from 'lucide-react';

export default function ModalDetalhesLog({ isOpen, onClose, log }) {
    useModalLock(isOpen);

    if (!isOpen || !log) return null;

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('pt-AO', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        });
    };

    const formatDetails = (details) => {
        if (!details) return null;
        try {
            const parsed = typeof details === 'string' ? JSON.parse(details) : details;
            return JSON.stringify(parsed, null, 2);
        } catch (e) {
            return String(details);
        }
    };

    return createPortal(
        <div className="fixed inset-0 flex items-center justify-center z-[9999]">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative rounded-2xl shadow-2xl w-full max-w-2xl mx-4 animate-fadeIn flex flex-col max-h-[90vh]" style={{ background: 'var(--color-surface)' }}>
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-blue-600 bg-blue-50">
                            <Info size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>Detalhes do Evento</h2>
                            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>ID: #{log.id}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg transition-colors hover:bg-gray-100"
                        style={{ color: 'var(--color-text-secondary)' }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="px-6 py-6 overflow-y-auto flex-1 space-y-6">
                    {/* Resumo do Evento */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border-light)' }}>
                            <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-muted)' }}>Utilizador</p>
                            <p className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>
                                {log.user?.name || 'Desconhecido'}
                            </p>
                            {log.user?.email && (
                                <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                                    {log.user.email}
                                </p>
                            )}
                        </div>
                        <div className="p-4 rounded-xl" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border-light)' }}>
                            <p className="text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1" style={{ color: 'var(--color-text-muted)' }}>
                                <Calendar size={12} />
                                Data e Hora
                            </p>
                            <p className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>
                                {formatDate(log.created_at)}
                            </p>
                        </div>
                    </div>

                    {/* Descrição */}
                    <div>
                        <h3 className="text-sm font-bold mb-2 flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
                            <Activity size={16} className="text-[#44B16F]" />
                            {log.event}
                        </h3>
                        <p className="text-sm p-4 rounded-lg leading-relaxed" style={{ background: 'var(--color-bg)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border-light)' }}>
                            {log.description}
                        </p>
                    </div>

                    {/* Dados Técnicos / JSON */}
                    {log.details && (
                        <div>
                            <h3 className="text-sm font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                                Dados Adicionais (JSON)
                            </h3>
                            <div className="rounded-lg overflow-hidden border" style={{ borderColor: 'var(--color-border-light)' }}>
                                <pre className="p-4 text-xs overflow-x-auto whitespace-pre-wrap bg-gray-50 text-gray-800" style={{ maxHeight: '300px' }}>
                                    <code>{formatDetails(log.details)}</code>
                                </pre>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 flex justify-end" style={{ borderTop: '1px solid var(--color-border-light)' }}>
                    <button
                        onClick={onClose}
                        className="px-6 py-2 rounded-lg font-medium text-sm transition-colors text-gray-700 bg-gray-100 hover:bg-gray-200"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
