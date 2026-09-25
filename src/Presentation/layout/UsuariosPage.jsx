import { useState, useEffect } from "react";
import { Eye, Edit, Trash2, RefreshCw, MailCheck, MailX, ChevronLeft, ChevronRight } from "lucide-react";
import ModalNovoUsuario from "../Components/ModalNovoUsuario";
import UsuarioTableSkeleton from "../Components/UsuarioTableSkeleton";
import ModalDetalhesUsuario from "../Components/ModalDetalhesUsuario";
import ModalConfirmarExclusaoUsuario from "../Components/ModalConfirmarExclusaoUsuario";
import Toast from "../Components/Toast";
import { usersAPI } from "../../services/api";

export default function UsuariosPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [usuarios, setUsuarios] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [error, setError] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [resendingId, setResendingId] = useState(null);
  const [toast, setToast] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [pageSize, setPageSize] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchUsuarios = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await usersAPI.getAll();
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

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const handleUserCreated = (result) => {
    fetchUsuarios();
    setIsModalOpen(false);
    setSelectedUser(null);
    if (result?.message) {
      setToast({ type: "success", message: result.message });
    }
  };

  const handleResendVerification = async (user) => {
    if (resendingId) return;
    setResendingId(user.id);
    try {
      await usersAPI.resendVerification(user.id);
      setToast({ type: "success", message: `Novo código enviado para ${user.email}.` });
    } catch (err) {
      console.error("Resend verification error:", err);
      setToast({ type: "error", message: err.response?.data?.message || "Erro ao reenviar o código." });
    } finally {
      setResendingId(null);
    }
  };

  const handleEdit = (user) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleView = (user) => {
    setSelectedUser(user);
    setIsViewModalOpen(true);
  };

  const handleDeleteClick = (user) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedUser) return;
    setIsDeleting(true);
    try {
      await usersAPI.delete(selectedUser.id);
      fetchUsuarios();
      setIsDeleteModalOpen(false);
      setSelectedUser(null);
    } catch (err) {
      console.error("Error deleting user:", err);
      alert("Erro ao excluir usuário.");
    } finally {
      setIsDeleting(false);
    }
  };

  const getRoleLabel = (role) => {
    const roles = {
      admin: "Administrador",
      procurement_technician: "Técnico de Procurement",
      manager: "Gestor",
      viewer: "Visualizador",
    };
    return roles[role] || role;
  };

  // Filter users based on search term
  const filteredUsuarios = usuarios.filter((user) => {
    const search = searchTerm.toLowerCase();
    const name = (user.name || user.nome || "").toLowerCase();
    const email = (user.email || "").toLowerCase();
    const role = (getRoleLabel(user.role) || "").toLowerCase();
    return name.includes(search) || email.includes(search) || role.includes(search);
  });

  // Pagination logic
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

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, pageSize]);

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="rounded-2xl p-8 shadow-sm flex items-center justify-between" style={{ background: 'var(--color-surface)' }}>
        <div>
          <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
            Usuários
          </h1>
          <h2 className="text-2xl font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
            Gestão de Usuários
          </h2>
          <p style={{ color: 'var(--color-text-secondary)' }}>Gerencie os usuários cadastrados no sistema</p>
        </div>

      </div>

      {/* Actions Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={fetchUsuarios}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-3 rounded-lg transition-colors"
            style={{ color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
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
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar usuário"
            className="pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#44B16F] focus:border-transparent w-64"
            style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
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

      {/* Table */}
      <div className="rounded-xl shadow-sm overflow-hidden" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border-light)' }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead style={{ background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border-light)' }}>
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>ID</th>
                <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                  <div className="flex items-center gap-2">
                    Nome completo
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                  <div className="flex items-center gap-2">
                    Estado
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Email</th>
                <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Verificação</th>
                <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Função</th>
                <th className="px-6 py-4 text-center text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <UsuarioTableSkeleton rows={5} />
              ) : filteredUsuarios.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center" style={{ color: 'var(--color-text-secondary)' }}>
                    <div className="flex flex-col items-center gap-2">
                      <svg className="w-12 h-12" style={{ color: 'var(--color-text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      <p className="text-lg font-medium">Nenhum usuário encontrado</p>
                      <p className="text-sm">Adicione um usuário para começar</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedUsuarios.map((u, index) => (
                  <tr key={u.id || index} className="transition-colors" style={{ borderBottom: '1px solid var(--color-border-light)' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td className="px-6 py-4" style={{ color: 'var(--color-text-secondary)' }}>{u.id}</td>
                    <td className="px-6 py-4">
                      <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>{u.name || u.nome}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${u.is_active !== false ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        <span style={{ color: 'var(--color-text-secondary)' }}>{u.is_active !== false ? 'Activo' : 'Inactivo'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4" style={{ color: 'var(--color-text-secondary)' }}>{u.email}</td>
                    <td className="px-6 py-4">
                      {u.email_verified_at ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-50 text-green-700">
                          <MailCheck size={14} />
                          Verificado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700">
                          <MailX size={14} />
                          Não verificado
                          <button
                            onClick={() => handleResendVerification(u)}
                            disabled={resendingId === u.id}
                            className="ml-1 text-amber-800 hover:text-amber-900 hover:underline disabled:opacity-50"
                            title="Reenviar código de confirmação"
                          >
                            {resendingId === u.id ? "Enviando..." : "Reenviar código"}
                          </button>
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4" style={{ color: 'var(--color-text-secondary)' }}>{getRoleLabel(u.role)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleView(u)}
                          className="p-2 rounded-lg transition-colors"
                          title="Ver detalhes"
                          style={{ color: 'var(--color-text-secondary)' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => handleEdit(u)}
                          className="p-2 rounded-lg transition-colors"
                          title="Editar"
                          style={{ color: 'var(--color-text-secondary)' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(u)}
                          className="p-2 rounded-lg transition-colors"
                          title="Excluir"
                          style={{ color: 'var(--color-error)' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--color-error-light)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {!isLoading && filteredUsuarios.length > 0 && (
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-6 py-4" style={{ borderTop: '1px solid var(--color-border-light)' }}>
            <div className="flex flex-wrap items-center gap-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              <span>
                Mostrando {pageStart}–{pageEnd} de {filteredUsuarios.length}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold whitespace-nowrap" style={{ color: 'var(--color-text-muted)' }}>Exibir por página</span>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="rounded-lg border bg-transparent outline-none text-sm px-2 py-1.5"
                  style={{ borderColor: 'var(--color-border-light)', color: 'var(--color-text-primary)' }}
                >
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={1000}>1000</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="px-3 py-2 rounded-lg border text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:bg-gray-50"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
              >
                <ChevronLeft size={18} />
              </button>

              {getPageNumbers().map(pageNum => (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-9 h-9 rounded-lg text-sm font-semibold transition-all border ${pageNum === currentPage ? 'bg-[#44B16F] text-white border-[#44B16F]' : 'border-gray-200 text-gray-700 hover:bg-gray-100'}`}
                >
                  {pageNum}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="px-3 py-2 rounded-lg border text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:bg-gray-50"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Novo/Edit Usuário */}
      <ModalNovoUsuario
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedUser(null);
        }}
        onSuccess={handleUserCreated}
        userToEdit={selectedUser}
      />

      {/* Modal Detalhes */}
      <ModalDetalhesUsuario
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
      />

      {/* Modal Confirmar Exclusão */}
      <ModalConfirmarExclusaoUsuario
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedUser(null);
        }}
        onConfirm={confirmDelete}
        user={selectedUser}
        isLoading={isDeleting}
      />

      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
