export default function UsuariosPage() {
  const usuarios = [
    { id: 1, nome: "Adão Magalhães", role: "Super Admin", email: "adao@empresa.ao", status: "Online" },
    { id: 2, nome: "Maria Silva", role: "Gestor", email: "maria@empresa.ao", status: "Online" },
    { id: 3, nome: "João Costa", role: "Usuário", email: "joao@empresa.ao", status: "Offline" },
    { id: 4, nome: "Ana Santos", role: "Gestor", email: "ana@empresa.ao", status: "Online" },
    { id: 5, nome: "Pedro Lima", role: "Usuário", email: "pedro@empresa.ao", status: "Offline" },
    { id: 6, nome: "Carla Mendes", role: "Usuário", email: "carla@empresa.ao", status: "Online" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Gestão de Usuários</h1>
        <button className="bg-[#44B16F] text-white px-4 py-2 rounded-lg hover:bg-[#3a9d5f] transition-colors">
          + Adicionar Usuário
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {usuarios.map((u) => (
          <div key={u.id} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-[#44B16F] rounded-full flex items-center justify-center text-white text-xl font-bold">
                {u.nome.charAt(0)}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{u.nome}</h3>
                <p className="text-sm text-gray-600">{u.role}</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-2">{u.email}</p>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${u.status === "Online" ? "bg-green-500" : "bg-gray-400"}`}></span>
              <span className="text-sm text-gray-600">{u.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}