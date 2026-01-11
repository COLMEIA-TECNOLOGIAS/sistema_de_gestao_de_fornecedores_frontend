import { useState } from "react";
import { Search, SlidersHorizontal, MoreVertical } from "lucide-react";
import ModalCadastroFornecedor from "../Components/ModalCadastroFornecedor";
import FornecedorTableSkeleton from "../Components/FornecedorTableSkeleton";

export default function FornecedoresPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [isLoading, setIsLoading] = useState(false); // Para demonstração

  const fornecedores = [
    {
      id: 1,
      logo: "https://api.dicebear.com/7.x/initials/svg?seed=NCR",
      nome: "NCR Angola",
      dataRegistro: "17/07/2025",
      provincia: "Luanda",
      servicos: "P. de Serviços",
      avaliacao: "10%",
      categoria: "Eletrónicos"
    },
    {
      id: 2,
      logo: "https://api.dicebear.com/7.x/initials/svg?seed=SISTEC",
      nome: "SISTEC",
      dataRegistro: "17/07/2025",
      provincia: "Luanda",
      servicos: "P. de Serviços",
      avaliacao: "97%",
      categoria: "Eletrónicos"
    },
    {
      id: 3,
      logo: "https://api.dicebear.com/7.x/initials/svg?seed=NCR2",
      nome: "NCR Angola",
      dataRegistro: "17/07/2025",
      provincia: "Luanda",
      servicos: "P. de Serviços",
      avaliacao: "65%",
      categoria: "Eletrónicos"
    },
    {
      id: 4,
      logo: "https://api.dicebear.com/7.x/initials/svg?seed=NCR3",
      nome: "NCR Angola",
      dataRegistro: "17/07/2025",
      provincia: "Luanda",
      servicos: "P. de Serviços",
      avaliacao: "50%",
      categoria: "Eletrónicos"
    },
    {
      id: 5,
      logo: "https://api.dicebear.com/7.x/initials/svg?seed=NCR4",
      nome: "NCR Angola",
      dataRegistro: "17/07/2025",
      provincia: "Luanda",
      servicos: "P. de Serviços",
      avaliacao: "45%",
      categoria: "Eletrónicos"
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section - Same style as Dashboard */}
      <div className="bg-white rounded-2xl p-8 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Fornecedores
          </h1>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Gestão de Fornecedores
          </h2>
          <p className="text-gray-600">Gerencie os fornecedores cadastrados no sistema</p>
        </div>
        <div className="hidden lg:block">
          <img
            src="https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=400&h=200&fit=crop"
            alt="Office"
            className="w-96 h-32 object-cover rounded-xl"
          />
        </div>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Search */}
        <div className="flex-1 min-w-[300px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search for anything..."
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#44B16F] focus:border-transparent"
            />
          </div>
        </div>

        {/* Filter Button */}
        <button className="flex items-center gap-2 px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
          <SlidersHorizontal size={20} className="text-gray-600" />
        </button>

        {/* Action Buttons */}
        <button className="px-6 py-3 text-[#44B16F] border border-[#44B16F] rounded-lg hover:bg-[#44B16F]/5 transition-colors font-medium">
          + Solicitar cotação
        </button>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-6 py-3 bg-[#44B16F] text-white rounded-lg hover:bg-[#3a9d5f] transition-colors font-medium"
        >
          + Add Fornecedor
        </button>
        <button className="px-6 py-3 bg-[#44B16F] text-white rounded-lg hover:bg-[#3a9d5f] transition-colors font-medium flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Atividade
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left">
                  <input type="checkbox" className="rounded border-gray-300" />
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">ID</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Nome da empresa</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Data de registo</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Província</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Atividade</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Avaliação de qualidade</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Categoria</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <FornecedorTableSkeleton rows={5} />
              ) : (
                fornecedores.map((f) => (
                  <tr key={f.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <input type="checkbox" className="rounded border-gray-300" />
                    </td>
                    <td className="px-6 py-4">
                      <img src={f.logo} alt={f.nome} className="w-12 h-12 rounded-lg" />
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-gray-900">{f.nome}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-700">{f.dataRegistro}</td>
                    <td className="px-6 py-4 text-gray-700">{f.provincia}</td>
                    <td className="px-6 py-4 text-gray-700">{f.servicos}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 max-w-[120px]">
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#44B16F] rounded-full"
                              style={{ width: f.avaliacao }}
                            ></div>
                          </div>
                        </div>
                        <span className="text-sm font-medium text-[#44B16F] min-w-[40px]">{f.avaliacao}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                        {f.categoria}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="relative">
                        <button
                          onClick={() => setOpenMenuId(openMenuId === f.id ? null : f.id)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <MoreVertical size={20} className="text-gray-600" />
                        </button>

                        {openMenuId === f.id && (
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10">
                            <button className="w-full px-4 py-2 text-left hover:bg-gray-50 text-sm flex items-center gap-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              Mais detalhes
                            </button>
                            <button className="w-full px-4 py-2 text-left hover:bg-gray-50 text-sm flex items-center gap-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              Editar
                            </button>
                            <button className="w-full px-4 py-2 text-left hover:bg-gray-50 text-sm flex items-center gap-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              Pedir Cotação
                            </button>
                            <button className="w-full px-4 py-2 text-left hover:bg-gray-50 text-sm flex items-center gap-2 text-red-600">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Remover
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
          <button className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Anterior
          </button>

          <div className="flex items-center gap-2">
            <button className="px-4 py-2 bg-[#44B16F] text-white rounded-lg">01</button>
            <button className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg">02</button>
            <button className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg">03</button>
            <span className="px-2 text-gray-400">...</span>
            <button className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg">15</button>
            <button className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg">16</button>
            <button className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg">17</button>
          </div>

          <button className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
            Próximo
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Modal */}
      <ModalCadastroFornecedor isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}