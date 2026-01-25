import { useAuth } from "../../context/AuthContext";
import { useState, useEffect } from "react";
import {
    dashboardAPI,
    quotationRequestsAPI,
    suppliersAPI,
    quotationResponsesAPI
} from "../../services/api";
import DashboardTableSkeleton from "../Components/DashboardTableSkeleton";
import { Package, AlertCircle, Users, FileText } from "lucide-react";

export default function DashboardPage() {
    const { user } = useAuth();
    const userName = user?.nome || user?.name || "Usuário";
    const [isLoading, setIsLoading] = useState(true);
    const [dashboardData, setDashboardData] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const data = await dashboardAPI.getData();
            setDashboardData(data);
        } catch (err) {
            console.error("Erro ao carregar dados do dashboard via API principal:", err);
            console.log("Tentando carregar dados via fallback (cálculo manual)...");
            await fetchDashboardDataFallback();
        } finally {
            setIsLoading(false);
        }
    };

    const fetchDashboardDataFallback = async () => {
        try {
            // Fetch all necessary data in parallel
            const [quotations, suppliers, responses] = await Promise.all([
                quotationRequestsAPI.getAll().catch(() => []),
                suppliersAPI.getAll().catch(() => []),
                quotationResponsesAPI.getAll().catch(() => [])
            ]);

            // Normalizing data (API sometimes returns { data: [] } wrapper)
            const quotationsList = Array.isArray(quotations) ? quotations : (quotations.data || []);
            const suppliersList = Array.isArray(suppliers) ? suppliers : (suppliers.data || []);
            const responsesList = Array.isArray(responses) ? responses : (responses.data || []);

            // Calculate Counts

            // Active Quotations: sent or in_progress
            const activeQuotationsCount = quotationsList.filter(q =>
                ['sent', 'in_progress', 'open'].includes(q.status)
            ).length;

            // Pending Reviews: Responses that are pending
            // Assuming responses have a 'status' field.
            const pendingReviewsCount = responsesList.filter(r =>
                ['pending', 'review', 'submitted'].includes(r.status)
            ).length;

            // Active Suppliers
            const activeSuppliersCount = suppliersList.length;

            // Total Quotations
            const totalQuotationsCount = quotationsList.length;

            // Recent Quotations (Take last 5)
            // Sorting by created_at desc if possible, otherwise assume list order
            const sortedQuotations = [...quotationsList].sort((a, b) => {
                return new Date(b.created_at) - new Date(a.created_at);
            }).slice(0, 5);

            setDashboardData({
                counts: {
                    active_quotations: activeQuotationsCount,
                    pending_reviews: pendingReviewsCount,
                    active_suppliers: activeSuppliersCount,
                    total_quotations: totalQuotationsCount
                },
                recent_quotations: sortedQuotations
            });

        } catch (fallbackErr) {
            console.error("Erro no fallback do dashboard:", fallbackErr);
            // Default empty state if even fallback fails
            setDashboardData({
                counts: {
                    active_quotations: 0,
                    pending_reviews: 0,
                    active_suppliers: 0,
                    total_quotations: 0
                },
                recent_quotations: []
            });
            setError(null);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-PT', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            draft: { label: 'Rascunho', class: 'bg-gray-100 text-gray-700' },
            sent: { label: 'Enviada', class: 'bg-blue-100 text-blue-700' },
            in_progress: { label: 'Em Progresso', class: 'bg-yellow-100 text-yellow-700' },
            completed: { label: 'Completa', class: 'bg-green-100 text-green-700' },
            cancelled: { label: 'Cancelada', class: 'bg-red-100 text-red-700' },
        };
        const config = statusConfig[status] || statusConfig.draft;
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.class}`}>
                {config.label}
            </span>
        );
    };

    return (
        <div className="space-y-8">
            {/* Welcome Section */}
            <div className="bg-white rounded-2xl p-8 shadow-sm flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">
                        Olá {userName},
                    </h1>
                    <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                        Bem vindo de volta!
                    </h2>
                    <p className="text-gray-600">Continue com as suas atividades</p>
                </div>
                <div className="hidden lg:block">
                    <img
                        src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&h=200&fit=crop"
                        alt="Team collaboration"
                        className="w-96 h-32 object-cover rounded-xl"
                    />
                </div>
            </div>

            {/* Statistics Cards */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="bg-white rounded-xl shadow-sm p-6 animate-pulse">
                            <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                        </div>
                    ))}
                </div>
            ) : error ? (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
                    {error}
                </div>
            ) : dashboardData?.counts ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-medium text-gray-600">Cotações Ativas</h3>
                            <Package className="text-blue-500" size={24} />
                        </div>
                        <p className="text-3xl font-bold text-gray-900">{dashboardData.counts.active_quotations}</p>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-yellow-500">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-medium text-gray-600">Revisões Pendentes</h3>
                            <AlertCircle className="text-yellow-500" size={24} />
                        </div>
                        <p className="text-3xl font-bold text-gray-900">{dashboardData.counts.pending_reviews}</p>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-medium text-gray-600">Fornecedores Ativos</h3>
                            <Users className="text-green-500" size={24} />
                        </div>
                        <p className="text-3xl font-bold text-gray-900">{dashboardData.counts.active_suppliers}</p>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-purple-500">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-medium text-gray-600">Total de Cotações</h3>
                            <FileText className="text-purple-500" size={24} />
                        </div>
                        <p className="text-3xl font-bold text-gray-900">{dashboardData.counts.total_quotations}</p>
                    </div>
                </div>
            ) : null}

            {/* Recent Quotations */}
            <div className="bg-white rounded-xl shadow-sm p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Cotações Recentes</h2>
                <p className="text-gray-500 mb-6">Listamos as cotações criadas recentemente</p>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-200">
                                <th className="text-left py-4 px-4 text-sm font-semibold text-gray-500 uppercase">Referência</th>
                                <th className="text-left py-4 px-4 text-sm font-semibold text-gray-500 uppercase">Título</th>
                                <th className="text-left py-4 px-4 text-sm font-semibold text-gray-500 uppercase">Descrição</th>
                                <th className="text-left py-4 px-4 text-sm font-semibold text-gray-500 uppercase">Prazo</th>
                                <th className="text-left py-4 px-4 text-sm font-semibold text-gray-500 uppercase">Status</th>
                                <th className="text-left py-4 px-4 text-sm font-semibold text-gray-500 uppercase">Criado em</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <DashboardTableSkeleton rows={4} />
                            ) : error ? (
                                <tr>
                                    <td colSpan="6" className="py-8 text-center text-gray-500">
                                        Erro ao carregar cotações
                                    </td>
                                </tr>
                            ) : dashboardData?.recent_quotations?.length > 0 ? (
                                dashboardData.recent_quotations.map((quotation) => (
                                    <tr key={quotation.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                        <td className="py-4 px-4">
                                            <span className="font-semibold text-gray-900">{quotation.reference_number}</span>
                                        </td>
                                        <td className="py-4 px-4">
                                            <span className="text-gray-900 font-medium">{quotation.title}</span>
                                        </td>
                                        <td className="py-4 px-4">
                                            <span className="text-gray-600 text-sm">{quotation.description}</span>
                                        </td>
                                        <td className="py-4 px-4">
                                            <span className="text-gray-700 text-sm">{formatDate(quotation.deadline)}</span>
                                        </td>
                                        <td className="py-4 px-4">
                                            {getStatusBadge(quotation.status)}
                                        </td>
                                        <td className="py-4 px-4">
                                            <span className="text-gray-600 text-sm">{formatDate(quotation.created_at)}</span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="py-8 text-center text-gray-500">
                                        Nenhuma cotação recente
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
