export default function CategoriasTableSkeleton({ rows = 5 }) {
    return (
        <tbody className="divide-y divide-gray-100 animate-pulse">
            {[...Array(rows)].map((_, index) => (
                <tr key={index}>
                    <td className="px-6 py-4">
                        <div className="h-4 bg-gray-200 rounded w-8"></div>
                    </td>
                    <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gray-200"></div>
                            <div className="h-4 bg-gray-200 rounded w-32"></div>
                        </div>
                    </td>
                    <td className="px-6 py-4">
                        <div className="h-4 bg-gray-200 rounded w-48"></div>
                    </td>
                    <td className="px-6 py-4">
                        <div className="h-4 bg-gray-200 rounded w-24"></div>
                    </td>
                    <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gray-200"></div>
                            <div className="w-8 h-8 rounded-lg bg-gray-200"></div>
                        </div>
                    </td>
                </tr>
            ))}
        </tbody>
    );
}
