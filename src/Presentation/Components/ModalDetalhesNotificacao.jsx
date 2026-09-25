import { useEffect, useState } from 'react';
import { useModalLock } from '../../hooks/useModalLock';
import { useNavigate } from 'react-router-dom';
import { X, Bell, Calendar, Trash2, User, FileText, AlertTriangle, Activity, Loader2, MessagesSquare, ExternalLink } from 'lucide-react';
import { isNegotiationNotification, getNegotiationLabel, getNotificationLink } from '../../utils/notifications';

export default function ModalDetalhesNotificacao({ isOpen, onClose, notification, onDelete, isDeleting: isDeletingProp = false }) {
    useModalLock(isOpen);
    const navigate = useNavigate();
    const [isDeletingLocal, setIsDeletingLocal] = useState(false);
    const isDeleting = isDeletingProp || isDeletingLocal;

    // Fechar com Escape (excepto durante a eliminação)
    useEffect(() => {
        if (!isOpen) return;
        const onKeyDown = (e) => {
            if (e.key === 'Escape' && !isDeleting) onClose?.();
        };
        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [isOpen, onClose, isDeleting]);

    if (!isOpen || !notification) return null;

    const link = getNotificationLink(notification);

    const handleDelete = async () => {
        if (isDeleting) return;
        if (!onDelete) {
            onClose();
            return;
        }
        setIsDeletingLocal(true);
        try {
            // onDelete pode ser assíncrono e devolver false em caso de erro (o erro é mostrado por quem chama)
            const result = await onDelete(notification.id);
            if (result !== false) onClose();
        } finally {
            setIsDeletingLocal(false);
        }
    };

    const getContent = () => {
        const sv = notification.data || {};

        const rawType = String(notification.type || sv.type || '');
        const type = rawType.toLowerCase();

        const techName = sv.technician_name || sv.technicianName || sv.user?.name || sv.user_name || sv.requested_by || sv.requested_by_name || sv.nome || sv.name || 'Técnico';

        const isDeletionRequest =
            type === 'deletion_request' ||
            rawType.includes('DeletionRequest') ||
            type.includes('deletion') ||
            type.includes('elimina') ||
            sv.deletion_request_id ||
            (sv.technician_name && sv.item_name);

        const isQuotationRequest = !isDeletionRequest && (
            type === 'quotation_request' ||
            rawType.includes('QuotationRequest') ||
            type.includes('quotation') ||
            type.includes('cotação') ||
            type.includes('cotacao') ||
            (techName !== 'Técnico' && (sv.quotation_id || sv.quotation_request_id))
        );

        const isActivity = !isDeletionRequest && !isQuotationRequest && (
            type === 'activity' ||
            type === 'atividade' ||
            rawType.includes('Activity') ||
            rawType.includes('Atividade') ||
            type.includes('activity') ||
            type.includes('atividade') ||
            (techName !== 'Técnico' && (sv.activity_name || sv.activity_id || sv.title))
        );

        let timeDisplay = 'Data desconhecida';
        if (notification.created_at) {
            const date = new Date(notification.created_at);
            if (!isNaN(date.getTime())) timeDisplay = date.toLocaleString('pt-AO');
        }

        return { sv, techName, type, isDeletionRequest, isQuotationRequest, isActivity, timeDisplay };
    };

    const { sv, techName, type, isDeletionRequest, isQuotationRequest, isActivity, timeDisplay } = getContent();

    const renderContent = () => {
        if (isNegotiationNotification(notification)) {
            return (
                <>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2.5 rounded-xl text-green-700 bg-green-50">
                            <MessagesSquare size={22} />
                        </div>
                        <div>
                            <h4 className="text-xl font-bold text-gray-900">{notification.title || sv.title || getNegotiationLabel(notification)}</h4>
                            <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded mt-1 text-green-700 bg-green-50 border border-green-200">
                                {getNegotiationLabel(notification)}
                            </span>
                        </div>
                    </div>
                    <div className="text-gray-700 bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <p className="whitespace-pre-wrap text-sm">{notification.message || sv.message || 'Sem conteúdo'}</p>
                        {sv.supplier_name && (
                            <p className="text-sm mt-3"><span className="font-semibold">Fornecedor:</span> {sv.supplier_name}</p>
                        )}
                        {sv.revision_number > 1 && (
                            <p className="text-sm mt-1"><span className="font-semibold">Revisão:</span> n.º {sv.revision_number}</p>
                        )}
                        {sv.reason && (
                            <p className="text-sm mt-1"><span className="font-semibold">Motivo:</span> {sv.reason}</p>
                        )}
                    </div>
                </>
            );
        }

        if (isDeletionRequest) {
            const itemName = sv.item_name || sv.itemName || sv.deletable?.company_name || sv.deletable?.commercial_name || sv.deletable?.title || sv.deletable?.name || 'Item';
            const isSupplier =
                (sv.deletable_type && (sv.deletable_type.includes('Supplier') || sv.deletable_type === 'supplier')) ||
                (sv.item_type && (sv.item_type.includes('Supplier') || sv.item_type === 'supplier')) ||
                type.includes('supplier');
            const itemType = isSupplier ? 'Fornecedor' : 'Pedido de Cotação';
            const reason = sv.reason || '';

            return (
                <>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2.5 rounded-xl text-orange-600" style={{ background: 'rgba(249,115,22,0.1)' }}>
                            <AlertTriangle size={22} />
                        </div>
                        <div>
                            <h4 className="text-xl font-bold text-gray-900">Pedido de Eliminação — {itemType}</h4>
                            <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded mt-1 text-orange-600 bg-orange-50 border border-orange-200">
                                Exclusão
                            </span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 border border-gray-100">
                            <User size={18} className="text-gray-400 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Solicitado por</p>
                                <p className="text-sm font-bold text-gray-900 mt-0.5">{techName}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 border border-gray-100">
                            <FileText size={18} className="text-gray-400 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Item a eliminar</p>
                                <p className="text-sm font-bold text-gray-900 mt-0.5">{itemName}</p>
                                <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded mt-1 ${isSupplier ? 'text-blue-600 bg-blue-50' : 'text-purple-600 bg-purple-50'}`}>
                                    {itemType}
                                </span>
                            </div>
                        </div>

                        {reason && (
                            <div className="p-4 rounded-xl bg-red-50 border border-red-100">
                                <p className="text-xs font-semibold text-red-500 uppercase tracking-wider mb-1">Motivo</p>
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">{reason}</p>
                            </div>
                        )}
                    </div>
                </>
            );
        }

        if (isQuotationRequest) {
            const assunto = sv.assunto || sv.subject || sv.title || sv.activity_name || sv.item_name || sv.activity_description || 'Pedido de Cotação';

            return (
                <>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2.5 rounded-xl text-blue-600" style={{ background: 'rgba(59,130,246,0.1)' }}>
                            <FileText size={22} />
                        </div>
                        <div>
                            <h4 className="text-xl font-bold text-gray-900">Pedido de Cotação</h4>
                            <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded mt-1 text-blue-600 bg-blue-50 border border-blue-200">
                                Cotação
                            </span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 border border-gray-100">
                            <User size={18} className="text-gray-400 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Solicitado por</p>
                                <p className="text-sm font-bold text-gray-900 mt-0.5">{techName}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 border border-gray-100">
                            <FileText size={18} className="text-gray-400 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Assunto</p>
                                <p className="text-sm font-bold text-gray-900 mt-0.5">{assunto}</p>
                            </div>
                        </div>
                    </div>
                </>
            );
        }

        if (isActivity) {
            const activityName = sv.activity_name || sv.title || sv.item_name || sv.name || 'Actividade';

            return (
                <>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2.5 rounded-xl text-emerald-600" style={{ background: 'rgba(16,185,129,0.1)' }}>
                            <Activity size={22} />
                        </div>
                        <div>
                            <h4 className="text-xl font-bold text-gray-900">Nova Actividade</h4>
                            <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded mt-1 text-emerald-600 bg-emerald-50 border border-emerald-200">
                                Actividade
                            </span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 border border-gray-100">
                            <User size={18} className="text-gray-400 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Registado por</p>
                                <p className="text-sm font-bold text-gray-900 mt-0.5">{techName}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 border border-gray-100">
                            <Activity size={18} className="text-gray-400 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Descrição</p>
                                <p className="text-sm font-bold text-gray-900 mt-0.5">{activityName}</p>
                            </div>
                        </div>
                    </div>
                </>
            );
        }

        return (
            <>
                <h4 className="text-xl font-bold text-gray-900 mb-4">{notification.title || sv.title || "Notificação"}</h4>
                <div className="prose prose-sm max-w-none text-gray-600 bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <p className="whitespace-pre-wrap">{notification.message || sv.message || sv.description || "Sem conteúdo"}</p>
                </div>
            </>
        );
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { if (!isDeleting) onClose(); }} />

            <div
                className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 animate-fadeIn flex flex-col overflow-hidden"
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-detalhes-notificacao-title"
            >
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
                            <Bell size={20} />
                        </div>
                        <h3 id="modal-detalhes-notificacao-title" className="font-bold text-gray-900 text-lg">Detalhes da Notificação</h3>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isDeleting}
                        aria-label="Fechar"
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto max-h-[60vh]">
                    {renderContent()}

                    <div className="mt-6 flex items-center gap-2 text-sm text-gray-500">
                        <Calendar size={14} />
                        <span>Recebida em: {timeDisplay}</span>
                    </div>
                </div>

                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-between items-center">
                    <button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="text-red-500 hover:text-red-600 text-sm font-medium flex items-center gap-2 px-3 py-2 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-wait"
                    >
                        {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                        {isDeleting ? 'A eliminar...' : 'Excluir notificação'}
                    </button>

                    <div className="flex items-center gap-2">
                        {link && (
                            <button
                                onClick={() => { onClose(); navigate(link); }}
                                disabled={isDeleting}
                                className="px-4 py-2 bg-[#44B16F] text-white rounded-lg hover:bg-[#3a9d5f] transition-colors font-medium shadow-sm flex items-center gap-2"
                            >
                                <ExternalLink size={16} />
                                Abrir pedido
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            disabled={isDeleting}
                            className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium shadow-sm"
                        >
                            Fechar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
