import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle, XCircle, MessageSquare, ShoppingCart, FileText } from 'lucide-react';
import api from '../../services/api';
import { useModalLock } from '../../hooks/useModalLock';

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
    useModalLock(isOpen);

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

    return createPortal(
        <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 9999 }}>
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative rounded-2xl shadow-2xl w-full max-w-4xl mx-4 animate-fadeIn max-h-[90vh] overflow-hidden flex flex-col" style={{ background: 'var(--color-surface)' }}>
                {/* Header */}
                <div className="flex items-start justify-between px-8 py-6" style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                    <div className="flex-1">
                        <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
                            {isAcquisition ? 'Aquisição' : 'Pedido de cotação'} - {cotacao.quotation_supplier?.supplier?.commercial_name || cotacao.quotation_supplier?.supplier?.legal_name || cotacao.supplier?.commercial_name || cotacao.supplier?.legal_name || 'Fornecedor'}
                        </h2>

                        {/* Endereço do fornecedor */}
                        <div className="text-sm space-y-1" style={{ color: 'var(--color-text-secondary)' }}>
                            <p>{cotacao.quotation_supplier?.supplier?.province || cotacao.supplier?.province || 'Angola'} - {cotacao.quotation_supplier?.supplier?.municipality || cotacao.supplier?.municipality || 'Luanda'}</p>
                            <p>{cotacao.quotation_supplier?.supplier?.address || cotacao.supplier?.address || 'Endereço não disponível'}</p>
                            <p>{cotacao.quotation_supplier?.supplier?.phone || cotacao.supplier?.phone || '---'}</p>
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
                    <div className="grid grid-cols-3 gap-6 mb-6 pb-6" style={{ borderBottom: '1px solid var(--color-border)' }}>
                        {/* Solicitado por */}
                        <div>
                            <h3 className="font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>Solicitado por:</h3>
                            <div className="text-sm space-y-1" style={{ color: 'var(--color-text-secondary)' }}>
                                <p className="font-medium">MOSAP3</p>
                                <p>Avenida Rei Katyavala, Edifício Avenca Plaza Nº43/45, 3º Andar Maculusso -Luanda.</p>
                            </div>
                        </div>

                        {/* Enviado para */}
                        <div>
                            <h3 className="font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>Enviado para:</h3>
                            <div className="text-sm space-y-1" style={{ color: 'var(--color-text-secondary)' }}>
                                <p className="font-medium">{cotacao.quotation_supplier?.supplier?.commercial_name || cotacao.quotation_supplier?.supplier?.legal_name || cotacao.supplier?.commercial_name || cotacao.supplier?.legal_name || 'N/A'}</p>
                                <p>{cotacao.quotation_supplier?.supplier?.address || cotacao.supplier?.address || 'Endereço não disponível'}</p>
                                <p>{cotacao.quotation_supplier?.supplier?.phone || cotacao.supplier?.phone || '---'}</p>
                            </div>
                        </div>

                        {/* Detalhes */}
                        <div>
                            <h3 className="font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>Detalhes:</h3>
                            <div className="text-sm space-y-1" style={{ color: 'var(--color-text-secondary)' }}>
                                <p><span className="font-medium">ID:</span> CT - {String(cotacao.id).padStart(3, '0')}</p>
                                <p><span className="font-medium">Data:</span> {cotacao.submitted_at ? new Date(cotacao.submitted_at).toLocaleDateString('pt-AO') : 'N/A'}</p>
                                <p><span className="font-medium">Prazo de entrega:</span> {cotacao.expected_delivery_date ? new Date(cotacao.expected_delivery_date).toLocaleDateString('pt-AO') : 'N/A'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Título e Descrição */}
                    <div className="mb-6">
                        <h3 className="font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>Título da Cotação:</h3>
                        <p style={{ color: 'var(--color-text-secondary)' }}>{cotacao.quotation_supplier?.quotation_request?.title || cotacao.quotation_request?.title || cotacao.title || 'N/A'}</p>

                        {(cotacao.quotation_supplier?.quotation_request?.description || cotacao.quotation_request?.description || cotacao.description) && (
                            <>
                                <h3 className="font-semibold mt-4 mb-2" style={{ color: 'var(--color-text-primary)' }}>Descrição:</h3>
                                <p style={{ color: 'var(--color-text-secondary)' }}>{cotacao.quotation_supplier?.quotation_request?.description || cotacao.quotation_request?.description || cotacao.description}</p>
                            </>
                        )}
                    </div>

                    {/* Tabela de Produtos */}
                    {!isAcquisition && (
                        <div className="mb-6 pb-6" style={{ borderBottom: '2px dashed var(--color-border)' }}>
                            <div className="grid grid-cols-12 gap-4 font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
                                <div className="col-span-4">Produtos:</div>
                                <div className="col-span-4">Descrição:</div>
                                <div className="col-span-2 text-right">Unitário:</div>
                                <div className="col-span-2 text-right">Total:</div>
                            </div>

                            {cotacao.items && cotacao.items.length > 0 ? (
                                <div className="space-y-4">
                                    {cotacao.items.map((item, index) => {
                                        const requestItem = item.quotation_item || cotacao.quotation_supplier?.quotation_request?.items?.find(
                                            r => r.id === item.quotation_item_id
                                        );

                                        const quantity = parseFloat(requestItem?.quantity || item.quantity || 1);
                                        let unitPrice = parseFloat(item.unit_price || item.price || 0);

                                        if (unitPrice === 0 && (cotacao.total_amount || cotacao.amount)) {
                                            const total = parseFloat(cotacao.total_amount || cotacao.amount);
                                            if (total > 0) {
                                                if (cotacao.items.length === 1 && quantity > 0) {
                                                    unitPrice = total / quantity;
                                                } else if (cotacao.items.length > 1 && quantity > 0) {
                                                    unitPrice = parseFloat(item.estimated_price || 0);
                                                }
                                            }
                                        }

                                        const lineTotal = quantity * unitPrice;

                                        return (
                                            <div key={index} className="grid grid-cols-12 gap-4 text-sm items-center" style={{ color: 'var(--color-text-secondary)' }}>
                                                <div className="col-span-4">
                                                    <span style={{ color: 'var(--color-text-primary)' }}>
                                                        {String(index + 1).padStart(2, '0')} - {requestItem ? requestItem.name : (item.name || item.product_name || `Item #${item.quotation_item_id || index + 1}`)}
                                                    </span>
                                                    {requestItem && (
                                                        <span className="ml-1" style={{ color: 'var(--color-text-secondary)' }}>
                                                            ({requestItem.quantity} {requestItem.unit || 'uni'})
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="col-span-4" style={{ color: 'var(--color-text-secondary)' }}>
                                                    {requestItem?.specifications || item.notes || item.description || item.specifications || '-'}
                                                </div>
                                                <div className="col-span-2 text-right font-medium" style={{ color: 'var(--color-text-primary)' }}>
                                                    {(unitPrice !== undefined && unitPrice !== null) ? `${unitPrice.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} AOA` : '---'}
                                                </div>
                                                <div className="col-span-2 text-right font-bold" style={{ color: 'var(--color-text-primary)' }}>
                                                    {(lineTotal !== undefined && lineTotal !== null) ? `${lineTotal.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} AOA` : '---'}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Nenhum item cotado.</p>
                            )}
                        </div>
                    )}

                    {/* Documentos */}
                    <div className="mb-6 pb-6" style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <h3 className="font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>Documento da Proposta:</h3>
                        <button
                            onClick={async () => {
                                try {
                                    setViewingDoc(true);

                                    console.group('📄 Documento da Proposta - Debug Info');
                                    console.log('1. Cotacao object:', cotacao);
                                    console.log('2. Is Acquisition?', isAcquisition);

                                    const idSources = {
                                        direct_qr_id: cotacao.quotation_response_id,
                                        qs_qr_id: cotacao.quotation_supplier?.quotation_response_id,
                                        qs_pivot_id: cotacao.quotation_supplier?.id,
                                        root_id: cotacao.id,
                                        response_id: cotacao.response_id
                                    };

                                    console.log('3. Available ID sources:', idSources);

                                    let responseId = null;
                                    let idSource = null;

                                    if (cotacao.quotation_response_id) {
                                        responseId = cotacao.quotation_response_id;
                                        idSource = 'quotation_response_id';
                                    } else if (cotacao.response_id) {
                                        responseId = cotacao.response_id;
                                        idSource = 'response_id';
                                    } else if (cotacao.quotation_supplier?.quotation_response_id) {
                                        responseId = cotacao.quotation_supplier.quotation_response_id;
                                        idSource = 'quotation_supplier.quotation_response_id';
                                    } else if (cotacao.id) {
                                        responseId = cotacao.id;
                                        idSource = 'cotacao.id (fallback)';
                                    } else if (cotacao.quotation_supplier?.id) {
                                        responseId = cotacao.quotation_supplier.id;
                                        idSource = 'quotation_supplier.id (pivot - risky)';
                                    }

                                    console.log('4. Resolved ID:', responseId);
                                    console.log('5. ID Source:', idSource);

                                    if (!responseId) {
                                        console.error('❌ No valid response ID found!');
                                        console.groupEnd();
                                        alert("Erro: ID da resposta de cotação não encontrado. Verifique se esta proposta tem um documento associado.");
                                        setViewingDoc(false);
                                        return;
                                    }

                                    const url = `/quotation-responses/${responseId}/document`;
                                    console.log('6. API URL:', url);

                                    const response = await api.get(url, {
                                        responseType: 'blob',
                                        headers: {
                                            'Accept': 'application/pdf, image/*',
                                        }
                                    });

                                    console.log('7. Response received:', {
                                        status: response.status,
                                        contentType: response.headers['content-type'],
                                        size: response.data.size
                                    });

                                    const blob = new Blob([response.data], { type: response.headers['content-type'] });
                                    const objectUrl = window.URL.createObjectURL(blob);

                                    console.log('8. Opening document in new tab...');
                                    console.groupEnd();

                                    window.open(objectUrl, '_blank');
                                    setTimeout(() => window.URL.revokeObjectURL(objectUrl), 10000);
                                } catch (error) {
                                    console.error("❌ Erro ao abrir documento:", error);
                                    console.groupEnd();

                                    let msg = "Erro ao carregar o documento.";
                                    const responseId = cotacao.quotation_response_id || cotacao.response_id || cotacao.id;

                                    if (error.response?.status === 404) {
                                        msg = `Documento não encontrado.\n\nID da Resposta: ${responseId}`;
                                    } else if (error.response?.status === 400) {
                                        msg = `Requisição inválida.\n\nID usado: ${responseId}`;
                                    } else if (error.response?.status === 403 || error.response?.status === 401) {
                                        msg = "Sem permissão para visualizar este documento.";
                                    } else if (error.code === 'ERR_NETWORK') {
                                        msg = "Erro de conexão com o servidor.";
                                    }

                                    alert(msg);
                                } finally {
                                    setViewingDoc(false);
                                }
                            }}
                            disabled={viewingDoc}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium border"
                            style={{ background: 'rgba(59,130,246,0.08)', color: '#3b82f6', borderColor: 'rgba(59,130,246,0.2)' }}
                        >
                            <FileText size={18} />
                            {viewingDoc ? 'Carregando...' : 'Visualizar Proposta (PDF/Imagem)'}
                        </button>
                    </div>

                    {/* Total */}
                    {!isAcquisition && (
                        <div className="flex justify-end items-center mt-4">
                            <span className="text-xl font-bold mr-2" style={{ color: 'var(--color-text-primary)' }}>Total:</span>
                            <span className="text-4xl font-black tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
                                {(() => {
                                    const calculated = cotacao.items && cotacao.items.length > 0 ? calcularTotal() : '0,00';
                                    if (calculated === '0,00' && (cotacao.total_amount || cotacao.amount)) {
                                        return parseFloat(cotacao.total_amount || cotacao.amount).toLocaleString('pt-AO', { minimumFractionDigits: 2 }).replace('.', ',');
                                    }
                                    return calculated;
                                })()} AOA
                            </span>
                        </div>
                    )}
                </div>

                {/* Footer com botões */}
                <div className="px-8 py-6 flex items-center justify-end gap-3" style={{ borderTop: '1px solid var(--color-border-light)' }}>
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-lg transition-colors font-medium text-sm"
                        style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', background: 'transparent' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                        Fechar
                    </button>

                    {onRejeitar && (
                        <button
                            onClick={handleRejeitar}
                            className="px-6 py-2.5 rounded-lg transition-colors font-medium text-sm flex items-center gap-2"
                            style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}
                        >
                            <XCircle size={18} />
                            Rejeitar
                        </button>
                    )}

                    {onSolicitarRevisao && (
                        <button
                            onClick={handleSolicitarRevisao}
                            className="px-6 py-2.5 rounded-lg transition-colors font-medium text-sm flex items-center gap-2"
                            style={{ background: 'rgba(245,158,11,0.08)', color: '#d97706', border: '1px solid rgba(245,158,11,0.2)' }}
                        >
                            <MessageSquare size={18} />
                            Solicitar Revisão
                        </button>
                    )}

                    {onAprovar && (
                        <button
                            onClick={handleAprovar}
                            className="px-6 py-2.5 rounded-lg transition-colors font-medium text-sm flex items-center gap-2"
                            style={{ background: 'rgba(68,177,111,0.08)', color: '#44B16F', border: '1px solid rgba(68,177,111,0.2)' }}
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
        </div>,
        document.body
    );
}
