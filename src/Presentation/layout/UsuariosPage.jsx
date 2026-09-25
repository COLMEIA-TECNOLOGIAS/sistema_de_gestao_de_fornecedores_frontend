import { useMemo, useState } from "react";
import { Eye, Edit, Trash2, MailCheck, MailX, Users } from "lucide-react";
import ModalNovoUsuario from "../Components/ModalNovoUsuario";
import UsuarioTableSkeleton from "../Components/UsuarioTableSkeleton";
import ModalDetalhesUsuario from "../Components/ModalDetalhesUsuario";
import SearchInput from "../Components/ui/SearchInput";
import RefreshButton from "../Components/ui/RefreshButton";
import FilterChips from "../Components/ui/FilterChips";
import Pagination from "../Components/ui/Pagination";
import SortableHeader from "../Components/ui/SortableHeader";
import { EmptyState, ErrorState, StaleDataBanner } from "../Components/ui/StateViews";
import { usersAPI } from "../../services/api";
import { useUsers, useInvalidate } from "../../hooks/queries";
import { useUrlFilters } from "../../hooks/useUrlFilters";
import { useSortedItems, useClientPagination } from "../../hooks/useTableData";
import { queryKeys } from "../../lib/queryKeys";
import { useToast } from "../../context/ToastContext";
import { useConfirm } from "../../context/ConfirmContext";
import { getErrorMessage, matchesSearch } from "../../utils/apiHelpers";

const ROLE_LABELS = {
  admin: "Administrador",
  procurement_technician: "Técnico de Procurement",
  manager: "Gestor",
  viewer: "Visualizador",
};

const getRoleLabel = (role) => ROLE_LABELS[role] || role || "-";
const getUserName = (u) => u.name || u.nome || "";
const isUserActive = (u) => u.is_active !== false && u.is_active !== 0;

const FILTER_DEFAULTS = { q: "", estado: "", funcao: "", verificacao: "", sort: "", dir: "", page: 1, pageSize: 25 };

const ESTADO_LABELS = { activo: "Activo", inactivo: "Inactivo" };
const VERIFICACAO_LABELS = { verificado: "Verificado", pendente: "Não verificado" };

// Valores usados na ordenação por coluna (definidos fora do componente = estáveis)
const SORT_ACCESSORS = {
  id: (u) => Number(u.id) || 0,
  nome: getUserName,
  email: (u) => u.email,
  estado: (u) => (isUserActive(u) ? 0 : 1),
  funcao: (u) => getRoleLabel(u.role),
};

const thClass = "px-6 py-4 text-left text-sm font-semibold";
const thStyle = { color: 'var(--color-text-secondary)' };
const selectClass = "px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#44B16F]";
const selectStyle = { background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' };

export default function UsuariosPage() {
  const toast = useToast();
  const confirm = useConfirm();
  const invalidate = useInvalidate();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [resendingId, setResendingId] = useState(null);

  const { data: usuarios = [], isLoading, isFetching, isError, error, refetch, dataUpdatedAt } = useUsers();
  const { filters, setFilter, setFilters, resetFilters, activeCount } = useUrlFilters(FILTER_DEFAULTS);

  // Funções existentes nos dados (para o filtro)
  const roleOptions = useMemo(
    () => [...new Set(usuarios.map((u) => u.role).filter(Boolean))].sort(),
    [usuarios]
  );

  const filteredUsuarios = useMemo(() => usuarios.filter((u) => {
    if (!matchesSearch(filters.q, getUserName(u), u.email, getRoleLabel(u.role), u.id)) return false;
    if (filters.estado === "activo" && !isUserActive(u)) return false;
    if (filters.estado === "inactivo" && isUserActive(u)) return false;
    if (filters.funcao && u.role !== filters.funcao) return false;
    if (filters.verificacao === "verificado" && !u.email_verified_at) return false;
    if (filters.verificacao === "pendente" && u.email_verified_at) return false;
    return true;
  }), [usuarios, filters.q, filters.estado, filters.funcao, filters.verificacao]);

  const sortedUsuarios = useSortedItems(filteredUsuarios, filters, SORT_ACCESSORS);
  const pagination = useClientPagination(sortedUsuarios, filters.page, filters.pageSize);

  const chips = [
    filters.q && { key: "q", label: `"${filters.q}"`, onRemove: () => setFilter("q", "") },
    filters.estado && { key: "estado", label: `Estado: ${ESTADO_LABELS[filters.estado] || filters.estado}`, onRemove: () => setFilter("estado", "") },
    filters.funcao && { key: "funcao", label: `Função: ${getRoleLabel(filters.funcao)}`, onRemove: () => setFilter("funcao", "") },
    filters.verificacao && { key: "verificacao", label: VERIFICACAO_LABELS[filters.verificacao] || filters.verificacao, onRemove: () => setFilter("verificacao", "") },
  ];
  const clearFilters = () => resetFilters(["pageSize", "sort", "dir"]);

  const refreshUsers = () => invalidate(queryKeys.users.all);

  const handleUserSaved = (result) => {
    refreshUsers();
    setIsModalOpen(false);
    setSelectedUser(null);
    if (result?.message) toast.success(result.message);
  };

  const handleResendVerification = async (user) => {
    if (resendingId) return;
    setResendingId(user.id);
    try {
      await usersAPI.resendVerification(user.id);
      toast.success(`Novo código enviado para ${user.email}.`);
    } catch (err) {
      toast.error(getErrorMessage(err, "Erro ao reenviar o código."));
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

  const handleDelete = async (user) => {
    const label = getUserName(user) || user.email;
    const confirmed = await confirm({
      title: "Eliminar Utilizador",
      message: (
        <p className="text-gray-600">
          Tem a certeza de que pretende eliminar <strong className="text-gray-900">{label}</strong>?
          <span className="block text-sm text-gray-500 mt-2">Esta acção não pode ser desfeita.</span>
        </p>
      ),
      confirmLabel: "Sim, eliminar",
      runningLabel: "A eliminar...",
      variant: "danger",
      onConfirm: () => usersAPI.delete(user.id),
      getErrorMessage: (err) => getErrorMessage(err, "Erro ao eliminar o utilizador."),
    });
    if (confirmed) {
      toast.success(`Utilizador "${label}" eliminado com sucesso.`);
      refreshUsers();
    }
  };

  const hasData = usuarios.length > 0;

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="rounded-2xl p-8 shadow-sm flex items-center justify-between" style={{ background: 'var(--color-surface)' }}>
        <div>
          <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
            Utilizadores
          </h1>
          <h2 className="text-2xl font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
            Gestão de Utilizadores
          </h2>
          <p style={{ color: 'var(--color-text-secondary)' }}>Faça a gestão dos utilizadores registados no sistema</p>
        </div>
      </div>

      {/* Toolbar: pesquisa, filtros e actualização */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <SearchInput
            value={filters.q}
            onChange={(q) => setFilter("q", q)}
            placeholder="Pesquisar por nome, email ou função"
            className="w-full sm:w-80"
          />
          <select value={filters.estado} onChange={(e) => setFilter("estado", e.target.value)} className={selectClass} style={selectStyle} aria-label="Filtrar por estado">
            <option value="">Todos os estados</option>
            <option value="activo">Activo</option>
            <option value="inactivo">Inactivo</option>
          </select>
          <select value={filters.funcao} onChange={(e) => setFilter("funcao", e.target.value)} className={selectClass} style={selectStyle} aria-label="Filtrar por função">
            <option value="">Todas as funções</option>
            {roleOptions.map((role) => <option key={role} value={role}>{getRoleLabel(role)}</option>)}
          </select>
          <select value={filters.verificacao} onChange={(e) => setFilter("verificacao", e.target.value)} className={selectClass} style={selectStyle} aria-label="Filtrar por verificação de email">
            <option value="">Verificação: todos</option>
            <option value="verificado">Verificado</option>
            <option value="pendente">Não verificado</option>
          </select>
          <RefreshButton onClick={refetch} isFetching={isFetching} updatedAt={dataUpdatedAt} className="ml-auto" />
        </div>
        <FilterChips chips={chips} onClearAll={clearFilters} resultCount={activeCount > 0 ? filteredUsuarios.length : undefined} />
      </div>

      {/* Falha numa actualização em segundo plano: manter os dados antigos visíveis */}
      {isError && hasData && (
        <StaleDataBanner onRetry={refetch} isRetrying={isFetching} />
      )}

      {/* Table */}
      <div className="rounded-xl shadow-sm overflow-hidden" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border-light)' }}>
        {isError && !hasData ? (
          <ErrorState message={getErrorMessage(error, "Erro ao carregar utilizadores.")} onRetry={refetch} isRetrying={isFetching} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead style={{ background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border-light)' }}>
                  <tr>
                    <SortableHeader label="ID" sortKey="id" sort={filters.sort} dir={filters.dir} onSort={(sort, dir) => setFilters({ sort, dir })} className={thClass} style={thStyle} />
                    <SortableHeader label="Nome completo" sortKey="nome" sort={filters.sort} dir={filters.dir} onSort={(sort, dir) => setFilters({ sort, dir })} className={thClass} style={thStyle} />
                    <SortableHeader label="Estado" sortKey="estado" sort={filters.sort} dir={filters.dir} onSort={(sort, dir) => setFilters({ sort, dir })} className={thClass} style={thStyle} />
                    <SortableHeader label="Email" sortKey="email" sort={filters.sort} dir={filters.dir} onSort={(sort, dir) => setFilters({ sort, dir })} className={thClass} style={thStyle} />
                    <th className={thClass} style={thStyle}>Verificação</th>
                    <SortableHeader label="Função" sortKey="funcao" sort={filters.sort} dir={filters.dir} onSort={(sort, dir) => setFilters({ sort, dir })} className={thClass} style={thStyle} />
                    <th className="px-6 py-4 text-center text-sm font-semibold" style={thStyle}>Acções</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <UsuarioTableSkeleton rows={5} />
                  ) : pagination.total === 0 ? (
                    <tr>
                      <td colSpan="7">
                        {hasData ? (
                          <EmptyState filtered onClearFilters={clearFilters} />
                        ) : (
                          <EmptyState icon={Users} title="Nenhum utilizador registado" description="Adicione um utilizador para começar." />
                        )}
                      </td>
                    </tr>
                  ) : (
                    pagination.pageItems.map((u, index) => (
                      <tr key={u.id || index} className="transition-colors hover:bg-gray-50" style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                        <td className="px-6 py-4" style={{ color: 'var(--color-text-secondary)' }}>{u.id}</td>
                        <td className="px-6 py-4">
                          <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>{getUserName(u)}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${isUserActive(u) ? 'bg-green-500' : 'bg-red-500'}`}></span>
                            <span style={{ color: 'var(--color-text-secondary)' }}>{isUserActive(u) ? 'Activo' : 'Inactivo'}</span>
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
                                disabled={!!resendingId}
                                className="ml-1 text-amber-800 hover:text-amber-900 hover:underline disabled:opacity-50"
                                title="Reenviar código de confirmação"
                              >
                                {resendingId === u.id ? "A enviar..." : "Reenviar código"}
                              </button>
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4" style={{ color: 'var(--color-text-secondary)' }}>{getRoleLabel(u.role)}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleView(u)}
                              className="p-2 rounded-lg transition-colors hover:bg-gray-100"
                              title="Ver detalhes"
                              aria-label={`Ver detalhes de ${getUserName(u)}`}
                              style={{ color: 'var(--color-text-secondary)' }}
                            >
                              <Eye size={18} />
                            </button>
                            <button
                              onClick={() => handleEdit(u)}
                              className="p-2 rounded-lg transition-colors hover:bg-gray-100"
                              title="Editar"
                              aria-label={`Editar ${getUserName(u)}`}
                              style={{ color: 'var(--color-text-secondary)' }}
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete(u)}
                              className="p-2 rounded-lg transition-colors hover:bg-red-50"
                              title="Eliminar"
                              aria-label={`Eliminar ${getUserName(u)}`}
                              style={{ color: 'var(--color-error)' }}
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

            {!isLoading && (
              <Pagination
                page={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={(page) => setFilter("page", page)}
                total={pagination.total}
                start={pagination.start}
                end={pagination.end}
                pageSize={filters.pageSize}
                onPageSizeChange={(pageSize) => setFilter("pageSize", pageSize)}
                pageSizeOptions={[10, 25, 50, 100]}
              />
            )}
          </>
        )}
      </div>

      {/* Modal Novo/Edit Utilizador */}
      <ModalNovoUsuario
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedUser(null);
        }}
        onSuccess={handleUserSaved}
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
    </div>
  );
}
