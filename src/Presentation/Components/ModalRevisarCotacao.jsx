import { useState } from 'react';
import { X, CheckCircle, XCircle, MessageSquare, ShoppingCart, FileText } from 'lucide-react';
import api from '../../services/api';

export default function ModalRevisarCotacao({
    isOpen,
    onClose,
    cotacao,
    onAprovar,
    onRejeitar,
    onSolicitarRevisao,
    onGerarAquisicao,
    isAcquisition
}) {
    const [viewingDoc, setViewingDoc] = useState(false);

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

    // Calcular total considerando quantidade
    const calcularTotal = () => {
        if (!cotacao.items || cotacao.items.length === 0) return '0,00';

        const total = cotacao.items.reduce((acc, item) => {
            // Find quantity from request item or item itself
            const requestItem = item.quotation_item || cotacao.quotation_supplier?.quotation_request?.items?.find(
                r => r.id === item.quotation_item_id
            );
            const quantity = parseFloat(requestItem?.quantity || item.quantity || 1);
            const valor = parseFloat(item.unit_price || item.price || 0);
            return acc + (valor * quantity);
        }, 0);

        // return total.toFixed(2); 
        // Original returned string.
        // Let's return number to be safe, or string formatted. 
        // Original: total.toFixed(2).replace('.', ',');
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
                            {isAcquisition ? 'Aquisição' : 'Pedido de cotação'} - {cotacao.quotation_supplier?.supplier?.commercial_name || cotacao.quotation_supplier?.supplier?.legal_name || 'Fornecedor'}
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
                                <p><span className="font-medium">Prazo de entrega:</span> {cotacao.expected_delivery_date ? new Date(cotacao.expected_delivery_date).toLocaleDateString('pt-AO') : 'N/A'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Título e Descrição */}
                    {/* Título e Descrição */}
                    <div className="mb-6">
                        <h3 className="font-semibold text-gray-900 mb-2">Título da Cotação:</h3>
                        <p className="text-gray-700">{cotacao.quotation_supplier?.quotation_request?.title || cotacao.quotation_request?.title || 'N/A'}</p>

                        {(cotacao.quotation_supplier?.quotation_request?.description || cotacao.quotation_request?.description) && (
                            <>
                                <h3 className="font-semibold text-gray-900 mt-4 mb-2">Descrição:</h3>
                                <p className="text-gray-700">{cotacao.quotation_supplier?.quotation_request?.description || cotacao.quotation_request?.description}</p>
                            </>
                        )}
                    </div>

                    {/* Tabela de Produtos */}
                    <div className="mb-6 pb-6 border-b-2 border-dashed border-gray-200">
                        <div className="grid grid-cols-12 gap-4 font-bold text-gray-900 mb-4">
                            <div className="col-span-4">Produtos:</div>
                            <div className="col-span-4">Descrição:</div>
                            <div className="col-span-2 text-right">Unitário:</div>
                            <div className="col-span-2 text-right">Total:</div>
                        </div>

                        {cotacao.items && cotacao.items.length > 0 ? (
                            <div className="space-y-4">
                                {cotacao.items.map((item, index) => {
                                    // Try to get item details from the nested quotation_item object (priority)
                                    // or find it in the original request items array (fallback)
                                    const requestItem = item.quotation_item || cotacao.quotation_supplier?.quotation_request?.items?.find(
                                        r => r.id === item.quotation_item_id
                                    );

                                    const quantity = parseFloat(requestItem?.quantity || item.quantity || 1);
                                    let unitPrice = parseFloat(item.unit_price || item.price || 0);

                                    // Heuristic: If we have a total_amount for the whole quote but 0 for unit price,
                                    // try to distribute it or assign it to the single item.
                                    if (unitPrice === 0 && (cotacao.total_amount || cotacao.amount)) {
                                        const total = parseFloat(cotacao.total_amount || cotacao.amount);
                                        if (total > 0) {
                                            if (cotacao.items.length === 1 && quantity > 0) {
                                                // Single item: exact match
                                                unitPrice = total / quantity;
                                            } else if (cotacao.items.length > 1 && quantity > 0) {
                                                // Multiple items: This is technically inaccurate, but if the user demands "add the price",
                                                // and we ONLY have the grand total, we can try to distribute it explicitly OR
                                                // check if there's a stored 'estimated_price' from the request fallback we might have missed.

                                                // Better heuristic: if we have prices on SOME items, don't overwrite. 
                                                // If ALL items are 0, distribute evenly? No, that's misleading.

                                                // Let's at least check 'item.estimated_price' again very explicitly.
                                                unitPrice = parseFloat(item.estimated_price || 0);

                                                // Final fallback: If still 0, and we really want to show *something* that sums up?
                                                // No, showing 0.00 on multi-item lines is safer than lying.
                                                // However, the screenshot shows 2 items (Caneta/Borracha) and Total 5000.
                                                // The user wants unit prices. 
                                                // If the technician view is restricted, we LITERALLY DO NOT HAVE THEM.
                                                // I will leave it as 0.00 for multi-item unless estimated_price saves us.
                                            }
                                        }
                                    }

                                    const lineTotal = quantity * unitPrice;

                                    return (
                                        <div key={index} className="grid grid-cols-12 gap-4 text-sm text-gray-700 items-center">
                                            <div className="col-span-4">
                                                <span className="text-gray-900">
                                                    {String(index + 1).padStart(2, '0')} - {requestItem ? requestItem.name : (item.name || item.product_name || `Item #${item.quotation_item_id || index + 1}`)}
                                                </span>
                                                {requestItem && (
                                                    <span className="text-gray-600 ml-1">
                                                        ({requestItem.quantity} {requestItem.unit || 'uni'})
                                                    </span>
                                                )}
                                            </div>
                                            <div className="col-span-4 text-gray-600">
                                                {requestItem?.specifications || item.notes || item.description || item.specifications || '-'}
                                            </div>
                                            <div className="col-span-2 text-right font-medium text-gray-900">
                                                {(unitPrice !== undefined && unitPrice !== null) ? `${unitPrice.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} AOA` : '---'}
                                            </div>
                                            <div className="col-span-2 text-right font-bold text-gray-900">
                                                {(lineTotal !== undefined && lineTotal !== null) ? `${lineTotal.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} AOA` : '---'}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-gray-500 text-sm">Nenhum item cotado.</p>
                        )}
                    </div>

                    {/* Documentos */}
                    <div className="mb-6 pb-6 border-b border-gray-200">
                        <h3 className="font-semibold text-gray-900 mb-4">Documento da Proposta:</h3>
                        <button
                            onClick={async () => {
                                try {
                                    setViewingDoc(true);

                                    setViewingDoc(true);

                                    setViewingDoc(true);

                                    // Aggressive ID Resolution Strategy
                                    // 1. Check strict quotation_response_id (common in Acquisition objects)
                                    // 2. Check inside quotation_supplier relationship (sometimes nested)
                                    // 3. Fallback to .id only if it looks like a Response object (or we have no choice)
                                    const candidateId =
                                        cotacao.quotation_response_id ||
                                        cotacao.quotation_supplier?.quotation_response_id ||
                                        cotacao.quotation_supplier?.id || // Sometimes the pivots share IDs, risky but better than 1
                                        cotacao.id;

                                    // Refinement: If we are in Acquisition mode (isAcquisition=true), and candidateId is the same as the Acquisition ID (cotacao.id),
                                    // AND we have a suspicious low number (like 1), it might be wrong. 
                                    // But we can't be sure. The safest is to rely on the sequence above.

                                    const responseId = candidateId;

                                    console.log('Visualizar Documento Debug:', {
                                        isAcquisition,
                                        hasQRId: !!cotacao.quotation_response_id,
                                        hasQSupp: !!cotacao.quotation_supplier,
                                        rootId: cotacao.id,
                                        resolvedId: responseId
                                    });

                                    if (!responseId) {
                                        alert("ID da proposta não encontrado.");
                                        setViewingDoc(false);
                                        return;
                                    }

                                    const url = `/quotation-responses/${responseId}/document`;

                                    // Force authenticated fetch via Axios (api instance)
                                    const response = await api.get(url, {
                                        responseType: 'blob',
                                        headers: {
                                            'Accept': 'application/pdf, image/*',
                                        }
                                    });

                                    const blob = new Blob([response.data], { type: response.headers['content-type'] });
                                    const objectUrl = window.URL.createObjectURL(blob);
                                    window.open(objectUrl, '_blank');
                                    setTimeout(() => window.URL.revokeObjectURL(objectUrl), 10000);
                                } catch (error) {
                                    console.error("Erro ao abrir documento:", error);
                                    let msg = "Erro ao carregar o documento.";
                                    const usedId = cotacao.quotation_response_id || cotacao.id;

                                    if (error.response?.status === 404) {
                                        msg = `Documento não encontrado (ID: ${usedId}).`;
                                    } else if (error.response?.status === 400) {
                                        msg = `Requisição inválida (ID: ${usedId}).`;
                                    } else if (error.response?.status === 403 || error.response?.status === 401) {
                                        msg = "Sem permissão para visualizar este documento.";
                                    }

                                    alert(msg);
                                } finally {
                                    setViewingDoc(false);
                                }
                            }}
                            disabled={viewingDoc}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-medium border border-blue-200"
                        >
                            <FileText size={18} />
                            {viewingDoc ? 'Carregando...' : 'Visualizar Proposta (PDF/Imagem)'}
                        </button>
                    </div>

                    {/* Total */}
                    <div className="flex justify-end items-center mt-4">
                        <span className="text-xl font-bold text-gray-900 mr-2">Total:</span>
                        <span className="text-4xl font-black text-black tracking-tight">
                            {(() => {
                                const calculated = cotacao.items && cotacao.items.length > 0 ? calcularTotal() : '0,00';
                                if (calculated === '0,00' && (cotacao.total_amount || cotacao.amount)) {
                                    return parseFloat(cotacao.total_amount || cotacao.amount).toLocaleString('pt-AO', { minimumFractionDigits: 2 }).replace('.', ',');
                                }
                                return calculated;
                            })()} AOA
                        </span>
                    </div>
                </div>

                {/* Footer com botões */}
                <div className="px-8 py-6 border-t border-gray-100 flex items-center justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
                    >
                        Fechar
                    </button>

                    {onRejeitar && (
                        <button
                            onClick={handleRejeitar}
                            className="px-6 py-2.5 bg-red-50 text-red-600 border border-red-100 rounded-lg hover:bg-red-100 transition-colors font-medium text-sm flex items-center gap-2"
                        >
                            <XCircle size={18} />
                            Rejeitar
                        </button>
                    )}

                    {onSolicitarRevisao && (
                        <button
                            onClick={handleSolicitarRevisao}
                            className="px-6 py-2.5 bg-amber-50 text-amber-700 border border-amber-100 rounded-lg hover:bg-amber-100 transition-colors font-medium text-sm flex items-center gap-2"
                        >
                            <MessageSquare size={18} />
                            Solicitar Revisão
                        </button>
                    )}

                    {onAprovar && (
                        <button
                            onClick={handleAprovar}
                            className="px-6 py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg hover:bg-emerald-100 transition-colors font-medium text-sm flex items-center gap-2"
                        >
                            <CheckCircle size={18} />
                            Aprovar
                        </button>
                    )}

                    {onGerarAquisicao && (
                        <button
                            onClick={handleGerarAquisicao}
                            className="px-6 py-2.5 bg-[#44B16F] text-white rounded-lg hover:bg-[#3a9d5f] transition-colors font-medium text-sm shadow-sm flex items-center gap-2"
                        >
                            <ShoppingCart size={18} />
                            Gerar Aquisição
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
