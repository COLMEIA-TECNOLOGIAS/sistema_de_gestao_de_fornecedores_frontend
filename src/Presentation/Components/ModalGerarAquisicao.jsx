import { useModalLock } from '../../hooks/useModalLock';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ShoppingCart, Loader2, Calendar, CheckCircle, AlertTriangle } from 'lucide-react';

const getResponseDate = (res) => {
    const raw = res?.delivery_date || res?.expected_delivery_date;
    return raw ? String(raw).slice(0, 10) : '';
};

// Data de hoje no fuso horário local, no formato YYYY-MM-DD
const getToday = () => {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

/**
 * Formulário de decisão sobre uma proposta.
 *
 * - mode="approve" (por omissão): aprovar a proposta. Numa só operação o backend aprova,
 *   gera a aquisição, conclui a actividade e rejeita as restantes propostas em aberto.
 * - mode="acquisition": gerar a aquisição de uma proposta aprovada antes deste fluxo (dados antigos).
 *
 * onSubmit recebe { expected_delivery_date, justification, notes }.
 */
export default function ModalGerarAquisicao({ isOpen, onClose, onSubmit, isLoading, response, mode = 'approve', openCompetitors = 0 }) {
    const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
    const [justification, setJustification] = useState('');
    const [notes, setNotes] = useState('');

    useModalLock(isOpen);

    useEffect(() => {
        if (isOpen) {
            // Proposta com data já ultrapassada: obrigar a indicar uma nova data
            const supplierDate = getResponseDate(response);
            setExpectedDeliveryDate(supplierDate && supplierDate >= getToday() ? supplierDate : '');
            setJustification('');
            setNotes('');
        }
    }, [isOpen, response]);

    if (!isOpen) return null;

    const isApprove = mode === 'approve';

    // Não fechar a meio de um pedido (evita perder o resultado / duplo envio)
    const handleClose = () => {
        if (!isLoading) onClose();
    };

    const supplierDate = getResponseDate(response);
    const today = getToday();
    const isPastSupplierDate = supplierDate && supplierDate < today;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!expectedDeliveryDate || isLoading) return;
        onSubmit({
            expected_delivery_date: expectedDeliveryDate,
            justification: justification.trim(),
            notes: notes.trim(),
        });
    };

    const supplierName = response?.supplier?.company_name
        || response?.supplier?.commercial_name
        || response?.supplier?.legal_name
        || response?.supplier?.name
        || 'Fornecedor';

    const TitleIcon = isApprove ? CheckCircle : ShoppingCart;

    return createPortal(
        <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 9999 }}>
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Modal */}
            <div
                className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto"
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-decisao-proposta-title"
            >
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h3 id="modal-decisao-proposta-title" className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <TitleIcon className="text-[#44B16F]" size={20} />
                        {isApprove ? 'Aprovar Proposta' : 'Gerar Aquisição'}
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
                            {response.revision_number > 1 && (
                                <span className="ml-2 text-xs font-semibold text-gray-500">Revisão n.º {response.revision_number}</span>
                            )}
                            {response.total_amount != null && (
                                <span className="block text-sm font-bold text-green-700 mt-0.5">
                                    {parseFloat(response.total_amount).toLocaleString('pt-AO', { minimumFractionDigits: 2 })} AOA
                                </span>
                            )}
                        </div>
                    )}

                    {isApprove && (
                        <div className="rounded-xl p-3 text-sm bg-amber-50 border border-amber-200 text-amber-800">
                            <p className="font-semibold flex items-center gap-1.5 mb-1">
                                <AlertTriangle size={15} className="text-amber-600" />
                                Ao aprovar esta proposta:
                            </p>
                            <ul className="list-disc pl-5 space-y-0.5">
                                <li>é gerada a aquisição e a actividade fica concluída;</li>
                                {openCompetitors > 0 ? (
                                    <li>
                                        {openCompetitors === 1
                                            ? 'a outra proposta em aberto é rejeitada e o fornecedor é avisado por email;'
                                            : `as outras ${openCompetitors} propostas em aberto são rejeitadas e os fornecedores são avisados por email;`}
                                    </li>
                                ) : null}
                                <li>o fornecedor vencedor é avisado por email.</li>
                            </ul>
                            <p className="mt-1.5 font-medium">Esta decisão é definitiva.</p>
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <label htmlFor="decisao-data-entrega" className="text-sm font-bold text-gray-700 px-1 flex items-center gap-1.5">
                            <Calendar size={15} className="text-gray-400" />
                            Data de entrega prevista *
                        </label>
                        <input
                            id="decisao-data-entrega"
                            type="date"
                            value={expectedDeliveryDate}
                            min={today}
                            onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                            required
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#44B16F]/20 focus:border-[#44B16F] text-gray-700"
                        />
                        <p className="text-xs text-gray-500 px-1">
                            {!supplierDate && 'A proposta não indica data de entrega. Indique a data prevista.'}
                            {supplierDate && !isPastSupplierDate && 'Preenchida com a data indicada pelo fornecedor na proposta.'}
                            {isPastSupplierDate && `A data da proposta (${supplierDate.split('-').reverse().join('/')}) já passou. Indique uma nova data.`}
                        </p>
                    </div>

                    <div className="space-y-1.5">
                        <label htmlFor="decisao-justificacao" className="text-sm font-bold text-gray-700 px-1">Justificação</label>
                        <textarea
                            id="decisao-justificacao"
                            value={justification}
                            onChange={(e) => setJustification(e.target.value)}
                            placeholder="Justifique a escolha desta proposta (preço, prazo, qualidade...)"
                            rows="3"
                            maxLength={2000}
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#44B16F]/20 focus:border-[#44B16F] resize-none"
                        />
                    </div>

                    {isApprove && (
                        <div className="space-y-1.5">
                            <label htmlFor="decisao-notas" className="text-sm font-bold text-gray-700 px-1">Mensagem para o fornecedor</label>
                            <textarea
                                id="decisao-notas"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Opcional — incluída no email de aprovação"
                                rows="2"
                                maxLength={2000}
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#44B16F]/20 focus:border-[#44B16F] resize-none"
                            />
                        </div>
                    )}

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
                                <TitleIcon size={18} />
                            )}
                            {isLoading
                                ? (isApprove ? 'A aprovar...' : 'A gerar...')
                                : (isApprove ? 'Aprovar e gerar aquisição' : 'Gerar Aquisição')}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}
