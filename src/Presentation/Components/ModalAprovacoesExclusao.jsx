import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, AlertTriangle, Check, XCircle, FileText, Building2, MessageSquare } from 'lucide-react';
import api, { pendingDeletionsAPI } from '../../services/api';
import RefreshButton from './ui/RefreshButton';
import { ErrorState, StaleDataBanner } from './ui/StateViews';
import { useDeletionRequests, useInvalidate } from '../../hooks/queries';
import { queryKeys } from '../../lib/queryKeys';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';
import { getErrorMessage } from '../../utils/apiHelpers';

const isPendingRequest = (req) => {
    const status = req.status || req.request_status || req.state;
    if (!status) return true;
    const s = String(status).toLowerCase();
    return ['pending', 'pendente', 'in_progress', 'inprogress', 'aguardando', 'requested', '0'].includes(s);
};

// Detecta se o pedido se refere a um fornecedor, aceitando as várias formas
// que o backend pode devolver o tipo (App\Models\Supplier, supplier, etc).
const isSupplierRequest = (req) => {
    const type = req.requestable_type || req.deletable_type || req.item_type || req.type || '';
    const s = String(type).toLowerCase();
    return s.includes('supplier');
};

const itemKey = (req) => `${isSupplierRequest(req) ? 's' : 'q'}_${req.requestable_id}`;

const supplierNameOf = (item) => (item.company_name || item.commercial_name || item.legal_name || item.name || item.title);

const quotationNameOf = (item) => (item.title || item.name);

// Remove envelopes de paginação/recursos ({ data: ... }) e arrays, deixando
// o objeto do item propriamente dito, para extrair o nome.
const extractItem = (payload) => {
    let item = payload;
    for (let i = 0; i < 3 && item && typeof item === 'object'; i++) {
        if (Array.isArray(item)) { item = item[0]; continue; }
        if ('data' in item) { item = item.data; continue; }
        break;
    }
    return item && typeof item === 'object' ? item : {};
};

// Obtém o nome do item consultando primeiro o recurso pelo id e, se isso
// falhar, procurando o id nas listas (com paginação).
const resolveItemName = async (req) => {
    const id = req.requestable_id;
    const isSupplier = isSupplierRequest(req);

    try {
        const url = isSupplier ? `/suppliers/${id}` : `/quotation-requests/${id}`;
        const res = await api.get(url);
        const item = extractItem(res?.data);
        const name = isSupplier ? supplierNameOf(item) : quotationNameOf(item);
        if (name) return name;
    } catch (error) {
        console.warn(`[ModalAprovacoesExclusao] GET ${isSupplier ? '/suppliers' : '/quotation-requests'}/${id} falhou, a procurar na lista...`, error);
    }

    const listUrl = isSupplier ? '/suppliers' : '/quotation-requests';
    let page = 1;
    let lastPage = 1;
    do {
        try {
            const res = await api.get(listUrl, { params: { page } });
            const body = res?.data || {};
            const items = Array.isArray(body) ? body : (body.data || []);
            lastPage = body.last_page || body.meta?.last_page || page;
            for (const it of items) {
                if (String(it.id) === String(id)) {
                    return isSupplier ? supplierNameOf(it) : quotationNameOf(it);
                }
            }
        } catch (error) {
            console.warn(`[ModalAprovacoesExclusao] Não foi possível ler a lista ${listUrl} (página ${page})`, error);
            break;
        }
        page += 1;
    } while (page <= lastPage);

    // Último recurso: os itens eliminados já não estão nas listas, mas o
    // backend guarda o nome em deleted_values nos audit logs de exclusão.
    const eventName = isSupplier ? 'Exclusão de Fornecedor' : 'Exclusão de Pedido de Cotação';
    try {
        const res = await api.get('/audit-logs', { params: { event: eventName, per_page: 100 } });
        const body = res?.data || {};
        const logs = Array.isArray(body) ? body : (body.data || []);
        for (const log of logs) {
            const details = log.details || {};
            if (String(details.model_id) !== String(id)) continue;
            const dv = details.deleted_values || {};
            const name = isSupplier
                ? (dv.company_name || dv.commercial_name || dv.legal_name || dv.name)
                : (dv.title || dv.name || dv.reference_number);
            if (name) return name;
        }
    } catch (error) {
        console.warn(`[ModalAprovacoesExclusao] Não foi possível consultar os audit logs para o item #${id}`, error);
    }

    return '';
};

// Extrai o nome do item directamente da resposta da API, procurando em todas
// as localizações/formatos possíveis em que o backend o pode devolver.
const getRawName = (req) => {
    const isSupplier = isSupplierRequest(req);
    const candidates = [
        req.requestable,
        req.deletable,
        req.item,
        req.supplier,
        req.quotation_request,
        req.pending_deletion,
    ].filter(Boolean);

    for (const obj of candidates) {
        const target = obj.data || obj;
        const name = isSupplier
            ? (target.company_name || target.commercial_name || target.legal_name || target.name || target.title)
            : (target.title || target.name || target.description);
        if (name) return name;
    }

    const topName = isSupplier
        ? (req.company_name || req.commercial_name || req.legal_name || req.name || req.item_name)
        : (req.title || req.name || req.item_name || req.assunto || req.subject);
    if (topName) return topName;

    return '';
};

const formatDateTime = (value) => {
    if (!value) return '—';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('pt-AO');
};

// Chave dos nomes resolvidos: dentro da família 'deletion-requests', para ser
// invalidada juntamente com os pedidos.
const itemNamesKey = (keys) => [...queryKeys.deletionRequests.all, 'item-names', keys];

export default function ModalAprovacoesExclusao({ isOpen, onClose }) {
    const toast = useToast();
    const confirm = useConfirm();
    const invalidate = useInvalidate();

    const [rejectTarget, setRejectTarget] = useState(null);
    const [rejectReason, setRejectReason] = useState('');
    const [isRejecting, setIsRejecting] = useState(false);

    const {
        data,
        isLoading,
        isFetching,
        isError,
        error,
        refetch,
        dataUpdatedAt,
    } = useDeletionRequests({ enabled: !!isOpen });

    const pendingRequests = useMemo(() => (data ?? []).filter(isPendingRequest), [data]);

    // Pedidos cujo nome do item não vem na resposta: resolver consultando o recurso
    const missing = useMemo(() => {
        const seen = new Set();
        return pendingRequests.filter((req) => {
            if (req.requestable_id == null || getRawName(req)) return false;
            const key = itemKey(req);
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }, [pendingRequests]);
    const missingKeys = useMemo(() => missing.map(itemKey).sort(), [missing]);

    const { data: itemNames = {} } = useQuery({
        queryKey: itemNamesKey(missingKeys),
        queryFn: async () => {
            const names = {};
            await Promise.all(missing.map(async (req) => {
                const name = await resolveItemName(req);
                if (name) names[itemKey(req)] = name;
            }));
            return names;
        },
        enabled: !!isOpen && missingKeys.length > 0,
        staleTime: 5 * 60 * 1000,
    });

    // Fechar com Escape (se não houver um diálogo secundário aberto)
    useEffect(() => {
        if (!isOpen) return;
        const onKeyDown = (e) => {
            if (e.key !== 'Escape') return;
            if (rejectTarget) {
                if (!isRejecting) setRejectTarget(null);
            } else {
                onClose?.();
            }
        };
        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [isOpen, onClose, rejectTarget, isRejecting]);

    // Nome do item: o que veio na resposta da API ou o obtido ao consultar o recurso pelo id.
    const getItemName = (req) => itemNames[itemKey(req)] || getRawName(req) || `#${req.requestable_id}`;

    const invalidateAfterDecision = (req) => invalidate(
        queryKeys.deletionRequests.all,
        isSupplierRequest(req) ? queryKeys.suppliers.all : queryKeys.quotationRequests.all,
        queryKeys.dashboard.all,
    );

    const handleApprove = async (req) => {
        const nome = getItemName(req);
        const confirmed = await confirm({
            title: 'Aprovar exclusão',
            message: (
                <div className="space-y-3">
                    <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                        Tem a certeza de que deseja aprovar a exclusão de{' '}
                        <strong style={{ color: 'var(--color-text-primary)' }}>{nome}</strong>?
                    </p>
                    <div className="rounded-lg p-3" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
                        <p className="text-sm text-amber-700">Esta acção é irreversível.</p>
                    </div>
                </div>
            ),
            confirmLabel: 'Sim, aprovar',
            runningLabel: 'A aprovar...',
            variant: 'danger',
            onConfirm: () => pendingDeletionsAPI.approve(req.id),
            getErrorMessage: (err) => getErrorMessage(err, 'Erro ao aprovar a exclusão.'),
        });
        if (confirmed) {
            toast.success('Exclusão aprovada com sucesso.');
            invalidateAfterDecision(req);
        }
    };

    const handleReject = (req) => {
        setRejectTarget(req);
        setRejectReason('');
    };

    const submitReject = async () => {
        if (!rejectTarget || !rejectReason.trim() || isRejecting) return;
        const target = rejectTarget;
        setIsRejecting(true);
        try {
            await pendingDeletionsAPI.reject(target.id, rejectReason.trim());
            setRejectTarget(null);
            setRejectReason('');
            toast.success('Exclusão recusada.');
            invalidateAfterDecision(target);
        } catch (err) {
            toast.error(getErrorMessage(err, 'Erro ao recusar a exclusão.'));
        } finally {
            setIsRejecting(false);
        }
    };

    const hasData = data !== undefined;

    if (!isOpen) return null;

    return (
        <>
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative rounded-2xl shadow-2xl w-full max-w-2xl mx-4 flex flex-col overflow-hidden max-h-[85vh]" style={{ background: 'var(--color-surface)' }}>

                {/* Header */}
                <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg text-orange-600" style={{ background: 'rgba(249,115,22,0.1)' }}>
                            <AlertTriangle size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg" style={{ color: 'var(--color-text-primary)' }}>Aprovações de Exclusão</h3>
                            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Autorize ou recuse pedidos de exclusão dos técnicos.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <RefreshButton onClick={refetch} isFetching={isFetching} updatedAt={dataUpdatedAt} showLabel={false} />
                        <button onClick={onClose} aria-label="Fechar" className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6" style={{ background: 'var(--color-bg)' }}>
                    {isError && hasData && (
                        <div className="mb-4">
                            <StaleDataBanner onRetry={refetch} isRetrying={isFetching} />
                        </div>
                    )}
                    {isLoading ? (
                            <div className="text-center py-8" style={{ color: 'var(--color-text-secondary)' }}>A carregar pedidos pendentes...</div>
                        ) : isError && !hasData ? (
                            <ErrorState
                                message={getErrorMessage(error, 'Erro ao carregar os pedidos de exclusão pendentes.')}
                                onRetry={refetch}
                                isRetrying={isFetching}
                            />
                        ) : pendingRequests.length === 0 ? (
                            <div className="text-center py-12 flex flex-col items-center">
                                <div className="w-16 h-16 text-green-500 rounded-full flex items-center justify-center mb-4" style={{ background: 'rgba(34,197,94,0.1)' }}>
                                    <Check size={32} />
                                </div>
                                <h4 className="font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>Tudo em dia!</h4>
                                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Não há pedidos de exclusão pendentes neste momento.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {pendingRequests.map(req => {
                                    const tecnico = req.requester?.name || 'Técnico';
                                    const isSupplier = isSupplierRequest(req);
                                    const tipo = isSupplier ? 'Fornecedor' : 'Cotação';
                                    const itemNome = getItemName(req);
                                    const statusClass = isSupplier ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-purple-50 text-purple-700 border-purple-200';
                                    return (
                                    <div key={req.id} className="p-3.5 rounded-xl shadow-sm" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${isSupplier ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                                                    {isSupplier ? <AlertTriangle size={18} /> : <FileText size={18} />}
                                                </div>
                                                <div>
                                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${statusClass}`}>
                                                        {tipo}
                                                    </span>
                                                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                                                        {formatDateTime(req.created_at)}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="text-xs font-bold" style={{ color: 'var(--color-text-muted)' }}>#{req.id}</span>
                                        </div>

                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Solicitado por</span>
                                            <strong className="text-sm" style={{ color: 'var(--color-text-primary)' }}>{tecnico}</strong>
                                        </div>

                                        <div className="flex items-center gap-3 p-2.5 rounded-xl mb-2" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
                                            {isSupplier ? (
                                                <Building2 size={18} className="text-blue-500 shrink-0" />
                                            ) : (
                                                <FileText size={18} className="text-purple-500 shrink-0" />
                                            )}
                                            <div>
                                                <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Item a eliminar</p>
                                                <p className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>{itemNome}</p>
                                            </div>
                                        </div>

                                        {req.reason && (
                                            <div className="mb-2 p-2.5 rounded-xl text-xs" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>
                                                <span className="font-semibold text-[10px] uppercase tracking-wider flex items-center gap-1 mb-0.5" style={{ color: 'var(--color-text-muted)' }}>
                                                    <MessageSquare size={12} /> Motivo
                                                </span>
                                                {req.reason}
                                            </div>
                                        )}

                                        <div className="flex gap-2 pt-2 border-t" style={{ borderColor: 'var(--color-border)' }}>
                                            <button
                                                onClick={() => handleReject(req)}
                                                disabled={isRejecting}
                                                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50"
                                            >
                                                <XCircle size={16} />
                                                Recusar
                                            </button>
                                            <button
                                                onClick={() => handleApprove(req)}
                                                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm"
                                            >
                                                <Check size={16} />
                                                Aprovar
                                            </button>
                                        </div>
                                    </div>
                                    );
                                })}
                            </div>
                        )}
                </div>
            </div>
        </div>

        {rejectTarget && (
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !isRejecting && setRejectTarget(null)} />
                <div className="relative rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6" style={{ background: 'var(--color-surface)' }}>
                    <div className="flex items-center justify-between mb-1">
                        <h3 className="font-bold text-lg flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
                            <XCircle size={20} className="text-red-500" />
                            Recusar exclusão
                        </h3>
                        <button onClick={() => setRejectTarget(null)} disabled={isRejecting} className="p-1.5 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
                            <X size={18} />
                        </button>
                    </div>
                    <p className="text-sm mb-3" style={{ color: 'var(--color-text-secondary)' }}>
                        Motivo da recusa de{' '}
                        <strong style={{ color: 'var(--color-text-primary)' }}>{getItemName(rejectTarget)}</strong>:
                    </p>
                    <textarea
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        rows={4}
                        autoFocus
                        placeholder="Escreva o motivo da recusa (obrigatório)"
                        className="w-full p-3 rounded-xl text-sm resize-none focus:outline-none focus:ring-2"
                        style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
                    />
                    {!rejectReason.trim() && (
                        <p className="text-xs text-red-500 mt-1">O motivo é obrigatório.</p>
                    )}
                    <div className="flex gap-2 mt-4">
                        <button
                            onClick={() => setRejectTarget(null)}
                            disabled={isRejecting}
                            className="flex-1 py-2 rounded-xl text-sm font-bold transition-all border border-gray-200 text-gray-600 hover:bg-gray-50"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={submitReject}
                            disabled={!rejectReason.trim() || isRejecting}
                            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-bold transition-all bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
                        >
                            <XCircle size={16} />
                            {isRejecting ? 'A recusar...' : 'Confirmar recusa'}
                        </button>
                    </div>
                </div>
            </div>
        )}

        </>
    );
}