import { useAuth } from "../../context/AuthContext";

export default function DashboardPage() {
    const { user } = useAuth();
    const userName = user?.nome || user?.name || "Usuário";

    const fornecedores = [
        {
            id: 1,
            empresa: "Empresa 01",
            usuarios: [
                { avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=U1" },
                { avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=U2" },
                { avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=U3" },
            ],
            produtos: "34 Itens",
            avaliacao: "10%",
            atividades: "Ver atividades"
        },
        {
            id: 2,
            empresa: "Empresa 02",
            usuarios: [
                { avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=U4" },
                { avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=U5" },
                { avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=U6" },
            ],
            produtos: "24 Itens",
            avaliacao: "100%",
            atividades: "Ver atividades"
        },
        {
            id: 3,
            empresa: "Empresa 03",
            usuarios: [
                { avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=U7" },
                { avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=U8" },
                { avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=U9" },
            ],
            produtos: "10 Itens",
            avaliacao: "25%",
            atividades: "Ver atividades"
        },
        {
            id: 4,
            empresa: "Empresa 04",
            usuarios: [
                { avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=U10" },
                { avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=U11" },
                { avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=U12" },
            ],
            produtos: "4 Itens",
            avaliacao: "0%",
            atividades: "Ver atividades"
        },
    ];

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

            {/* Fornecedores cadastrados */}
            <div className="bg-white rounded-xl shadow-sm p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Fornecedores cadastrados</h2>
                <p className="text-gray-500 mb-6">Listamos os fornecedores cadastrados recentemente</p>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-200">
                                <th className="text-left py-4 px-4 text-sm font-semibold text-gray-500 uppercase">Empresas</th>
                                <th className="text-left py-4 px-4 text-sm font-semibold text-gray-500 uppercase">Usuários</th>
                                <th className="text-left py-4 px-4 text-sm font-semibold text-gray-500 uppercase">Produtos</th>
                                <th className="text-left py-4 px-4 text-sm font-semibold text-gray-500 uppercase">Avaliação de qualidade</th>
                                <th className="text-left py-4 px-4 text-sm font-semibold text-gray-500 uppercase">Atividades</th>
                            </tr>
                        </thead>
                        <tbody>
                            {fornecedores.map((fornecedor) => (
                                <tr key={fornecedor.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                    <td className="py-4 px-4">
                                        <span className="font-semibold text-gray-900">{fornecedor.empresa}</span>
                                    </td>
                                    <td className="py-4 px-4">
                                        <div className="flex -space-x-2">
                                            {fornecedor.usuarios.map((user, idx) => (
                                                <img
                                                    key={idx}
                                                    src={user.avatar}
                                                    alt="User"
                                                    className="w-8 h-8 rounded-full border-2 border-white"
                                                />
                                            ))}
                                        </div>
                                    </td>
                                    <td className="py-4 px-4">
                                        <span className="text-gray-700">{fornecedor.produtos}</span>
                                    </td>
                                    <td className="py-4 px-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex-1 max-w-[200px]">
                                                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-[#44B16F] rounded-full transition-all"
                                                        style={{ width: fornecedor.avaliacao }}
                                                    ></div>
                                                </div>
                                            </div>
                                            <span className="text-sm font-medium text-[#44B16F] min-w-[40px]">{fornecedor.avaliacao}</span>
                                        </div>
                                    </td>
                                    <td className="py-4 px-4">
                                        <button className="px-4 py-2 bg-[#44B16F] text-white text-sm font-medium rounded-lg hover:bg-[#3a9d5f] transition-colors">
                                            {fornecedor.atividades}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
