import React from 'react';
import { X, Bell, Calendar, Trash2 } from 'lucide-react';

export default function ModalDetalhesNotificacao({ isOpen, onClose, notification, onDelete }) {
    if (!isOpen || !notification) return null;

    // Helper para extrair dados da notificação
    const getContent = () => {
        // The API response has top-level fields for title and message, 
        // but sometimes they might be inside 'data' depending on notification type or Laravel structure.
        // We check both levels.
        const sv = notification.data || {};

        // Title priority: top-level > data.title > Default
        const title = notification.title || sv.title || "Notificação";

        // Message priority: top-level > data.message > data.description > Default
        const message = notification.message || sv.message || sv.description || "Sem conteúdo";

        let timeDisplay = 'Data desconhecida';
        try {
            if (notification.created_at) {
                const date = new Date(notification.created_at);
                if (!isNaN(date.getTime())) {
                    timeDisplay = date.toLocaleString('pt-AO');
                }
            }
        } catch (e) { }

        return {
            title,
            message,
            timeDisplay,
            type: notification.type,
            // Extra data for potential future use (e.g. navigation links)
            meta: sv
        };
    };

    const content = getContent();

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 animate-fadeIn flex flex-col overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
                            <Bell size={20} />
                        </div>
                        <h3 className="font-bold text-gray-900 text-lg">Detalhes da Notificação</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[60vh]">
                    <h4 className="text-xl font-bold text-gray-900 mb-4">{content.title}</h4>

                    <div className="prose prose-sm max-w-none text-gray-600 bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <p className="whitespace-pre-wrap">{content.message}</p>
                    </div>

                    <div className="mt-6 flex items-center gap-2 text-sm text-gray-500">
                        <Calendar size={14} />
                        <span>Recebida em: {content.timeDisplay}</span>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-between items-center">
                    <button
                        onClick={() => {
                            if (onDelete) onDelete(notification.id);
                            onClose();
                        }}
                        className="text-red-500 hover:text-red-600 text-sm font-medium flex items-center gap-2 px-3 py-2 hover:bg-red-50 rounded-lg transition-colors"
                    >
                        <Trash2 size={16} />
                        Excluir notificação
                    </button>

                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium shadow-sm"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
}
