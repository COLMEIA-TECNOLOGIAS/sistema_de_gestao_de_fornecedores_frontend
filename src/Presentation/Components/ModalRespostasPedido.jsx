import { useState, useEffect } from "react";
import { X, MoreVertical, FileText, Trash2, CheckCircle, MessageSquare, RefreshCw } from "lucide-react";
import { quotationResponsesAPI } from "../../services/api";
import FornecedorTableSkeleton from "./FornecedorTableSkeleton";

export default function ModalRespostasPedido({
    isOpen,
    onClose,
    quotationRequestId,
    quotationRequestTitle,
    onOpenRevisarModal,
    onAprovar,
    onRejeitar,
    onSolicitarRevisao,
    onGerarAquisicao
}) {
    const [respostas, setRespostas] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [openMenuId, setOpenMenuId] = useState(null);

    // Fetch responses when modal opens or quotation request changes
    useEffect(() => {
        if (isOpen && quotationRequestId) {
            fetchRespostas();
        }
    }, [isOpen, quotationRequestId]);

    const fetchRespostas = async () => {
        try {
            setIsLoading(true);
            setError(null);

            // Fetch responses filtered by quotation_request_id
            const response = await quotationResponsesAPI.getAll({
                quotation_request_id: quotationRequestId
            });

            setRespostas(response.data || []);
        } catch (err) {
            console.error('Error fetching responses:', err);
            setError(err.message || 'Erro ao carregar respostas');
        } finally {
            setIsLoading(false);
        }
    };

    // Close dropdown menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (openMenuId && !event.target.closest('.dropdown-menu')) {
                setOpenMenuId(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [openMenuId]);

    const getStatusColor = (status) => {
        const statusColors = {
            "submitted": "bg-gray-100 text-gray-700",
            "approved": "bg-green-100 text-green-700",
            "rejected": "bg-red-100 text-red-700",
            "pending": "bg-yellow-100 text-yellow-700",
            "revision_requested": "bg-amber-100 text-amber-700",
            "needs_revision": "bg-gray-100 text-gray-700",
        };
        return statusColors[status] || "bg-gray-100 text-gray-700";
    };

    const getStatusLabel = (status) => {
        const labels = {
            'pending': 'Pendente',
            'submitted': 'Submetido',
            'approved': 'Aprovada',
            'rejected': 'Rejeitada',
            'revision_requested': 'Revisão Solicitada',
            'needs_revision': 'Revisão Necessária',
        };
        return labels[status] || status;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                            Respostas de Cotação
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">
                            {quotationRequestTitle || `Pedido #${quotationRequestId}`}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X size={24} className="text-gray-600" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-auto p-6">
                    {error && (
                        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-red-600 text-sm">
                                <strong>Erro:</strong> {error}
                            </p>
                        </div>
                    )}

                    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4 text-left">
                                            <input type="checkbox" className="rounded border-gray-300" />
                                        </th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">ID</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Fornecedor</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Valor Total</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Prazo Entrega</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Data Resposta</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Status</th>
                                        <th className="px-6 py-4 text-center text-sm font-semibold text-gray-600">Acções</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {isLoading ? (
                                        <FornecedorTableSkeleton rows={3} />
                                    ) : respostas.length === 0 ? (
                                        <tr>
                                            <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                                                <div className="flex flex-col items-center gap-2">
                                                    <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                                    </svg>
                                                    <p className="text-lg font-medium">Nenhuma resposta encontrada</p>
                                                    <p className="text-sm">Este pedido ainda não recebeu respostas dos fornecedores</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        respostas.map((resposta) => (
                                            <tr key={resposta.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-6">
                                                    <input type="checkbox" className="rounded border-gray-300" />
                                                </td>
                                                <td className="px-6 py-6">
                                                    <span className="font-medium text-gray-700">#{resposta.id}</span>
                                                </td>
                                                <td className="px-6 py-6">
                                                    <div className="flex items-center gap-3">
                                                        <img
                                                            src={`https://api.dicebear.com/7.x/initials/svg?seed=${resposta.quotation_supplier?.supplier?.commercial_name || resposta.supplier?.commercial_name || 'N/A'}`}
                                                            alt={resposta.quotation_supplier?.supplier?.commercial_name || resposta.supplier?.commercial_name}
                                                            className="w-8 h-8 rounded-lg"
                                                        />
                                                        <span className="text-gray-700">
                                                            {resposta.quotation_supplier?.supplier?.commercial_name ||
                                                                resposta.supplier?.commercial_name ||
                                                                resposta.quotation_supplier?.supplier?.legal_name ||
                                                                resposta.supplier?.legal_name ||
                                                                'Fornecedor N/A'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-6 text-gray-700 font-medium">
                                                    {resposta.history && resposta.history.length > 0
                                                        ? `${parseFloat(resposta.history[0].total_amount || 0).toLocaleString('pt-AO', { minimumFractionDigits: 2 })} AOA`
                                                        : resposta.total_amount
                                                            ? `${parseFloat(resposta.total_amount).toLocaleString('pt-AO', { minimumFractionDigits: 2 })} AOA`
                                                            : 'N/A'}
                                                </td>
                                                <td className="px-6 py-6 text-gray-700">
                                                    {resposta.delivery_days ? `${resposta.delivery_days} dias` : 'N/A'}
                                                </td>
                                                <td className="px-6 py-6 text-gray-700">
                                                    {resposta.submitted_at || resposta.created_at ? new Date(resposta.submitted_at || resposta.created_at).toLocaleDateString('pt-AO', {
                                                        day: '2-digit',
                                                        month: '2-digit',
                                                        year: 'numeric'
                                                    }) : 'N/A'}
                                                </td>
                                                <td className="px-6 py-6">
                                                    <span className={`px-4 py-2 rounded-xl text-sm font-medium ${getStatusColor(resposta.status)}`}>
                                                        {getStatusLabel(resposta.status)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-6">
                                                    <div className="relative flex justify-center dropdown-menu">
                                                        <button
                                                            onClick={() => setOpenMenuId(openMenuId === `resp-${resposta.id}` ? null : `resp-${resposta.id}`)}
                                                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                                        >
                                                            <MoreVertical size={20} className="text-gray-600" />
                                                        </button>

                                                        {openMenuId === `resp-${resposta.id}` && (
                                                            <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50">
                                                                {/* Revisar */}
                                                                <button
                                                                    onClick={() => {
                                                                        onOpenRevisarModal(resposta);
                                                                        setOpenMenuId(null);
                                                                        onClose(); // Close the modal when "Revisar" is clicked
                                                                    }}
                                                                    className="w-full px-4 py-2.5 text-left hover:bg-gray-50 text-sm flex items-center gap-3 transition-colors"
                                                                >
                                                                    <FileText size={16} className="text-gray-400" />
                                                                    <span className="text-gray-700">Revisar</span>
                                                                </button>

                                                                {/* Rejeitar proposta */}
                                                                <button
                                                                    onClick={() => {
                                                                        onRejeitar(resposta.id);
                                                                        setOpenMenuId(null);
                                                                    }}
                                                                    className="w-full px-4 py-2.5 text-left hover:bg-gray-50 text-sm flex items-center gap-3 transition-colors"
                                                                >
                                                                    <Trash2 size={16} className="text-gray-400" />
                                                                    <span className="text-gray-700">Rejeitar proposta</span>
                                                                </button>

                                                                {/* Aprovar proposta */}
                                                                <button
                                                                    onClick={() => {
                                                                        onAprovar(resposta.id);
                                                                        setOpenMenuId(null);
                                                                    }}
                                                                    className="w-full px-4 py-2.5 text-left hover:bg-gray-50 text-sm flex items-center gap-3 transition-colors"
                                                                >
                                                                    <CheckCircle size={16} className="text-gray-400" />
                                                                    <span className="text-gray-700">Aprovar proposta</span>
                                                                </button>

                                                                {/* Solicitar revisão */}
                                                                <button
                                                                    onClick={() => {
                                                                        onSolicitarRevisao(resposta.id);
                                                                        setOpenMenuId(null);
                                                                    }}
                                                                    className="w-full px-4 py-2.5 text-left hover:bg-gray-50 text-sm flex items-center gap-3 transition-colors"
                                                                >
                                                                    <MessageSquare size={16} className="text-gray-400" />
                                                                    <span className="text-gray-700">Solicitar revisão</span>
                                                                </button>

                                                                {/* Gerar aquisição */}
                                                                <button
                                                                    onClick={() => {
                                                                        onGerarAquisicao(resposta.id);
                                                                        setOpenMenuId(null);
                                                                    }}
                                                                    className="w-full px-4 py-2.5 text-left hover:bg-gray-50 text-sm flex items-center gap-3 transition-colors"
                                                                >
                                                                    <RefreshCw size={16} className="text-gray-400" />
                                                                    <span className="text-gray-700">Gerar aquisição</span>
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
}
