import { useState } from 'react';
import { X, CheckCircle, XCircle, MessageSquare, ShoppingCart } from 'lucide-react';

export default function ModalRevisarCotacao({
    isOpen,
    onClose,
    cotacao,
    onAprovar,
    onRejeitar,
    onSolicitarRevisao,
    onGerarAquisicao
}) {
    if (!isOpen || !cotacao) return null;

    const handleAprovar = () => {
        if (onAprovar) {
            onAprovar(cotacao);
        }
    };

    const handleRejeitar = () => {
        if (onRejeitar) {
            onRejeitar(cotacao);
        }
    };

    const handleSolicitarRevisao = () => {
        if (onSolicitarRevisao) {
            onSolicitarRevisao(cotacao);
        }
    };

    const handleGerarAquisicao = () => {
        if (onGerarAquisicao) {
            onGerarAquisicao(cotacao);
        }
    };

    // Calcular total se houver items com valores
    const calcularTotal = () => {
        if (!cotacao.items || cotacao.items.length === 0) return '0,00';

        const total = cotacao.items.reduce((acc, item) => {
            const valor = parseFloat(item.price || 0);
            return acc + valor;
        }, 0);

        return total.toFixed(2).replace('.', ',');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-4 animate-fadeIn max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-start justify-between px-8 py-6 border-b border-gray-100">
                    <div className="flex-1">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">
                            Pedido de cotação - {cotacao.suppliers?.[0]?.commercial_name || cotacao.suppliers?.[0]?.legal_name || 'Fornecedor'}
                        </h2>

                        {/* Endereço do fornecedor */}
                        <div className="text-sm text-gray-600 space-y-1">
                            <p>{cotacao.suppliers?.[0]?.province || 'Angola'} - {cotacao.suppliers?.[0]?.municipality || 'Luanda'}</p>
                            <p>{cotacao.suppliers?.[0]?.address || 'Endereço não disponível'}</p>
                            <p>{cotacao.suppliers?.[0]?.phone || '---'}</p>
                        </div>
                    </div>

                    {/* Logo */}
                    <div className="ml-6">
                        <img
                            src="/logo.svg"
                            alt="MOSAP3 Logo"
                            className="h-16 w-auto"
                            onError={(e) => {
                                e.target.style.display = 'none';
                            }}
                        />
                    </div>
                </div>

                {/* Content */}
                <div className="px-8 py-6 overflow-y-auto flex-1">
                    {/* Informações principais em 3 colunas */}
                    <div className="grid grid-cols-3 gap-6 mb-6 pb-6 border-b border-gray-200">
                        {/* Solicitado por */}
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-2">Solicitado por:</h3>
                            <div className="text-sm text-gray-600 space-y-1">
                                <p className="font-medium">MOSAP3</p>
                                <p>Rua Coelho na Toca 203</p>
                                <p>607 456 442 Lisboa</p>
                            </div>
                        </div>

                        {/* Enviado para */}
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-2">Enviado para:</h3>
                            <div className="text-sm text-gray-600 space-y-1">
                                <p className="font-medium">{cotacao.suppliers?.[0]?.commercial_name || cotacao.suppliers?.[0]?.legal_name || 'N/A'}</p>
                                <p>{cotacao.suppliers?.[0]?.address || 'Endereço não disponível'}</p>
                                <p>{cotacao.suppliers?.[0]?.phone || '---'}</p>
                            </div>
                        </div>

                        {/* Detalhes */}
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-2">Detalhes:</h3>
                            <div className="text-sm text-gray-600 space-y-1">
                                <p><span className="font-medium">ID:</span> CT - {String(cotacao.id).padStart(3, '0')}</p>
                                <p><span className="font-medium">Data:</span> {cotacao.created_at ? new Date(cotacao.created_at).toLocaleDateString('pt-AO') : 'N/A'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Título e Descrição */}
                    <div className="mb-6">
                        <h3 className="font-semibold text-gray-900 mb-2">Título:</h3>
                        <p className="text-gray-700">{cotacao.title || 'N/A'}</p>

                        {cotacao.description && (
                            <>
                                <h3 className="font-semibold text-gray-900 mt-4 mb-2">Descrição:</h3>
                                <p className="text-gray-700">{cotacao.description}</p>
                            </>
                        )}
                    </div>

                    {/* Tabela de Produtos */}
                    <div className="mb-6 pb-6 border-b border-gray-200">
                        <div className="grid grid-cols-12 gap-4 font-semibold text-gray-900 mb-3">
                            <div className="col-span-4">Produtos:</div>
                            <div className="col-span-5">Descrição do produto:</div>
                            <div className="col-span-3 text-right">Valor:</div>
                        </div>

                        {cotacao.items && cotacao.items.length > 0 ? (
                            <div className="space-y-2">
                                {cotacao.items.map((item, index) => (
                                    <div key={index} className="grid grid-cols-12 gap-4 text-sm text-gray-700">
                                        <div className="col-span-4">
                                            {String(index + 1).padStart(2, '0')} - {item.name}
                                            {item.quantity && ` (${item.quantity} ${item.unit || 'un'})`}
                                        </div>
                                        <div className="col-span-5">{item.specifications || 'N/A'}</div>
                                        <div className="col-span-3 text-right">
                                            {item.price ? `${parseFloat(item.price).toFixed(2).replace('.', ',')} AOA` : '---'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 text-sm">Nenhum produto adicionado</p>
                        )}
                    </div>

                    {/* Total */}
                    <div className="flex justify-end items-center">
                        <span className="text-xl font-semibold text-gray-900">
                            Total: <span className="text-3xl">{calcularTotal()} AOA</span>
                        </span>
                    </div>
                </div>

                {/* Footer com botões */}
                <div className="px-8 py-6 border-t border-gray-100 flex items-center justify-between">
                    <button
                        onClick={onClose}
                        className="px-8 py-3 bg-[#44B16F] text-white rounded-lg hover:bg-[#3a9d5f] transition-colors font-medium shadow-sm"
                    >
                        Finalizar revisão
                    </button>

                    <button
                        onClick={onClose}
                        className="px-8 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium shadow-sm"
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
}
