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
            const data = await pendingDeletionsAPI.getAll();
            setPendingRequests(data || []);
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
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 flex flex-col overflow-hidden max-h-[85vh]">
                
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
                    <div className="flex items-center gap-3">
                        <div className="bg-orange-50 p-2 rounded-lg text-orange-600">
                            <AlertTriangle size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 text-lg">Aprovações de Exclusão</h3>
                            <p className="text-sm text-gray-500">Autorize ou recuse pedidos de exclusão dos técnicos.</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30">
                    {isLoading ? (
                        <div className="text-center py-8 text-gray-500">A carregar pedidos pendentes...</div>
                    ) : pendingRequests.length === 0 ? (
                        <div className="text-center py-12 flex flex-col items-center">
                            <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-4">
                                <Check size={32} />
                            </div>
                            <h4 className="text-gray-900 font-semibold mb-1">Tudo em dia!</h4>
                            <p className="text-gray-500 text-sm">Não há pedidos de exclusão pendentes neste momento.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {pendingRequests.map(req => (
                                <div key={req.id} className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${req.type === 'supplier' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                                                {req.type === 'supplier' ? 'Fornecedor' : 'Pedido de Cotação'}
                                            </span>
                                            <span className="text-xs text-gray-400">{new Date(req.createdAt).toLocaleString('pt-AO')}</span>
                                        </div>
                                        <p className="text-sm text-gray-800">
                                            O técnico <span className="font-semibold">{req.technicianName}</span> solicitou a exclusão de:
                                        </p>
                                        <p className="font-bold text-gray-900 mt-1">{req.itemName}</p>
                                    </div>
                                    <div className="flex gap-2 w-full md:w-auto">
                                        <button 
                                            onClick={() => handleReject(req.id)}
                                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-sm font-semibold transition-colors border border-red-200"
                                        >
                                            <XCircle size={16} />
                                            Recusar
                                        </button>
                                        <button 
                                            onClick={() => handleApprove(req.id)}
                                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg text-sm font-semibold transition-colors border border-emerald-200"
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
