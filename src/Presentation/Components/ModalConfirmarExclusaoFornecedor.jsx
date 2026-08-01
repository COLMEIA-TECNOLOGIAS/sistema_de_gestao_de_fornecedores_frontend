import { useState } from 'react';
import { useModalLock } from '../../hooks/useModalLock';
import { X, AlertTriangle, Clock } from "lucide-react";

export default function ModalConfirmarExclusaoFornecedor({ isOpen, onClose, onConfirm, fornecedor, isLoading, isAdmin = true }) {
    useModalLock(isOpen);
    const [reason, setReason] = useState("");
    if (!isOpen || !fornecedor) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-fadeIn">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${isAdmin ? 'bg-red-100' : 'bg-orange-100'}`}>
                            {isAdmin ? (
                                <AlertTriangle className="w-5 h-5 text-red-600" />
                            ) : (
                                <Clock className="w-5 h-5 text-orange-500" />
                            )}
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">
                            {isAdmin ? 'Eliminar Fornecedor' : 'Solicitar Eliminação'}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        disabled={isLoading}
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    <p className="text-gray-600 text-center text-lg">
                        {isAdmin ? 'Tens certeza que quer eliminar' : 'Solicitar ao administrador a eliminação de'}{' '}
                        <span className="font-bold text-gray-900">{fornecedor.commercial_name || fornecedor.legal_name}</span>?
                    </p>
                    <p className="text-gray-500 text-sm text-center mt-2">
                        {isAdmin
                            ? 'Esta ação não pode ser desfeita e removerá todos os dados associados.'
                            : 'O administrador receberá a solicitação e poderá aprovar ou recusar a eliminação.'}
                    </p>
                    {isAdmin && (
                        <div className="mt-4">
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Motivo da eliminação <span className="text-gray-400">(opcional)</span></label>
                            <textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="Descreva brevemente o motivo da eliminação..."
                                disabled={isLoading}
                                className="w-full p-3 border rounded-xl text-sm focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all resize-none h-24 bg-gray-50 focus:bg-white"
                            />
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-200">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={() => onConfirm(fornecedor, reason)}
                        disabled={isLoading}
                        className={`px-6 py-2.5 text-white rounded-lg transition-colors font-medium flex items-center gap-2 disabled:opacity-50 ${isAdmin ? 'bg-red-600 hover:bg-red-700' : 'bg-orange-500 hover:bg-orange-600'}`}
                    >
                        {isLoading ? (
                            <>
                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                {isAdmin ? 'Eliminando...' : 'Enviando pedido...'}
                            </>
                        ) : (
                            isAdmin ? 'Sim, eliminar' : 'Enviar pedido'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
