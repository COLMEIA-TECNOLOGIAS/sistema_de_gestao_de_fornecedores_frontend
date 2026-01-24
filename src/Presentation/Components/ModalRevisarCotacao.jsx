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
                            Pedido de cotação - {cotacao.quotation_supplier?.supplier?.commercial_name || cotacao.quotation_supplier?.supplier?.legal_name || 'Fornecedor'}
                        </h2>

                        {/* Endereço do fornecedor */}
                        <div className="text-sm text-gray-600 space-y-1">
                            <p>{cotacao.quotation_supplier?.supplier?.province || 'Angola'} - {cotacao.quotation_supplier?.supplier?.municipality || 'Luanda'}</p>
                            <p>{cotacao.quotation_supplier?.supplier?.address || 'Endereço não disponível'}</p>
                            <p>{cotacao.quotation_supplier?.supplier?.phone || '---'}</p>
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
                                <p className="font-medium">{cotacao.quotation_supplier?.supplier?.commercial_name || cotacao.quotation_supplier?.supplier?.legal_name || 'N/A'}</p>
                                <p>{cotacao.quotation_supplier?.supplier?.address || 'Endereço não disponível'}</p>
                                <p>{cotacao.quotation_supplier?.supplier?.phone || '---'}</p>
                            </div>
                        </div>

                        {/* Detalhes */}
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-2">Detalhes:</h3>
                            <div className="text-sm text-gray-600 space-y-1">
                                <p><span className="font-medium">ID:</span> CT - {String(cotacao.id).padStart(3, '0')}</p>
                                <p><span className="font-medium">Data:</span> {cotacao.submitted_at ? new Date(cotacao.submitted_at).toLocaleDateString('pt-AO') : 'N/A'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Título e Descrição */}
                    <div className="mb-6">
                        <h3 className="font-semibold text-gray-900 mb-2">Título da Cotação:</h3>
                        <p className="text-gray-700">{cotacao.quotation_supplier?.quotation_request?.title || 'N/A'}</p>

                        {cotacao.quotation_supplier?.quotation_request?.description && (
                            <>
                                <h3 className="font-semibold text-gray-900 mt-4 mb-2">Descrição:</h3>
                                <p className="text-gray-700">{cotacao.quotation_supplier?.quotation_request?.description}</p>
                            </>
                        )}
                    </div>

                    {/* Tabela de Produtos */}
                    <div className="mb-6 pb-6 border-b-2 border-dashed border-gray-200">
                        <div className="grid grid-cols-12 gap-4 font-bold text-gray-900 mb-4">
                            <div className="col-span-5">Produtos:</div>
                            <div className="col-span-4">Descrição do produto:</div>
                            <div className="col-span-3 text-right">Valor:</div>
                        </div>

                        {cotacao.items && cotacao.items.length > 0 ? (
                            <div className="space-y-4">
                                {cotacao.items.map((item, index) => {
                                    // Try to get item details from the nested quotation_item object (priority)
                                    // or find it in the original request items array (fallback)
                                    const requestItem = item.quotation_item || cotacao.quotation_supplier?.quotation_request?.items?.find(
                                        r => r.id === item.quotation_item_id
                                    );

                                    return (
                                        <div key={index} className="grid grid-cols-12 gap-4 text-sm text-gray-700 items-start">
                                            <div className="col-span-5">
                                                <span className="text-gray-900">
                                                    {String(index + 1).padStart(2, '0')} - {requestItem ? requestItem.name : `Item #${item.quotation_item_id}`}
                                                </span>
                                                {requestItem && (
                                                    <span className="text-gray-600 ml-1">
                                                        ({requestItem.quantity} {requestItem.unit || 'uni'})
                                                    </span>
                                                )}
                                            </div>
                                            <div className="col-span-4 text-gray-600">
                                                {requestItem?.specifications || item.notes || '-'}
                                            </div>
                                            <div className="col-span-3 text-right font-medium text-gray-900">
                                                {item.unit_price ? `${parseFloat(item.unit_price).toLocaleString('pt-AO', { minimumFractionDigits: 2 })} AOA` : '---'}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-gray-500 text-sm">Nenhum item cotado.</p>
                        )}
                    </div>

                    {/* Total */}
                    <div className="flex justify-end items-center mt-4">
                        <span className="text-xl font-bold text-gray-900 mr-2">Total:</span>
                        <span className="text-4xl font-black text-black tracking-tight">{cotacao.history && cotacao.history.length > 0 && cotacao.history[0].total_amount
                            ? parseFloat(cotacao.history[0].total_amount).toLocaleString('pt-AO', { minimumFractionDigits: 2 })
                            : '0,00'} AOA</span>
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
