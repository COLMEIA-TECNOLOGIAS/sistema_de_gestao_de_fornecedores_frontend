import { useModalLock } from '../../hooks/useModalLock';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ShoppingCart, Loader2, Calendar } from 'lucide-react';

const getResponseDate = (res) => {
    const raw = res?.delivery_date || res?.expected_delivery_date;
    return raw ? String(raw).slice(0, 10) : '';
};

// Data mínima (amanhã) no fuso horário local, no formato YYYY-MM-DD
const getMinDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export default function ModalGerarAquisicao({ isOpen, onClose, onSubmit, isLoading, response }) {
    const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
    const [justification, setJustification] = useState('');

    useModalLock(isOpen);

    useEffect(() => {
        if (isOpen) {
            setExpectedDeliveryDate(getResponseDate(response));
            setJustification('');
        }
    }, [isOpen, response]);

    if (!isOpen) return null;

    // Não fechar a meio de um pedido (evita perder o resultado / duplo envio)
    const handleClose = () => {
        if (!isLoading) onClose();
    };

    // A data vem da proposta do fornecedor; se não vier, o utilizador tem de a indicar
    const supplierDate = getResponseDate(response);
    const minDate = getMinDate();

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!expectedDeliveryDate || isLoading) return;
        onSubmit({ expected_delivery_date: expectedDeliveryDate, justification: justification.trim() });
    };

    const supplierName = response?.supplier?.company_name
        || response?.supplier?.commercial_name
        || response?.supplier?.legal_name
        || response?.supplier?.name
        || 'Fornecedor';

    return createPortal(
        <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 9999 }}>
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <ShoppingCart className="text-[#44B16F]" size={20} />
                        Gerar Aquisição
                    </h3>
                    <button
                        onClick={handleClose}
                        disabled={isLoading}
                        aria-label="Fechar"
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Proposta vencedora */}
                    {response && (
                        <div className="p-3 rounded-xl border border-green-100" style={{ background: 'rgba(68,177,111,0.08)' }}>
                            <span className="text-xs font-semibold uppercase tracking-wider text-green-700 block mb-0.5">Proposta vencedora</span>
                            <span className="text-sm font-bold text-gray-900">{supplierName}</span>
                            {response.total_amount != null && (
                                <span className="block text-sm font-bold text-green-700 mt-0.5">
                                    {parseFloat(response.total_amount).toLocaleString('pt-AO', { minimumFractionDigits: 2 })} AOA
                                </span>
                            )}
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <label className="text-sm font-bold text-gray-700 px-1 flex items-center gap-1.5">
                            <Calendar size={15} className="text-gray-400" />
                            Data de entrega prevista *
                        </label>
                        <input
                            type="date"
                            value={expectedDeliveryDate}
                            min={supplierDate ? undefined : minDate}
                            onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                            required
                            readOnly={!!supplierDate}
                            className={supplierDate
                                ? "w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl focus:outline-none text-gray-700 cursor-not-allowed"
                                : "w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#44B16F]/20 focus:border-[#44B16F] text-gray-700"}
                        />
                        <p className="text-xs text-gray-500 px-1">
                            {supplierDate
                                ? 'Data definida pelo fornecedor na proposta.'
                                : 'A proposta não indica data de entrega. Indique a data prevista.'}
                        </p>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-bold text-gray-700 px-1">Justificação</label>
                        <textarea
                            value={justification}
                            onChange={(e) => setJustification(e.target.value)}
                            placeholder="Justifique a escolha desta proposta (preço, prazo, qualidade...)"
                            rows="3"
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#44B16F]/20 focus:border-[#44B16F] resize-none"
                        />
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={isLoading}
                            className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading || !expectedDeliveryDate}
                            className="flex-1 px-4 py-2.5 bg-[#44B16F] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold rounded-xl hover:bg-[#368d58] transition-all shadow-lg shadow-[#44B16F]/20 flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <Loader2 size={18} className="animate-spin" />
                            ) : (
                                <ShoppingCart size={18} />
                            )}
                            {isLoading ? 'A gerar...' : 'Gerar Aquisição'}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}
