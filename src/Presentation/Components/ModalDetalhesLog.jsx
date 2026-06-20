import { useMemo } from 'react';
import { useModalLock } from '../../hooks/useModalLock';
import { createPortal } from 'react-dom';
import { X, Calendar, Activity, Info } from 'lucide-react';

export default function ModalDetalhesLog({ isOpen, onClose, log }) {
    // ✅ ALL HOOKS must be called BEFORE any conditional returns
    useModalLock(isOpen);

    const parsedDetails = useMemo(() => {
        if (!log?.details) return null;
        try {
            return typeof log.details === 'string' ? JSON.parse(log.details) : log.details;
        } catch (e) {
            return { raw: String(log.details) };
        }
    }, [log]);

    // ✅ Now safe to do conditional return after all hooks
    if (!isOpen || !log) return null;

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return String(dateString);
            return date.toLocaleString('pt-AO', {
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit', second: '2-digit'
            });
        } catch (e) {
            return String(dateString);
        }
    };

    const renderObjectGrid = (obj) => {
        if (!obj || typeof obj !== 'object') return <span className="text-sm">{String(obj)}</span>;

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                {Object.entries(obj).map(([key, value]) => {
                    const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

                    if (value && typeof value === 'object' && !Array.isArray(value)) {
                        return (
                            <div key={key} className="col-span-1 md:col-span-2 mt-2">
                                <h4 className="text-[10px] font-bold uppercase tracking-widest mb-3 pb-1"
                                    style={{ color: 'var(--color-text-muted)', borderBottom: '1px solid var(--color-border-light)' }}>
                                    {formattedKey}
                                </h4>
                                <div className="p-4 rounded-xl" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border-light)' }}>
                                    {renderObjectGrid(value)}
                                </div>
                            </div>
                        );
                    }

                    let displayValue;
                    if (Array.isArray(value)) {
                        try { displayValue = value.map(v => typeof v === 'object' ? JSON.stringify(v) : String(v)).join(', '); }
                        catch (e) { displayValue = 'Array'; }
                    } else if (typeof value === 'boolean') {
                        displayValue = value ? 'Sim' : 'Não';
                    } else if (value === null || value === undefined) {
                        displayValue = '-';
                    } else if (typeof value === 'object') {
                        try { displayValue = JSON.stringify(value); }
                        catch (e) { displayValue = 'Objeto Complexo'; }
                    } else {
                        displayValue = String(value);
                    }

                    const isUrl = typeof displayValue === 'string' && displayValue.startsWith('http');

                    return (
                        <div key={key} className="flex flex-col border-b pb-2" style={{ borderColor: 'var(--color-border-light)' }}>
                            <span className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: 'var(--color-text-muted)' }}>
                                {formattedKey}
                            </span>
                            {isUrl ? (
                                <a href={displayValue} target="_blank" rel="noopener noreferrer"
                                    className="text-sm font-semibold text-[#44B16F] hover:underline truncate"
                                    title={displayValue}>
                                    Ver Link
                                </a>
                            ) : (
                                <span className="text-sm font-semibold break-words" style={{ color: 'var(--color-text-primary)' }}>
                                    {displayValue}
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    return createPortal(
        <div className="fixed inset-0 flex items-center justify-center z-[9999]">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity" onClick={onClose} />

            {/* Modal */}
            <div className="relative rounded-2xl shadow-2xl w-full max-w-2xl mx-4 animate-fadeIn flex flex-col max-h-[90vh]"
                style={{ background: 'var(--color-surface)' }}>

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
                    <button onClick={onClose} className="p-2 rounded-lg transition-colors hover:bg-gray-100"
                        style={{ color: 'var(--color-text-secondary)' }}>
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="px-6 py-6 overflow-y-auto flex-1 space-y-6">
                    {/* Utilizador + Data */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border-light)' }}>
                            <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-muted)' }}>Utilizador</p>
                            <p className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>
                                {log.user?.name ? String(log.user.name) : 'Desconhecido'}
                            </p>
                            {log.user?.email && (
                                <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                                    {String(log.user.email)}
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

                    {/* Evento + Descrição */}
                    <div>
                        <h3 className="text-sm font-bold mb-2 flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
                            <Activity size={16} className="text-[#44B16F]" />
                            {log.event ? String(log.event) : 'Evento'}
                        </h3>
                        <p className="text-sm p-4 rounded-lg leading-relaxed"
                            style={{ background: 'var(--color-bg)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border-light)' }}>
                            {log.description ? String(log.description) : 'Sem descrição'}
                        </p>
                    </div>

                    {/* Dados Adicionais */}
                    {parsedDetails && Object.keys(parsedDetails).length > 0 && (
                        <div>
                            <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--color-text-primary)' }}>
                                Dados Adicionais
                            </h3>
                            <div className="p-5 rounded-xl border" style={{ borderColor: 'var(--color-border-light)', background: 'var(--color-surface)' }}>
                                {renderObjectGrid(parsedDetails)}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 flex justify-end" style={{ borderTop: '1px solid var(--color-border-light)' }}>
                    <button onClick={onClose}
                        className="px-6 py-2 rounded-lg font-medium text-sm transition-colors text-gray-700 bg-gray-100 hover:bg-gray-200">
                        Fechar
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
