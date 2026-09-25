import { useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle, XCircle, MessageSquare, ShoppingCart, FileText } from 'lucide-react';
import api from '../../services/api';
import { useModalLock } from '../../hooks/useModalLock';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../utils/apiHelpers';

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
    const toast = useToast();
    useModalLock(isOpen);

    if (!isOpen || !cotacao) return null;

    const cotacaoId = cotacao.id != null ? `CT - ${String(cotacao.id).padStart(3, '0')}` : 'N/A';
    const ppReference = cotacao.quotation_supplier?.quotation_request?.reference
        || cotacao.quotation_request?.reference
        || cotacao.quotation_supplier?.quotation_request?.activity_description
        || cotacao.reference
        || cotacao.activity_description
        || null;
    const systemReferenceRaw = cotacao.quotation_supplier?.quotation_request?.reference_number
        || cotacao.quotation_request?.reference_number
        || cotacao.reference_number
        || null;
    const systemReference = (systemReferenceRaw && systemReferenceRaw !== ppReference) ? systemReferenceRaw : cotacaoId;
    const submissionDate = cotacao.submitted_at || cotacao.created_at
        || cotacao.quotation_supplier?.quotation_request?.submitted_at
        || cotacao.quotation_supplier?.quotation_request?.created_at
        || null;

    const getAcquisitionStatusLabel = (status) => {
        const labels = {
            pending: 'Pendente',
            in_progress: 'Em Progresso',
            completed: 'Concluída',
            delivered: 'Entregue',
            cancelled: 'Cancelada',
        };
        return labels[status] || status || '—';
    };

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

    const handleViewDocument = async () => {
        const responseId = cotacao.quotation_response_id
            || cotacao.response_id
            || cotacao.quotation_supplier?.quotation_response_id
            || cotacao.id
            || cotacao.quotation_supplier?.id
            || null;

        if (viewingDoc) return;
        if (!responseId) {
            toast.error('ID da resposta de cotação não encontrado. Verifique se esta proposta tem um documento associado.');
            return;
        }

        // Abre a janela já no clique (antes do pedido assíncrono) para não ser bloqueada pelo navegador
        const newWindow = window.open('', '_blank');
        setViewingDoc(true);
        try {
            const response = await api.get(`/quotation-responses/${responseId}/document`, {
                responseType: 'blob',
                headers: {
                    'Accept': 'application/pdf, image/*',
                }
            });

            const blob = new Blob([response.data], { type: response.headers['content-type'] });
            const objectUrl = window.URL.createObjectURL(blob);

            if (newWindow && !newWindow.closed) {
                newWindow.location.href = objectUrl;
            } else {
                window.open(objectUrl, '_blank');
            }
            setTimeout(() => window.URL.revokeObjectURL(objectUrl), 60000);
        } catch (error) {
            console.error("Erro ao abrir documento:", error);
            if (newWindow && !newWindow.closed) newWindow.close();

            // Pedido em blob: a mensagem do servidor não é legível, usar mensagens específicas
            const status = error.response?.status;
            let msg;
            if (status === 404) {
                msg = `Documento não encontrado (ID da resposta: ${responseId}).`;
            } else if (status === 400) {
                msg = `Pedido inválido (ID usado: ${responseId}).`;
            } else if (status === 403 || status === 401) {
                msg = "Sem permissão para visualizar este documento.";
            } else {
                msg = getErrorMessage(error.response ? { response: { status } } : error, "Erro ao carregar o documento.");
            }
            toast.error(msg);
        } finally {
            setViewingDoc(false);
        }
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
                                <p className="font-medium">{cotacao.quotation_supplier?.supplier?.company_name || cotacao.quotation_supplier?.supplier?.commercial_name || cotacao.quotation_supplier?.supplier?.legal_name || cotacao.supplier?.company_name || cotacao.supplier?.commercial_name || cotacao.supplier?.legal_name || 'N/A'}</p>
                                <p>{cotacao.quotation_supplier?.supplier?.address || cotacao.supplier?.address || 'Endereço não disponível'}</p>
                                <p>{cotacao.quotation_supplier?.supplier?.phone || cotacao.supplier?.phone || '---'}</p>
                            </div>
                        </div>

                        {/* Detalhes */}
                        <div>
                            <h3 className="font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>Detalhes:</h3>
                            <div className="text-sm space-y-1" style={{ color: 'var(--color-text-secondary)' }}>
                                {isAcquisition ? (
                                    <>
                                        <p><span className="font-medium">Referência Aquisição:</span> {cotacao.reference_number || `ACQ-${String(cotacao.id).padStart(3, '0')}`}</p>
                                        <p><span className="font-medium">Referência PP:</span> {cotacao.quotation_request?.activity_description || cotacao.quotation_request?.reference || cotacao.quotation_supplier?.quotation_request?.activity_description || cotacao.quotation_supplier?.quotation_request?.reference || '—'}</p>
                                        <p><span className="font-medium">Estado:</span> {getAcquisitionStatusLabel(cotacao.status)}</p>
                                        <p><span className="font-medium">Data de Criação:</span> {submissionDate ? new Date(submissionDate).toLocaleDateString('pt-AO') : 'N/A'}</p>
                                        <p><span className="font-medium">Entrega Prevista:</span> {cotacao.expected_delivery_date ? new Date(cotacao.expected_delivery_date).toLocaleDateString('pt-AO') : 'N/A'}</p>
                                        <p><span className="font-medium">Entrega Real:</span> {cotacao.actual_delivery_date ? new Date(cotacao.actual_delivery_date).toLocaleDateString('pt-AO') : (cotacao.status === 'completed' || cotacao.status === 'delivered' ? 'Entregue' : 'Ainda não entregue')}</p>
                                    </>
                                ) : (
                                    <>
                                        <p><span className="font-medium">ID:</span> {cotacaoId}</p>
                                        <p><span className="font-medium">Referência PP:</span> {ppReference || '—'}</p>
                                        <p><span className="font-medium">Referência do Sistema:</span> {systemReference}</p>
                                        <p><span className="font-medium">Data de Submissão:</span> {submissionDate ? new Date(submissionDate).toLocaleDateString('pt-AO') : 'N/A'}</p>
                                        <p><span className="font-medium">Prazo de entrega:</span> {cotacao.delivery_date || cotacao.expected_delivery_date ? new Date(cotacao.delivery_date || cotacao.expected_delivery_date).toLocaleDateString('pt-AO') : 'N/A'}</p>
                                    </>
                                )}
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

                        {isAcquisition && cotacao.justification && (
                            <>
                                <h3 className="font-semibold mt-4 mb-2" style={{ color: 'var(--color-text-primary)' }}>Justificação:</h3>
                                <p style={{ color: 'var(--color-text-secondary)' }}>{cotacao.justification}</p>
                            </>
                        )}
                    </div>

                    {/* Documentos */}
                    <div className="mb-6 pb-6" style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <h3 className="font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>Documento da Proposta:</h3>
                        <button
                            onClick={handleViewDocument}
                            disabled={viewingDoc}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium border disabled:opacity-60"
                            style={{ background: 'rgba(59,130,246,0.08)', color: '#3b82f6', borderColor: 'rgba(59,130,246,0.2)' }}
                        >
                            <FileText size={18} />
                            {viewingDoc ? 'A carregar...' : 'Visualizar Proposta (PDF/Imagem)'}
                        </button>
                    </div>

                    {/* Total removido — as cotações já não exibem valores */}
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
