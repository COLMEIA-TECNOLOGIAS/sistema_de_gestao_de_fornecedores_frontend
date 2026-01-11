// Skeleton component for Fornecedores table rows
export default function FornecedorTableSkeleton({ rows = 5 }) {
    return (
        <>
            {Array.from({ length: rows }).map((_, index) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    {/* Checkbox */}
                    <td className="px-6 py-4">
                        <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
                    </td>

                    {/* Logo/ID */}
                    <td className="px-6 py-4">
                        <div className="w-12 h-12 bg-gray-200 rounded-lg animate-pulse"></div>
                    </td>

                    {/* Nome da empresa */}
                    <td className="px-6 py-4">
                        <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                    </td>

                    {/* Data de registo */}
                    <td className="px-6 py-4">
                        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                    </td>

                    {/* Província */}
                    <td className="px-6 py-4">
                        <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                    </td>

                    {/* Atividade */}
                    <td className="px-6 py-4">
                        <div className="h-4 w-28 bg-gray-200 rounded animate-pulse"></div>
                    </td>

                    {/* Avaliação de qualidade */}
                    <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                            <div className="flex-1 max-w-[120px]">
                                <div className="h-2 bg-gray-200 rounded-full animate-pulse"></div>
                            </div>
                            <div className="h-4 w-10 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                    </td>

                    {/* Categoria */}
                    <td className="px-6 py-4">
                        <div className="h-6 w-24 bg-gray-200 rounded-full animate-pulse"></div>
                    </td>

                    {/* Ações */}
                    <td className="px-6 py-4">
                        <div className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse"></div>
                    </td>
                </tr>
            ))}
        </>
    );
}
