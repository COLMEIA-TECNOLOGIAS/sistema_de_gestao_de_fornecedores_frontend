import { useState, useEffect } from "react";
import { Search, SlidersHorizontal, MoreVertical } from "lucide-react";
import ModalCadastroFornecedor from "../Components/ModalCadastroFornecedor";
import FornecedorTableSkeleton from "../Components/FornecedorTableSkeleton";
import { suppliersAPI } from "../../services/api";

export default function FornecedoresPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fornecedores, setFornecedores] = useState([]);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch suppliers data on component mount
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await suppliersAPI.getAll();
        // API returns { data: [...] }
        setFornecedores(response.data || []);
      } catch (err) {
        console.error('Error fetching suppliers:', err);
        setError(err.message || 'Failed to load suppliers');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSuppliers();
  }, []);

  // Pagination logic
  const totalPages = Math.ceil(fornecedores.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentFornecedores = fornecedores.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
        {error && (
          <div className="p-4 bg-red-50 border-b border-red-200">
            <p className="text-red-600 text-sm">
              <strong>Erro:</strong> {error}
            </p>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left">
                  <input type="checkbox" className="rounded border-gray-300" />
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">ID</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Nome Comercial</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Nome Legal</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">NIF</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Telefone</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Email</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Tipo de Atividade</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Província</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Município</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Data de Registo</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Status</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-600">Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <FornecedorTableSkeleton rows={10} />
              ) : currentFornecedores.length === 0 ? (
                <tr>
                  <td colSpan="13" className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                      <p className="text-lg font-medium">Nenhum fornecedor encontrado</p>
                      <p className="text-sm">Adicione um fornecedor para começar</p>
                    </div>
                  </td>
                </tr>
              ) : (
                currentFornecedores.map((f) => (
                  <tr key={f.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-6">
                      <input type="checkbox" className="rounded border-gray-300" />
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-3">
                        <img
                          src={`https://api.dicebear.com/7.x/initials/svg?seed=${f.commercial_name || 'N/A'}`}
                          alt={f.commercial_name}
                          className="w-10 h-10 rounded-lg"
                        />
                        <span className="font-medium text-gray-700">#{f.id}</span>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <span className="font-semibold text-gray-900">{f.commercial_name || 'N/A'}</span>
                    </td>
                    <td className="px-6 py-6 text-gray-700">{f.legal_name || 'N/A'}</td>
                    <td className="px-6 py-6 text-gray-700">{f.nif || 'N/A'}</td>
                    <td className="px-6 py-6 text-gray-700">{f.phone || 'N/A'}</td>
                    <td className="px-6 py-6 text-gray-700">{f.email || 'N/A'}</td>
                    <td className="px-6 py-6">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${f.activity_type === 'service'
                        ? 'bg-blue-100 text-blue-700'
                        : f.activity_type === 'product'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-gray-100 text-gray-700'
                        }`}>
                        {f.activity_type === 'service' ? 'Serviço' : f.activity_type === 'product' ? 'Produto' : f.activity_type || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-6 text-gray-700">{f.province || 'N/A'}</td>
                    <td className="px-6 py-6 text-gray-700">{f.municipality || 'N/A'}</td>
                    <td className="px-6 py-6 text-gray-700">
                      {f.created_at ? new Date(f.created_at).toLocaleDateString('pt-AO', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      }) : 'N/A'}
                    </td>
                    <td className="px-6 py-6">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${f.is_active
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                        }`}>
                        {f.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-6 py-6">
                      <div className="relative flex justify-center">
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

        {/* Pagination - Only show when 10 or more items */}
        {fornecedores.length >= 10 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${currentPage === 1
                ? 'text-gray-300 cursor-not-allowed'
                : 'text-gray-600 hover:bg-gray-50'
                }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Anterior
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-3 py-1 rounded-lg text-sm transition-colors ${currentPage === page
                    ? 'bg-[#44B16F] text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                    }`}
                >
                  {page.toString().padStart(2, '0')}
                </button>
              ))}
            </div>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${currentPage === totalPages
                ? 'text-gray-300 cursor-not-allowed'
                : 'text-gray-600 hover:bg-gray-50'
                }`}
            >
              Próximo
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      <ModalCadastroFornecedor isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}