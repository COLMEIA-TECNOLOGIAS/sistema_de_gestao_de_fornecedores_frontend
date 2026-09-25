import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import { X, TrendingUp, BarChart2 } from 'lucide-react';
import { productsAPI } from '../../services/api';
import { useModalLock } from '../../hooks/useModalLock';
import { queryKeys } from '../../lib/queryKeys';
import { getErrorMessage, unwrap } from '../../utils/apiHelpers';

const formatPrice = (value, options) => {
    const number = parseFloat(value);
    return Number.isNaN(number) ? '---' : `${number.toLocaleString('pt-AO', options)} AOA`;
};

const formatDate = (value) => {
    if (!value) return '—';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('pt-AO');
};

export default function ModalProdutoAnalytics({ isOpen, onClose, product }) {
    const productId = product?.id;

    useModalLock(isOpen);

    const {
        data: analytics,
        isLoading,
        isError,
        error,
        refetch,
        isFetching,
    } = useQuery({
        queryKey: queryKeys.products.analytics(productId),
        // Aceita tanto o objecto directo como envolvido em { data: {...} }
        queryFn: async () => unwrap(await productsAPI.getAnalytics(productId)) ?? null,
        enabled: isOpen && productId != null,
    });

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 9999 }}>
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 animate-fadeIn overflow-hidden flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Análise do Produto</h2>
                        <p className="text-sm text-gray-500 mt-0.5">{product?.name}</p>
                    </div>
                    <button
                        onClick={onClose}
                        aria-label="Fechar"
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-8">
                            <TrendingUp className="text-[#44B16F] animate-bounce mb-3" size={32} />
                            <p className="text-gray-500 text-sm">A carregar análise...</p>
                        </div>
                    ) : isError && !analytics ? (
                        <div className="text-center py-6" role="alert">
                            <p className="text-red-500 mb-2">{getErrorMessage(error, "Não foi possível carregar os dados de análise.")}</p>
                            <button
                                onClick={() => refetch()}
                                disabled={isFetching}
                                className="text-sm font-medium text-blue-600 hover:underline disabled:opacity-50"
                            >
                                {isFetching ? 'A tentar...' : 'Tentar novamente'}
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Message if empty */}
                            {analytics?.message && !analytics.best_price && (
                                <div className="bg-yellow-50 text-yellow-800 p-4 rounded-xl text-sm border border-yellow-100 mb-4">
                                    {analytics.message}
                                </div>
                            )}

                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="p-1.5 bg-white rounded-lg shadow-sm text-emerald-600">
                                            <TrendingUp size={16} />
                                        </div>
                                        <h3 className="text-xs font-bold text-emerald-800 uppercase tracking-wide">Melhor Preço</h3>
                                    </div>
                                    <p className="text-2xl font-black text-emerald-700">
                                        {analytics?.best_price
                                            ? formatPrice(analytics.best_price, { minimumFractionDigits: 2 })
                                            : '---'}
                                    </p>
                                </div>

                                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="p-1.5 bg-white rounded-lg shadow-sm text-blue-600">
                                            <BarChart2 size={16} />
                                        </div>
                                        <h3 className="text-xs font-bold text-blue-800 uppercase tracking-wide">Preço Médio</h3>
                                    </div>
                                    <p className="text-2xl font-black text-blue-700">
                                        {analytics?.average_price
                                            ? formatPrice(analytics.average_price, { minimumFractionDigits: 2 })
                                            : '---'}
                                    </p>
                                </div>
                            </div>

                            {/* Recent History or Additional Info could go here if available */}
                            {Array.isArray(analytics?.history) && analytics.history.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-bold text-gray-900 mb-3">Histórico Recente</h4>
                                    <div className="space-y-2">
                                        {analytics.history.slice(0, 5).map((h, i) => (
                                            <div key={i} className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded-lg">
                                                <span className="text-gray-600">{formatDate(h.date)}</span>
                                                <span className="font-medium text-gray-900">{formatPrice(h.price)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium text-sm transition-colors"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
