// Skeleton component for Dashboard supplier table rows
export default function DashboardTableSkeleton({ rows = 4 }) {
    return (
        <>
            {Array.from({ length: rows }).map((_, index) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    {/* Empresas */}
                    <td className="py-4 px-4">
                        <div className="h-4 w-28 bg-gray-200 rounded animate-pulse"></div>
                    </td>

                    {/* Usuários (avatares) */}
                    <td className="py-4 px-4">
                        <div className="flex -space-x-2">
                            <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white animate-pulse"></div>
                            <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white animate-pulse"></div>
                            <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white animate-pulse"></div>
                        </div>
                    </td>

                    {/* Produtos */}
                    <td className="py-4 px-4">
                        <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                    </td>

                    {/* Avaliação de qualidade */}
                    <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                            <div className="flex-1 max-w-[200px]">
                                <div className="h-2 bg-gray-200 rounded-full animate-pulse"></div>
                            </div>
                            <div className="h-4 w-12 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                    </td>

                    {/* Atividades */}
                    <td className="py-4 px-4">
                        <div className="h-9 w-32 bg-gray-200 rounded-lg animate-pulse"></div>
                    </td>
                </tr>
            ))}
        </>
    );
}
