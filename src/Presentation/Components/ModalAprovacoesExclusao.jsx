import React, { useEffect, useState } from 'react';
import { X, AlertTriangle, Check, XCircle, FileText, Building2, MessageSquare } from 'lucide-react';
import { pendingDeletionsAPI } from '../../services/api';

export default function ModalAprovacoesExclusao({ isOpen, onClose }) {
    const [pendingRequests, setPendingRequests] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchPending();
        }
    }, [isOpen]);

    const fetchPending = async () => {
        setIsLoading(true);
        try {
            const response = await pendingDeletionsAPI.getAll();
            const listData = response?.data || response || [];
            let requestsArray = Array.isArray(listData) ? listData : (listData.data || []);
            setPendingRequests(requestsArray);
        } catch (error) {
            console.error("Erro ao carregar aprovações", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleApprove = async (id) => {
        if (!window.confirm("Tem certeza que deseja APROVAR esta exclusão? Ação irreversível.")) return;
        try {
            await pendingDeletionsAPI.approve(id);
            fetchPending(); // Refresh
        } catch (error) {
            console.error("Erro ao aprovar", error);
            alert("Erro ao aprovar exclusão");
        }
    };

    const handleReject = async (id) => {
        if (!window.confirm("Deseja REJEITAR esta exclusão? O item continuará intacto no sistema.")) return;
        try {
            await pendingDeletionsAPI.reject(id);
            fetchPending(); // Refresh
        } catch (error) {
            console.error("Erro ao rejeitar", error);
            alert("Erro ao rejeitar exclusão");
        }
    };

    if (!isOpen) return null;

    return (
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
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6" style={{ background: 'var(--color-bg)' }}>
                    {isLoading ? (
                        <div className="text-center py-8" style={{ color: 'var(--color-text-secondary)' }}>A carregar pedidos pendentes...</div>
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
                                const isSupplier = req.requestable_type?.includes('Supplier');
                                const tipo = isSupplier ? 'Fornecedor' : 'Cotação';
                                const itemNome = isSupplier
                                    ? req.requestable?.company_name || req.requestable?.commercial_name || ''
                                    : req.requestable?.title || '';
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
                                                    {new Date(req.created_at).toLocaleString('pt-AO')}
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
                                            <p className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>{itemNome || `#${req.requestable_id}`}</p>
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
                                            onClick={() => handleReject(req.id)}
                                            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all border border-red-200 text-red-600 hover:bg-red-50"
                                        >
                                            <XCircle size={16} />
                                            Recusar
                                        </button>
                                        <button
                                            onClick={() => handleApprove(req.id)}
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
    );
}
