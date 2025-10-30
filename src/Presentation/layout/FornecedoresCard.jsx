function Fornecedores() {
  const fornecedores = [
    { id: 1, nome: "Empresa 01", avatars: ["👤", "👤", "👤", "👤"], itens: 34, progresso: 45, cor: "text-red-500" },
    { id: 2, nome: "Empresa 02", avatars: ["👤", "👤", "👤"], itens: 24, progresso: 100, cor: "text-green-500" },
    { id: 3, nome: "Empresa 03", avatars: ["👤", "👤", "👤"], itens: 10, progresso: 25, cor: "text-yellow-500" },
    { id: 4, nome: "Empresa 04", avatars: ["👤", "👤", "👤", "👤"], itens: 4, progresso: 0, cor: "text-gray-500" },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Fornecedores cadastrados</h3>
        <p className="text-sm text-gray-500">Listamos os fornecedores cadastrados recentemente</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">INTERVENT</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">MEMBROS</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">PRODUTOS</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">AVALIAÇÃO DE QUALIDADE</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ATIVIDADES</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {fornecedores.map((fornecedor) => (
              <tr key={fornecedor.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  {fornecedor.nome}
                </td>
                <td className="px-6 py-4">
                  <div className="flex -space-x-2">
                    {fornecedor.avatars.map((avatar, idx) => (
                      <div
                        key={idx}
                        className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center text-white text-xs border-2 border-white"
                      >
                        {avatar}
                      </div>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {fornecedor.itens} itens
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[120px]">
                      <div
                        className={`h-2 rounded-full ${
                          fornecedor.progresso === 100 ? "bg-green-500" :
                          fornecedor.progresso >= 25 ? "bg-yellow-500" :
                          fornecedor.progresso > 0 ? "bg-red-500" : "bg-gray-300"
                        }`}
                        style={{ width: `${fornecedor.progresso}%` }}
                      ></div>
                    </div>
                    <span className={`text-sm font-semibold ${fornecedor.cor}`}>
                      {fornecedor.progresso}%
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <button className="bg-[#44B16F] text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-[#3a9860] transition-colors">
                    Ver atividade
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

export default Fornecedores;