export default function FornecedoresPage() {
  const fornecedores = [
    { id: 1, nome: "Tech Solutions Lda", email: "contato@tech.ao", telefone: "+244 923 456 789", status: "Ativo" },
    { id: 2, nome: "Global Imports", email: "info@global.ao", telefone: "+244 924 567 890", status: "Ativo" },
    { id: 3, nome: "Prime Suppliers", email: "sales@prime.ao", telefone: "+244 925 678 901", status: "Inativo" },
    { id: 4, nome: "Angola Tech Group", email: "contact@angolatch.ao", telefone: "+244 926 789 012", status: "Ativo" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Fornecedores & Cotações</h1>
        <button className="bg-[#44B16F] text-white px-4 py-2 rounded-lg hover:bg-[#3a9d5f] transition-colors">
          + Novo Fornecedor
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Nome</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Email</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Telefone</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Ações</th>
            </tr>
          </thead>
          <tbody>
            {fornecedores.map((f) => (
              <tr key={f.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 text-sm text-gray-900">{f.nome}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{f.email}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{f.telefone}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    f.status === "Ativo" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                  }`}>
                    {f.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button className="text-[#44B16F] hover:text-[#3a9d5f] text-sm font-medium">
                    Ver detalhes
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}