import { useState, useEffect } from 'react';
import { X, TrendingUp, DollarSign, BarChart2 } from 'lucide-react';
import { productsAPI } from '../../services/api';

export default function ModalProdutoAnalytics({ isOpen, onClose, product }) {
    const [isLoading, setIsLoading] = useState(false);
    const [analytics, setAnalytics] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isOpen && product) {
            fetchAnalytics();
        } else {
            setAnalytics(null);
            setError(null);
        }
    }, [isOpen, product]);

    const fetchAnalytics = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const data = await productsAPI.getAnalytics(product.id);
            setAnalytics(data);
        } catch (err) {
            console.error("Failed to fetch analytics", err);
            setError("Não foi possível carregar os dados de análise.");
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
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
                            <p className="text-gray-500 text-sm">Carregando análise...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-6">
                            <p className="text-red-500 mb-2">{error}</p>
                            <button
                                onClick={fetchAnalytics}
                                className="text-sm font-medium text-blue-600 hover:underline"
                            >
                                Tentar novamente
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
                                            ? `${parseFloat(analytics.best_price).toLocaleString('pt-AO', { minimumFractionDigits: 2 })} AOA`
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
                                            ? `${parseFloat(analytics.average_price).toLocaleString('pt-AO', { minimumFractionDigits: 2 })} AOA`
                                            : '---'}
                                    </p>
                                </div>
                            </div>

                            {/* Recent History or Additional Info could go here if available */}
                            {analytics?.history && analytics.history.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-bold text-gray-900 mb-3">Histórico Recente</h4>
                                    <div className="space-y-2">
                                        {analytics.history.slice(0, 5).map((h, i) => (
                                            <div key={i} className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded-lg">
                                                <span className="text-gray-600">{new Date(h.date).toLocaleDateString()}</span>
                                                <span className="font-medium text-gray-900">{parseFloat(h.price).toLocaleString('pt-AO')} AOA</span>
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
        </div>
    );
}
