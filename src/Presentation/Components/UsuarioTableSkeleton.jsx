// Skeleton component for table rows
export default function UsuarioTableSkeleton({ rows = 5 }) {
    return (
        <>
            {Array.from({ length: rows }).map((_, index) => (
                <tr key={index} className="border-b border-gray-100">
                    {/* ID */}
                    <td className="px-6 py-4">
                        <div className="h-4 w-8 bg-gray-200 rounded animate-pulse"></div>
                    </td>

                    {/* Nome completo */}
                    <td className="px-6 py-4">
                        <div className="h-4 w-36 bg-gray-200 rounded animate-pulse"></div>
                    </td>

                    {/* Estado */}
                    <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-gray-200 animate-pulse"></div>
                            <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                    </td>

                    {/* Email */}
                    <td className="px-6 py-4">
                        <div className="h-4 w-48 bg-gray-200 rounded animate-pulse"></div>
                    </td>

                    {/* Função */}
                    <td className="px-6 py-4">
                        <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                    </td>

                    {/* Ações */}
                    <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                            <div className="w-9 h-9 bg-gray-200 rounded-lg animate-pulse"></div>
                            <div className="w-9 h-9 bg-gray-200 rounded-lg animate-pulse"></div>
                            <div className="w-9 h-9 bg-gray-200 rounded-lg animate-pulse"></div>
                        </div>
                    </td>
                </tr>
            ))}
        </>
    );
}
