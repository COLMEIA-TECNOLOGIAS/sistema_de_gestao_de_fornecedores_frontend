import { useState, useEffect } from "react";
import { Search, SlidersHorizontal, Eye, FileText, CheckCircle, Clock, AlertCircle, TrendingUp } from "lucide-react";
import { quotationResponsesAPI, quotationRequestsAPI, acquisitionsAPI } from "../../services/api";
import Toast from "../Components/Toast";
import DashboardTableSkeleton from "../Components/DashboardTableSkeleton";

export default function AquisicoesPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [responses, setResponses] = useState([]);
    const [stats, setStats] = useState([]);
    const [error, setError] = useState(null);
    const [toast, setToast] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        fetchResponses();
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const data = await acquisitionsAPI.getStatsProducts();
            setStats(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Erro ao carregar estatísticas:", error);
        }
    };

    const fetchResponses = async () => {
        try {
            setIsLoading(true);
            setError(null);

            // Use the correct API endpoint for acquisitions
            const data = await acquisitionsAPI.getAll();

            if (data.data) {
                setResponses(data.data);
            } else if (Array.isArray(data)) {
                setResponses(data);
            } else {
                setResponses([]);
            }

        } catch (err) {
            console.error("Erro ao carregar aquisições:", err);
            setError("Erro ao carregar lista de aquisições.");
        } finally {
            setIsLoading(false);
        }
    };

    const showToast = (type, message) => {
        setToast({ type, message });
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            pending_review: { label: 'Pendente', class: 'bg-yellow-50 text-yellow-700 border-yellow-100' },
            approved: { label: 'Aprovada', class: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
            rejected: { label: 'Rejeitada', class: 'bg-red-50 text-red-700 border-red-100' },
            revision_requested: { label: 'Revisão', class: 'bg-blue-50 text-blue-700 border-blue-100' },
        };
        const config = statusConfig[status] || { label: status, class: 'bg-gray-50 text-gray-700 border-gray-100' };
        return (
            <span className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${config.class}`}>
                {config.label}
            </span>
        );
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString('pt-AO', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const filteredResponses = responses.filter(resp =>
        resp.id.toString().includes(searchTerm) ||
        (resp.supplier?.commercial_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (resp.reference_number || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-fadeIn">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Aquisições</h1>
                    <p className="text-gray-500 mt-1">Gerencie as respostas e aquisições de fornecedores</p>
                </div>
            </div>

            {/* Stats Section */}
            {stats.length > 0 && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <TrendingUp size={20} className="text-[#44B16F]" />
                        Produtos Mais Adquiridos
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {stats.map((item, index) => (
                            <div key={index} className="bg-gray-50 p-4 rounded-xl border border-gray-100 hover:shadow-md transition-shadow">
                                <p className="font-bold text-gray-800 truncate" title={item.product_name}>{item.product_name}</p>
                                <div className="flex justify-between items-end mt-3">
                                    <div>
                                        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">Quantidade</p>
                                        <p className="text-2xl font-bold text-[#44B16F] mt-1">{item.total_quantity}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">Aquisições</p>
                                        <p className="text-sm font-bold text-gray-700 mt-1">{item.acquisition_count}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Filters and Search */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por ID ou fornecedor..."
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-[#44B16F] focus:border-transparent rounded-xl outline-none transition-all text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button
                    onClick={fetchResponses}
                    className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-xl transition-colors border border-gray-200"
                >
                    <Clock size={18} />
                    <span className="text-sm font-medium">Atualizar</span>
                </button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50/50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-5 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">ID</th>
                                <th className="px-6 py-5 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Cotação</th>
                                <th className="px-6 py-5 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Fornecedor</th>
                                <th className="px-6 py-5 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Data Entrega</th>
                                <th className="px-6 py-5 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Submetido em</th>
                                <th className="px-6 py-5 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Status</th>
                                <th className="px-6 py-5 text-center text-xs font-bold text-gray-500 uppercase tracking-widest">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {isLoading ? (
                                <DashboardTableSkeleton rows={8} />
                            ) : error ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <AlertCircle size={40} className="text-red-300" />
                                            <p className="text-gray-500 font-medium">{error}</p>
                                            <button
                                                onClick={fetchResponses}
                                                className="text-[#44B16F] font-bold text-sm hover:underline"
                                            >
                                                Tentar novamente
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredResponses.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500 font-medium">
                                        Nenhuma aquisição encontrada
                                    </td>
                                </tr>
                            ) : (
                                filteredResponses.map((resp) => (
                                    <tr key={resp.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-6 py-6 text-sm font-bold text-gray-900">#{resp.id}</td>
                                        <td className="px-6 py-6">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-semibold text-gray-800">Cotação #{resp.quotation_request_id || "N/A"}</span>
                                                <span className="text-xs text-gray-400 mt-1">Ref: {resp.reference_number || "N/A"}</span>
                                                <span className="text-xs text-gray-500 mt-0.5" title={resp.quotation_request?.title}>
                                                    {resp.quotation_request?.title?.substring(0, 20)}...
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <span className="text-sm font-medium text-gray-700">
                                                {resp.supplier?.commercial_name || resp.supplier?.legal_name || "N/A"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-6 text-sm text-gray-600 font-medium">
                                            {formatDate(resp.expected_delivery_date)}
                                        </td>
                                        <td className="px-6 py-6 text-sm text-gray-500">
                                            {formatDate(resp.created_at)}
                                        </td>
                                        <td className="px-6 py-6">
                                            {getStatusBadge(resp.status)}
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    className="p-2 hover:bg-[#44B16F]/10 text-gray-400 hover:text-[#44B16F] rounded-lg transition-all"
                                                    title="Ver Detalhes"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                                <button
                                                    className="p-2 hover:bg-emerald-50 text-gray-400 hover:text-emerald-600 rounded-lg transition-all"
                                                    title="Aprovar"
                                                >
                                                    <CheckCircle size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Toast Notification */}
            {toast && (
                <Toast
                    type={toast.type}
                    message={toast.message}
                    onClose={() => setToast(null)}
                />
            )}
        </div>
    );
}
