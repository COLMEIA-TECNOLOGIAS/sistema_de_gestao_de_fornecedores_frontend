import { useMemo, useState } from 'react';
import { UserPlus, X, Clock, ShieldCheck, Trash2, AlertCircle } from 'lucide-react';
import { processAssignmentsAPI } from '../../services/api';
import { useProcessAssignments, useTechnicians, useInvalidate } from '../../hooks/queries';
import { queryKeys } from '../../lib/queryKeys';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../utils/apiHelpers';

/**
 * Equipa de um processo de aquisição.
 *
 * Quem vê o processo são o criador, os técnicos com atribuição activa e os
 * administradores. Juntar alguém só o criador pode pedir (fica pendente até um
 * administrador aprovar) — o administrador atribui directamente.
 */
export default function EquipaProcesso({ quotationRequest }) {
    const id = quotationRequest?.id;
    const { user, isAdmin } = useAuth();
    const toast = useToast();
    const invalidate = useInvalidate();

    const [aJuntar, setAJuntar] = useState(false);
    const [tecnicoEscolhido, setTecnicoEscolhido] = useState('');
    const [justificacao, setJustificacao] = useState('');
    const [ocupado, setOcupado] = useState(false);

    const { data, isLoading, isError, error, refetch } = useProcessAssignments(id);
    const { data: tecnicos = [] } = useTechnicians({ enabled: aJuntar });

    const criador = data?.creator || quotationRequest?.user || null;
    const atribuicoes = useMemo(() => data?.data || [], [data]);

    const activas = atribuicoes.filter((a) => a.status === 'active');
    const pendentes = atribuicoes.filter((a) => a.status === 'pending');

    // Só o criador pode pedir; o administrador atribui sem pedir.
    const ehCriador = !!user && !!criador && Number(criador.id) === Number(user.id);
    const podeJuntar = isAdmin || ehCriador;

    // Quem já está no processo não deve aparecer no selector.
    const jaNoProcesso = new Set([
        ...(criador ? [Number(criador.id)] : []),
        ...activas.map((a) => Number(a.user_id)),
        ...pendentes.map((a) => Number(a.user_id)),
    ]);
    const elegiveis = tecnicos.filter((t) => !jaNoProcesso.has(Number(t.id)));

    const juntar = async () => {
        if (!tecnicoEscolhido) return;
        if (!isAdmin && !justificacao.trim()) {
            toast.error('Indique a justificação do pedido.');
            return;
        }

        setOcupado(true);
        try {
            const r = await processAssignmentsAPI.create(id, {
                user_id: Number(tecnicoEscolhido),
                reason: justificacao.trim() || undefined,
            });
            toast.success(r?.message || 'Pedido enviado.');
            setAJuntar(false);
            setTecnicoEscolhido('');
            setJustificacao('');
            await Promise.all([refetch(), invalidate(queryKeys.assignments.all)]);
        } catch (err) {
            toast.error(getErrorMessage(err, 'Não foi possível atribuir o processo.'));
        } finally {
            setOcupado(false);
        }
    };

    const retirar = async (atribuicao) => {
        setOcupado(true);
        try {
            const r = await processAssignmentsAPI.revoke(id, atribuicao.id);
            toast.success(r?.message || 'Atribuição retirada.');
            await Promise.all([refetch(), invalidate(queryKeys.assignments.all)]);
        } catch (err) {
            toast.error(getErrorMessage(err, 'Não foi possível retirar a atribuição.'));
        } finally {
            setOcupado(false);
        }
    };

    // Retirar: administrador, criador, ou o próprio que está atribuído.
    const podeRetirar = (a) => isAdmin || ehCriador || Number(a.user_id) === Number(user?.id);

    if (!id) return null;

    return (
        <div className="border-b pb-5 mb-5" style={{ borderColor: 'var(--color-border)' }}>
            <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                    Equipa do processo
                </h4>
                {podeJuntar && !aJuntar && (
                    <button
                        onClick={() => setAJuntar(true)}
                        disabled={ocupado}
                        className="flex items-center gap-1.5 text-xs font-medium text-[#148742] hover:underline disabled:opacity-50"
                    >
                        <UserPlus size={14} />
                        Juntar técnico
                    </button>
                )}
            </div>

            {isLoading && <p className="text-xs text-gray-400">A carregar a equipa...</p>}

            {isError && (
                <div className="flex items-center gap-2 text-xs text-red-600">
                    <AlertCircle size={14} />
                    {getErrorMessage(error, 'Falha ao carregar a equipa.')}
                    <button onClick={() => refetch()} className="underline">tentar de novo</button>
                </div>
            )}

            {!isLoading && !isError && (
                <ul className="space-y-2">
                    {criador && (
                        <li className="flex items-center justify-between gap-3 text-sm">
                            <span className="flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
                                <ShieldCheck size={15} className="text-[#148742] shrink-0" />
                                {criador.name}
                                <span className="text-xs text-gray-400">criador</span>
                            </span>
                        </li>
                    )}

                    {activas.map((a) => (
                        <li key={a.id} className="flex items-center justify-between gap-3 text-sm">
                            <span className="flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
                                <ShieldCheck size={15} className="text-blue-500 shrink-0" />
                                {a.user?.name || `#${a.user_id}`}
                                <span className="text-xs text-gray-400">atribuído</span>
                            </span>
                            {podeRetirar(a) && (
                                <button
                                    onClick={() => retirar(a)}
                                    disabled={ocupado}
                                    title="Retirar do processo"
                                    className="text-gray-400 hover:text-red-600 disabled:opacity-50"
                                >
                                    <Trash2 size={14} />
                                </button>
                            )}
                        </li>
                    ))}

                    {pendentes.map((a) => (
                        <li key={a.id} className="flex items-center justify-between gap-3 text-sm">
                            <span className="flex items-center gap-2 text-gray-500">
                                <Clock size={15} className="text-amber-500 shrink-0" />
                                {a.user?.name || `#${a.user_id}`}
                                <span className="text-xs text-amber-600">
                                    à espera de aprovação — ainda não tem acesso
                                </span>
                            </span>
                            {podeRetirar(a) && (
                                <button
                                    onClick={() => retirar(a)}
                                    disabled={ocupado}
                                    title="Cancelar pedido"
                                    className="text-gray-400 hover:text-red-600 disabled:opacity-50"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </li>
                    ))}

                    {activas.length === 0 && pendentes.length === 0 && (
                        <li className="text-xs text-gray-400">
                            Só o criador tem acesso a este processo.
                        </li>
                    )}
                </ul>
            )}

            {aJuntar && (
                <div className="mt-4 p-3 rounded-lg space-y-3"
                    style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
                    <div>
                        <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-primary)' }}>
                            Técnico
                        </label>
                        <select
                            value={tecnicoEscolhido}
                            onChange={(e) => setTecnicoEscolhido(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#44B16F]"
                            style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
                        >
                            <option value="">Seleccione...</option>
                            {elegiveis.map((t) => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>
                        {elegiveis.length === 0 && (
                            <p className="text-xs text-gray-400 mt-1">
                                Não há técnicos disponíveis para juntar a este processo.
                            </p>
                        )}
                    </div>

                    {!isAdmin && (
                        <div>
                            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-primary)' }}>
                                Justificação <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={justificacao}
                                onChange={(e) => setJustificacao(e.target.value)}
                                rows={2}
                                placeholder="Porque precisa de juntar este técnico?"
                                className="w-full px-3 py-2 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#44B16F]"
                                style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
                            />
                            <p className="text-xs text-gray-400 mt-1">
                                O pedido fica pendente até um administrador o aprovar.
                            </p>
                        </div>
                    )}

                    <div className="flex justify-end gap-2">
                        <button
                            onClick={() => { setAJuntar(false); setTecnicoEscolhido(''); setJustificacao(''); }}
                            disabled={ocupado}
                            className="px-3 py-1.5 text-xs rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={juntar}
                            disabled={ocupado || !tecnicoEscolhido}
                            className="px-3 py-1.5 text-xs rounded-lg bg-[#148742] text-white hover:bg-[#0f6631] disabled:opacity-50"
                        >
                            {ocupado ? 'A enviar...' : (isAdmin ? 'Atribuir' : 'Pedir atribuição')}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
