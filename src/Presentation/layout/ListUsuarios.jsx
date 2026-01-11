import { Plus, Search, Eye, Edit2, Trash2, ChevronLeft, ChevronRight, X, Calendar } from "lucide-react";
import { useState, useEffect } from "react";
import api from "../../services/api";
import ModalNovoUsuario from "../Components/ModalNovoUsuario";
import UsuarioTableSkeleton from "../Components/UsuarioTableSkeleton";

export default function UsuariosManagementPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    try {
      setLoading(true);
      const response = await api.get("/users");
      const data = response.data;
      // Mapeia os dados da API para o formato esperado pelo componente
      const usuariosFormatados = (Array.isArray(data) ? data : data.data || []).map((user, index) => ({
        id: user.id || index + 1,
        nome: user.nome || user.name || "",
        status: user.status || (user.ativo ? "Activo" : "Inactivo"),
        statusColor: user.status === "Activo" || user.ativo ? "green" : "red",
        email: user.email || "",
        data: user.dataCriacao || user.createdAt || user.created_at || ""
      }));
      setUsuarios(usuariosFormatados);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Erro ao buscar usuários");
      console.error("Erro ao buscar usuários:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUserCreated = () => {
    setShowModal(false);
    fetchUsuarios(); // Recarrega a lista de usuários
  };

  return (
    <main className="flex-1 bg-gray-50 p-8 mt-16">
      <div className="max-w-7xl mx-auto">
        {/* Header com imagem */}
        <div className="bg-white rounded-2xl mb-6 overflow-hidden shadow-sm">
          <div className="flex items-center justify-between">
            <div className="p-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Usuários</h1>
              <p className="text-gray-600">Gerencie os usuários cadastrados</p>
            </div>
            <div className="w-96 h-32 bg-gradient-to-r from-teal-400 to-teal-600"></div>
          </div>
        </div>

        {/* Barra de ações */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-[#44B16F] text-[#44B16F] rounded-lg font-medium hover:bg-[#44B16F]/5 transition-colors"
          >
            <Plus size={20} />
            ADD NOVO USUÁRIO
          </button>

          <div className="relative">
            <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Pesquisar usuário"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#44B16F] focus:border-transparent w-80"
            />
          </div>
        </div>

        {/* Tabela */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 w-16">#</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  <div className="flex items-center gap-2">
                    Nome completo
                    <div className="flex flex-col gap-0.5">
                      <div className="w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-b-4 border-b-gray-400"></div>
                      <div className="w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-4 border-t-gray-300"></div>
                    </div>
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  <div className="flex items-center gap-2">
                    Estado
                    <div className="flex flex-col gap-0.5">
                      <div className="w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-b-4 border-b-gray-400"></div>
                      <div className="w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-4 border-t-gray-300"></div>
                    </div>
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  <div className="flex items-center gap-2">
                    Email
                    <div className="flex flex-col gap-0.5">
                      <div className="w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-b-4 border-b-gray-400"></div>
                      <div className="w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-4 border-t-gray-300"></div>
                    </div>
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  <div className="flex items-center gap-2">
                    Data de criação
                    <div className="flex flex-col gap-0.5">
                      <div className="w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-b-4 border-b-gray-400"></div>
                      <div className="w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-4 border-t-gray-300"></div>
                    </div>
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <UsuarioTableSkeleton rows={5} />
              ) : error ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <div className="text-red-500">{error}</div>
                    <button
                      onClick={fetchUsuarios}
                      className="mt-3 px-4 py-2 bg-[#44B16F] text-white rounded-lg hover:bg-[#3a9d5f] transition-colors"
                    >
                      Tentar novamente
                    </button>
                  </td>
                </tr>
              ) : usuarios.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    Nenhum usuário encontrado
                  </td>
                </tr>
              ) : usuarios.map((usuario) => (
                <tr key={usuario.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-900">{usuario.id}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium">{usuario.nome}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${usuario.statusColor === 'green' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                      <span className="text-sm text-gray-700">{usuario.status}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">{usuario.email}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{usuario.data}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <Eye size={18} className="text-gray-600" />
                      </button>
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <Edit2 size={18} className="text-gray-600" />
                      </button>
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <Trash2 size={18} className="text-gray-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Paginação */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              <ChevronLeft size={20} className="text-gray-600" />
            </button>

            <div className="flex items-center gap-2">
              <button className="w-10 h-10 flex items-center justify-center rounded-lg bg-[#44B16F] text-white font-medium">
                1
              </button>
              <button className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-700 font-medium transition-colors">
                2
              </button>
              <button className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-700 font-medium transition-colors">
                3
              </button>
              <button className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-700 font-medium transition-colors">
                4
              </button>
            </div>

            <div className="flex items-center gap-3">
              <select className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#44B16F]">
                <option>10</option>
                <option>20</option>
                <option>50</option>
              </select>
              <span className="text-sm text-gray-600">/Páginas</span>

              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <ChevronRight size={20} className="text-gray-600" />
              </button>
            </div>
          </div>
        </div>

        {/* Modal de Adicionar Usuário */}
        <ModalNovoUsuario
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSuccess={handleUserCreated}
        />
      </div>
    </main>
  );
}