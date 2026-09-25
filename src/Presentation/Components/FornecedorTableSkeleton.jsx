// Skeleton component for Fornecedores table rows.
// As células seguem as 11 colunas da tabela de FornecedoresPage.
const bar = { background: 'var(--color-border)' };

export default function FornecedorTableSkeleton({ rows = 10 }) {
    return (
        <>
            {Array.from({ length: rows }).map((_, index) => (
                <tr key={index} style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                    {/* Checkbox */}
                    <td className="px-3 py-3">
                        <div className="w-3 h-3 rounded animate-pulse" style={bar}></div>
                    </td>

                    {/* ID */}
                    <td className="px-3 py-3">
                        <div className="h-3 w-8 rounded animate-pulse" style={bar}></div>
                    </td>

                    {/* Fornecedor (avatar + nome) */}
                    <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-lg animate-pulse" style={bar}></div>
                            <div className="h-3 w-28 rounded animate-pulse" style={bar}></div>
                        </div>
                    </td>

                    {/* NIF */}
                    <td className="px-3 py-3">
                        <div className="h-3 w-20 rounded animate-pulse" style={bar}></div>
                    </td>

                    {/* Contactos */}
                    <td className="px-3 py-3">
                        <div className="h-3 w-24 rounded animate-pulse mb-1.5" style={bar}></div>
                        <div className="h-2.5 w-32 rounded animate-pulse" style={bar}></div>
                    </td>

                    {/* Avaliação */}
                    <td className="px-3 py-3">
                        <div className="h-3 w-16 rounded animate-pulse" style={bar}></div>
                    </td>

                    {/* Categoria */}
                    <td className="px-3 py-3">
                        <div className="h-5 w-16 rounded-full animate-pulse" style={bar}></div>
                    </td>

                    {/* Localização */}
                    <td className="px-3 py-3">
                        <div className="h-3 w-20 rounded animate-pulse" style={bar}></div>
                    </td>

                    {/* Data de Registo */}
                    <td className="px-3 py-3">
                        <div className="h-3 w-16 rounded animate-pulse" style={bar}></div>
                    </td>

                    {/* Status */}
                    <td className="px-3 py-3">
                        <div className="h-5 w-14 rounded-full animate-pulse" style={bar}></div>
                    </td>

                    {/* Ações */}
                    <td className="px-3 py-3">
                        <div className="flex justify-center">
                            <div className="w-6 h-6 rounded animate-pulse" style={bar}></div>
                        </div>
                    </td>
                </tr>
            ))}
        </>
    );
}
