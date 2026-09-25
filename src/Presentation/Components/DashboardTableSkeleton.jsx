// Linhas de carregamento (skeleton) para tabelas — usado no primeiro carregamento
// (isLoading) do Painel, Aquisições e Produtos.
// `columns` permite ajustar o número de células ao cabeçalho da tabela onde é usado
// (por omissão 5, o layout original).
export default function DashboardTableSkeleton({ rows = 4, columns = 5 }) {
    const baseCells = [
        // Empresas
        <td key="c0" className="py-4 px-4">
            <div className="h-4 w-28 bg-gray-200 rounded animate-pulse"></div>
        </td>,

        // Utilizadores (avatares)
        <td key="c1" className="py-4 px-4">
            <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white animate-pulse"></div>
                <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white animate-pulse"></div>
                <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white animate-pulse"></div>
            </div>
        </td>,

        // Produtos
        <td key="c2" className="py-4 px-4">
            <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
        </td>,

        // Avaliação de qualidade
        <td key="c3" className="py-4 px-4">
            <div className="flex items-center gap-3">
                <div className="flex-1 max-w-[200px]">
                    <div className="h-2 bg-gray-200 rounded-full animate-pulse"></div>
                </div>
                <div className="h-4 w-12 bg-gray-200 rounded animate-pulse"></div>
            </div>
        </td>,

        // Actividades
        <td key="c4" className="py-4 px-4">
            <div className="h-9 w-32 bg-gray-200 rounded-lg animate-pulse"></div>
        </td>,
    ];

    const extraCells = Array.from({ length: Math.max(0, columns - baseCells.length) }, (_, i) => (
        <td key={`extra-${i}`} className="py-4 px-4">
            <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
        </td>
    ));

    const cells = [...baseCells.slice(0, Math.max(1, columns)), ...extraCells];

    return (
        <>
            {Array.from({ length: rows }).map((_, index) => (
                <tr key={index} className="border-b border-gray-100" aria-busy="true">
                    {cells}
                </tr>
            ))}
        </>
    );
}
