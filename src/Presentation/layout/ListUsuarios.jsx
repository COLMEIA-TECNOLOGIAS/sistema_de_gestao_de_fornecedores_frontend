import { Search, Eye, Edit2, Trash2, ChevronLeft, ChevronRight, Shield } from "lucide-react";
import { useState, useEffect } from "react";
import api from "../../services/api";
import UsuarioTableSkeleton from "../Components/UsuarioTableSkeleton";
import { useAuth } from "../../context/AuthContext";
import { getRoleName } from "../../utils/permissions";

export default function UsuariosManagementPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { canDeleteRecords, isAdmin } = useAuth();
  const [pageSize, setPageSize] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    try {
      setLoading(true);
      const response = await api.get("/users");
      const data = response.data;
      const usuariosFormatados = (Array.isArray(data) ? data : data.data || []).map((user, index) => ({
        id: user.id || index + 1,
        nome: user.nome || user.name || "",
        status: user.status || (user.ativo ? "Activo" : "Inactivo"),
        statusColor: user.status === "Activo" || user.ativo ? "green" : "red",
        email: user.email || "",
        role: user.role || "user",
        roleName: getRoleName(user.role || "user"),
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

  const filteredUsuarios = searchQuery
    ? usuarios.filter(u =>
        (u.nome || u.email || u.roleName || "").toLowerCase().includes(searchQuery.toLowerCase())
      )
    : usuarios;

  const totalPages = Math.max(1, Math.ceil(filteredUsuarios.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const pageStart = filteredUsuarios.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const pageEnd = Math.min(safePage * pageSize, filteredUsuarios.length);
  const paginatedUsuarios = filteredUsuarios.slice((safePage - 1) * pageSize, safePage * pageSize);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, safePage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    start = Math.max(1, end - maxVisible + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  useEffect(() => { setCurrentPage(1); }, [searchQuery, pageSize]);

  return (
    <main className="flex-1 bg-gray-50 p-8 mt-16">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl mb-6 overflow-hidden shadow-sm">
          <div className="flex items-center justify-between">
            <div className="p-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Usuários</h1>
              <p className="text-gray-600">Gerencie os usuários cadastrados</p>
            </div>
            <div className="w-96 h-32 bg-gradient-to-r from-teal-400 to-teal-600"></div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-6">
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

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 w-16">#</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Nome completo</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Estado</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Email</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Função</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Data de criação</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <UsuarioTableSkeleton rows={5} />
              ) : error ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <div className="text-red-500">{error}</div>
                    <button
                      onClick={fetchUsuarios}
                      className="mt-3 px-4 py-2 bg-[#44B16F] text-white rounded-lg hover:bg-[#3a9d5f] transition-colors"
                    >
                      Tentar novamente
                    </button>
                  </td>
                </tr>
              ) : filteredUsuarios.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                    Nenhum usuário encontrado
                  </td>
                </tr>
              ) : (
                paginatedUsuarios.map((usuario) => (
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
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Shield size={14} className={usuario.role === 'admin' ? 'text-amber-500' : 'text-blue-500'} />
                        <span className={`text-sm px-2 py-1 rounded-full ${usuario.role === 'admin'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-blue-100 text-blue-700'
                          }`}>
                          {usuario.roleName}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{usuario.data}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Ver detalhes">
                          <Eye size={18} className="text-gray-600" />
                        </button>
                        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Editar">
                          <Edit2 size={18} className="text-gray-600" />
                        </button>
                        {canDeleteRecords && (
                          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Excluir">
                            <Trash2 size={18} className="text-red-500" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Pagination */}
          {filteredUsuarios.length > 0 && (
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-gray-200">
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <span>Mostrando {pageStart}–{pageEnd} de {filteredUsuarios.length}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold whitespace-nowrap">Exibir por página</span>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#44B16F]"
                  >
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={1000}>1000</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={20} className="text-gray-600" />
                </button>

                <div className="flex items-center gap-1">
                  {getPageNumbers().map(pageNum => (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-10 h-10 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${pageNum === currentPage ? 'bg-[#44B16F] text-white' : 'hover:bg-gray-100 text-gray-700'}`}
                    >
                      {pageNum}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={20} className="text-gray-600" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
