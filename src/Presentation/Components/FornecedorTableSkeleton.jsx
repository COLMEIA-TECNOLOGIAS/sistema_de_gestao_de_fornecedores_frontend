// Skeleton component for Fornecedores table rows
export default function FornecedorTableSkeleton({ rows = 10 }) {
    return (
        <>
            {Array.from({ length: rows }).map((_, index) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    {/* Checkbox */}
                    <td className="px-2 py-2">
                        <div className="w-3 h-3 bg-gray-200 rounded animate-pulse"></div>
                    </td>

                    {/* ID with Avatar */}
                    <td className="px-2 py-2">
                        <div className="flex items-center gap-1">
                            <div className="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
                            <div className="h-3 w-6 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                    </td>

                    {/* Nome Comercial */}
                    <td className="px-2 py-2">
                        <div className="h-3 w-28 bg-gray-200 rounded animate-pulse"></div>
                    </td>

                    {/* Nome Legal */}
                    <td className="px-2 py-2">
                        <div className="h-3 w-32 bg-gray-200 rounded animate-pulse"></div>
                    </td>

                    {/* NIF */}
                    <td className="px-2 py-2">
                        <div className="h-3 w-20 bg-gray-200 rounded animate-pulse"></div>
                    </td>

                    {/* Telefone */}
                    <td className="px-2 py-2">
                        <div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div>
                    </td>

                    {/* Email */}
                    <td className="px-2 py-2">
                        <div className="h-3 w-36 bg-gray-200 rounded animate-pulse"></div>
                    </td>

                    {/* Tipo de Atividade */}
                    <td className="px-2 py-2">
                        <div className="h-5 w-16 bg-gray-200 rounded-full animate-pulse"></div>
                    </td>

                    {/* Província */}
                    <td className="px-2 py-2">
                        <div className="h-3 w-18 bg-gray-200 rounded animate-pulse"></div>
                    </td>

                    {/* Município */}
                    <td className="px-2 py-2">
                        <div className="h-3 w-18 bg-gray-200 rounded animate-pulse"></div>
                    </td>

                    {/* Data de Registo */}
                    <td className="px-2 py-2">
                        <div className="h-3 w-20 bg-gray-200 rounded animate-pulse"></div>
                    </td>

                    {/* Status */}
                    <td className="px-2 py-2">
                        <div className="h-5 w-14 bg-gray-200 rounded-full animate-pulse"></div>
                    </td>

                    {/* Ações */}
                    <td className="px-2 py-2">
                        <div className="flex justify-center">
                            <div className="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                    </td>
                </tr>
            ))}
        </>
    );
}
