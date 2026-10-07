import { useState } from 'react';
import { Check, X, UserPlus } from 'lucide-react';
import { ErrorState, StaleDataBanner } from './ui/StateViews';
import { assignmentRequestsAPI } from '../../services/api';
import { useAssignmentRequests, useInvalidate } from '../../hooks/queries';
import { queryKeys } from '../../lib/queryKeys';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../utils/apiHelpers';

/**
 * Pedidos de atribuição de processos à espera de decisão do administrador.
 *
 * Enquanto o pedido está pendente o técnico indicado NÃO tem acesso ao
 * processo — só a aprovação lho dá.
 */
export default function AprovacoesAtribuicao() {
    const toast = useToast();
    const invalidate = useInvalidate();

    const [aRejeitar, setARejeitar] = useState(null);
    const [motivo, setMotivo] = useState('');
    const [ocupado, setOcupado] = useState(false);

    const { data: pedidos = [], isLoading, isFetching, isError, error, refetch } = useAssignmentRequests();
    const temDados = pedidos.length > 0;

    const actualizar = () => Promise.all([
        refetch(),
        invalidate(queryKeys.assignments.all, queryKeys.quotationRequests.all),
    ]);

    const aprovar = async (pedido) => {
        setOcupado(true);
        try {
            const r = await assignmentRequestsAPI.approve(pedido.id);
            toast.success(r?.message || 'Atribuição aprovada.');
            await actualizar();
        } catch (err) {
            toast.error(getErrorMessage(err, 'Não foi possível aprovar o pedido.'));
        } finally {
            setOcupado(false);
        }
    };

    const rejeitar = async () => {
        if (!motivo.trim()) {
            toast.error('Indique o motivo da recusa.');
            return;
        }
        setOcupado(true);
        try {
            const r = await assignmentRequestsAPI.reject(aRejeitar.id, motivo.trim());
            toast.success(r?.message || 'Pedido rejeitado.');
            setARejeitar(null);
            setMotivo('');
            await actualizar();
        } catch (err) {
            toast.error(getErrorMessage(err, 'Não foi possível rejeitar o pedido.'));
        } finally {
            setOcupado(false);
        }
    };

    if (isLoading) {
        return <div className="text-center py-8" style={{ color: 'var(--color-text-secondary)' }}>A carregar pedidos pendentes...</div>;
    }

    if (isError && !temDados) {
        return (
            <ErrorState
                message={getErrorMessage(error, 'Erro ao carregar os pedidos de atribuição.')}
                onRetry={refetch}
                isRetrying={isFetching}
            />
        );
    }

    if (!temDados) {
        return (
            <div className="text-center py-12 flex flex-col items-center">
                <div className="w-16 h-16 text-green-500 rounded-full flex items-center justify-center mb-4" style={{ background: 'rgba(34,197,94,0.1)' }}>
                    <Check size={32} />
                </div>
                <h4 className="font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>Tudo em dia!</h4>
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    Não há pedidos de atribuição pendentes neste momento.
                </p>
            </div>
        );
    }

    return (
        <>
            {isError && <div className="mb-4"><StaleDataBanner onRetry={refetch} isRetrying={isFetching} /></div>}

            <div className="space-y-4">
                {pedidos.map((pedido) => {
                    const processo = pedido.quotation_request;
                    const referencia = processo?.reference_number || `#${pedido.quotation_request_id}`;

                    return (
                        <div
                            key={pedido.id}
                            className="rounded-xl p-4"
                            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
                        >
                            <div className="flex items-start gap-3">
                                <div className="p-2 rounded-lg text-blue-600 shrink-0" style={{ background: 'rgba(59,130,246,0.1)' }}>
                                    <UserPlus size={18} />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
                                        <strong>{pedido.requester?.name || 'Um técnico'}</strong> pede para juntar{' '}
                                        <strong>{pedido.user?.name || `#${pedido.user_id}`}</strong> ao processo{' '}
                                        <span className="font-mono text-xs">{referencia}</span>
                                    </p>

                                    {processo?.title && (
                                        <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                                            {processo.title}
                                        </p>
                                    )}

                                    {pedido.reason && (
                                        <p className="text-xs mt-2 italic" style={{ color: 'var(--color-text-secondary)' }}>
                                            “{pedido.reason}”
                                        </p>
                                    )}
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                    <button
                                        onClick={() => aprovar(pedido)}
                                        disabled={ocupado}
                                        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[#148742] text-white hover:bg-[#0f6631] disabled:opacity-50"
                                    >
                                        Aprovar
                                    </button>
                                    <button
                                        onClick={() => { setARejeitar(pedido); setMotivo(''); }}
                                        disabled={ocupado}
                                        className="px-3 py-1.5 text-xs font-medium rounded-lg border text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                                        style={{ borderColor: 'var(--color-border)' }}
                                    >
                                        Rejeitar
                                    </button>
                                </div>
                            </div>

                            {aRejeitar?.id === pedido.id && (
                                <div className="mt-3 pt-3 space-y-2" style={{ borderTop: '1px solid var(--color-border)' }}>
                                    <label className="block text-xs font-medium" style={{ color: 'var(--color-text-primary)' }}>
                                        Motivo da recusa <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        value={motivo}
                                        onChange={(e) => setMotivo(e.target.value)}
                                        rows={2}
                                        autoFocus
                                        className="w-full px-3 py-2 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#44B16F]"
                                        style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text-primary)' }}
                                    />
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() => { setARejeitar(null); setMotivo(''); }}
                                            disabled={ocupado}
                                            className="px-3 py-1.5 text-xs rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            onClick={rejeitar}
                                            disabled={ocupado || !motivo.trim()}
                                            className="px-3 py-1.5 text-xs rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 flex items-center gap-1.5"
                                        >
                                            <X size={13} />
                                            {ocupado ? 'A rejeitar...' : 'Confirmar recusa'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </>
    );
}
