import React, { useEffect, useState } from 'react';
import { X, AlertTriangle, Check, XCircle } from 'lucide-react';
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
                            {pendingRequests.map(req => (
                                <div key={req.id} className="p-4 rounded-xl shadow-sm flex flex-col md:flex-row gap-4 items-start md:items-center justify-between" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${
                                                (req.deletable_type?.includes('Supplier') || req.type === 'supplier') ? 'text-blue-500' : 'text-purple-500'
                                            }`} style={{ background: (req.deletable_type?.includes('Supplier') || req.type === 'supplier') ? 'rgba(59,130,246,0.1)' : 'rgba(168,85,247,0.1)' }}>
                                                {(req.deletable_type?.includes('Supplier') || req.type === 'supplier') ? 'Fornecedor' : 'Pedido de Cotação'}
                                            </span>
                                            <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{new Date(req.created_at || req.createdAt).toLocaleString('pt-AO')}</span>
                                        </div>
                                        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                                            O técnico <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{req.user?.name || req.technician_name || req.technicianName || 'Técnico'}</span> solicitou a exclusão de:
                                        </p>
                                        <p className="font-bold mt-1" style={{ color: 'var(--color-text-primary)' }}>
                                            {req.deletable?.company_name || req.deletable?.commercial_name || req.deletable?.title || req.deletable?.name || req.item_name || req.itemName || `ID: ${req.deletable_id || req.item_id || req.itemId}`}
                                        </p>
                                        {req.reason && (
                                            <div className="mt-2 p-2 rounded-lg text-sm" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>
                                                <span className="font-semibold text-xs uppercase tracking-wider block mb-1" style={{ color: 'var(--color-text-muted)' }}>Motivo:</span>
                                                {req.reason}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex gap-2 w-full md:w-auto">
                                        <button 
                                            onClick={() => handleReject(req.id)}
                                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                                            style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239,68,68,0.2)'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
                                        >
                                            <XCircle size={16} />
                                            Recusar
                                        </button>
                                        <button 
                                            onClick={() => handleApprove(req.id)}
                                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                                            style={{ color: '#10b981', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(16,185,129,0.2)'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(16,185,129,0.1)'}
                                        >
                                            <Check size={16} />
                                            Aprovar
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
