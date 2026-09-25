import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Truck, Loader2, Calendar } from 'lucide-react';
import { useModalLock } from '../../hooks/useModalLock';
import { useInvalidate } from '../../hooks/queries';
import { queryKeys } from '../../lib/queryKeys';
import { acquisitionsAPI } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../utils/apiHelpers';
import {
    getAcquisitionReference,
    getSupplierDisplayName,
    getDeliveryDeadlineInfo,
    DEADLINE_TONE_CLASSES,
    todayISO,
} from '../../utils/acquisitions';

const formatDate = (value) => {
    if (!value) return '—';
    const d = new Date(String(value).length <= 10 ? `${value}T00:00:00` : value);
    return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('pt-PT');
};

/**
 * Confirmação de entrega de uma aquisição (usado no Painel, nas Aquisições e no modal de propostas).
 * Pede a data real da entrega (por omissão, hoje), confirma na API e actualiza todas as páginas.
 */
export default function ModalConfirmarEntrega({ acquisition, activityTitle, isOpen, onClose, onConfirmed }) {
    const toast = useToast();
    const invalidate = useInvalidate();
    const [deliveryDate, setDeliveryDate] = useState(todayISO());
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    useModalLock(isOpen);

    useEffect(() => {
        if (isOpen) {
            setDeliveryDate(todayISO());
            setError(null);
        }
    }, [isOpen, acquisition?.id]);

    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e) => {
            if (e.key === 'Escape' && !isSubmitting) onClose();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [isOpen, isSubmitting, onClose]);

    if (!isOpen || !acquisition) return null;

    const deadline = getDeliveryDeadlineInfo(acquisition);
    const title = activityTitle || acquisition.quotation_request?.title;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting || !deliveryDate) return;
        setIsSubmitting(true);
        setError(null);
        try {
            await acquisitionsAPI.confirmDelivery(acquisition.id, deliveryDate);
            toast.success(`Entrega da aquisição ${getAcquisitionReference(acquisition)} confirmada.`);
            invalidate(
                queryKeys.acquisitions.all,
                queryKeys.quotationResponses.all,
                queryKeys.quotationRequests.all,
                queryKeys.dashboard.all,
                queryKeys.reports.all,
                queryKeys.notifications.all
            );
            onConfirmed?.(acquisition);
            onClose();
        } catch (err) {
            setError(getErrorMessage(err, 'Erro ao confirmar a entrega.'));
        } finally {
            setIsSubmitting(false);
        }
    };

    return createPortal(
        <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 10000 }}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !isSubmitting && onClose()} />

            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="confirmar-entrega-title"
                className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 animate-modalFadeIn"
            >
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h3 id="confirmar-entrega-title" className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Truck className="text-orange-600" size={20} />
                        Confirmar Entrega
                    </h3>
                    <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        aria-label="Fechar"
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-1.5 text-sm">
                        <div className="flex items-center justify-between gap-3">
                            <span className="font-bold text-gray-900">{getAcquisitionReference(acquisition)}</span>
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${DEADLINE_TONE_CLASSES[deadline.tone]}`}>
                                {deadline.label}
                            </span>
                        </div>
                        {title && <p className="text-gray-700">{title}</p>}
                        <p className="text-gray-500">
                            Fornecedor: <span className="font-medium text-gray-700">{getSupplierDisplayName(acquisition.supplier) || '—'}</span>
                        </p>
                        <p className="text-gray-500">
                            Entrega prevista: <span className="font-medium text-gray-700">{formatDate(acquisition.expected_delivery_date)}</span>
                        </p>
                    </div>

                    <div className="space-y-1.5">
                        <label htmlFor="data-entrega-real" className="text-sm font-bold text-gray-700 px-1 flex items-center gap-1.5">
                            <Calendar size={15} className="text-gray-400" />
                            Data em que foi entregue *
                        </label>
                        <input
                            id="data-entrega-real"
                            type="date"
                            value={deliveryDate}
                            max={todayISO()}
                            onChange={(e) => setDeliveryDate(e.target.value)}
                            required
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#44B16F]/20 focus:border-[#44B16F] text-gray-700"
                        />
                        <p className="text-xs text-gray-500 px-1">
                            A aquisição fica concluída e a actividade passa para as Actividades Concluídas.
                        </p>
                    </div>

                    {error && (
                        <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{error}</p>
                    )}

                    <div className="pt-2 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || !deliveryDate}
                            className="flex-1 px-4 py-2.5 bg-[#44B16F] disabled:opacity-60 text-white font-bold rounded-xl hover:bg-[#368d58] transition-all flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Truck size={18} />}
                            {isSubmitting ? 'A confirmar...' : 'Confirmar entrega'}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}
