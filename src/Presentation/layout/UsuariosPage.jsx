import { useState, useEffect } from "react";
import { Eye, Edit, Trash2, RefreshCw } from "lucide-react";
import ModalNovoUsuario from "../Components/ModalNovoUsuario";
import { usersAPI } from "../../services/api";

export default function UsuariosPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [usuarios, setUsuarios] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUsuarios = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await usersAPI.getAll();
      // Handle if data is an array or has a data property
      setUsuarios(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError("Erro ao carregar usuários. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const handleUserCreated = () => {
    fetchUsuarios();
    setIsModalOpen(false);
  };

  const getRoleLabel = (role) => {
    const roles = {
      admin: "Administrador",
      procurement_technician: "Técnico de Compras",
      manager: "Gestor",
      viewer: "Visualizador",
    };
    return roles[role] || role;
  };

  return (
    <div className="space-y-8">
      {/* Welcome Section - Same style as Dashboard */}
      <div className="bg-white rounded-2xl p-8 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Usuários
          </h1>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Gestão de Usuários
          </h2>
          <p className="text-gray-600">Gerencie os usuários cadastrados no sistema</p>
        </div>
        <div className="hidden lg:block">
          <img
            src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&h=200&fit=crop"
            alt="Team collaboration"
            className="w-96 h-32 object-cover rounded-xl"
          />
        </div>
      </div>

      {/* Actions Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 text-[#44B16F] border border-[#44B16F] rounded-lg hover:bg-[#44B16F]/5 transition-colors font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            ADD NOVO USUÁRIO
          </button>
          <button
            onClick={fetchUsuarios}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-3 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />
          </button>
        </div>

        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Pesquisar usuário"
            className="pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#44B16F] focus:border-transparent w-64"
          />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
          <button
            onClick={fetchUsuarios}
            className="mt-2 text-sm text-red-700 underline"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="bg-white rounded-xl shadow-sm p-12 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#44B16F]"></div>
            <p className="text-gray-500">Carregando usuários...</p>
          </div>
        </div>
      )}

      {/* Table */}
      {!isLoading && !error && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">#</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                    <div className="flex items-center gap-2">
                      Nome completo
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                      </svg>
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                    <div className="flex items-center gap-2">
                      Estado
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                      </svg>
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Função</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-600">Ações</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                      Nenhum usuário encontrado
                    </td>
                  </tr>
                ) : (
                  usuarios.map((u, index) => (
                    <tr key={u.id || index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-gray-700">{u.id || index + 1}</td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-gray-900">{u.name || u.nome}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${u.is_active !== false ? 'bg-green-500' : 'bg-red-500'}`}></span>
                          <span className="text-gray-700">{u.is_active !== false ? 'Activo' : 'Inactivo'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-700">{u.email}</td>
                      <td className="px-6 py-4 text-gray-700">{getRoleLabel(u.role)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Ver detalhes">
                            <Eye size={18} className="text-gray-600" />
                          </button>
                          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Editar">
                            <Edit size={18} className="text-gray-600" />
                          </button>
                          <button className="p-2 hover:bg-red-50 rounded-lg transition-colors" title="Excluir">
                            <Trash2 size={18} className="text-red-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {usuarios.length > 0 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
              <button className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <div className="flex items-center gap-2">
                <button className="px-4 py-2 bg-[#44B16F] text-white rounded-lg">1</button>
                <span className="text-sm text-gray-600 ml-2">/Páginas</span>
              </div>

              <button className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal Novo Usuário */}
      <ModalNovoUsuario
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleUserCreated}
      />
    </div>
  );
}