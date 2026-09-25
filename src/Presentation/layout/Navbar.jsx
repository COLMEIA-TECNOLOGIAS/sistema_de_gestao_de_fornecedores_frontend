import { Bell, Trash2, Check, Loader2, User, LogOut, ChevronDown, Sun, Moon, AlertTriangle, RefreshCw } from "lucide-react";
import { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../context/ToastContext";
import { useConfirm } from "../../context/ConfirmContext";
import { notificationsAPI } from "../../services/api";
import { useNotifications, useUnreadNotificationsCount, useDeletionRequests, useInvalidate } from "../../hooks/queries";
import { queryKeys } from "../../lib/queryKeys";
import { getErrorMessage } from "../../utils/apiHelpers";
import ModalDetalhesNotificacao from "../Components/ModalDetalhesNotificacao";
import ModalAprovacoesExclusao from "../Components/ModalAprovacoesExclusao";

// Actualização periódica (o TanStack Query pausa-a quando o separador não está visível)
const NOTIFICATIONS_POLL_MS = 30000;
const PENDING_APPROVALS_POLL_MS = 30000;
const PENDING_STATUSES = ['pending', 'pendente', 'in_progress', 'inprogress', 'aguardando', 'requested', '0'];

// Relógio isolado num componente próprio para que o tick de 1s não
// re-renderize toda a barra (lista de notificações, dropdowns, etc.).
function NavbarClock() {
  const [currentTime, setCurrentTime] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="hidden md:flex flex-col items-end justify-center mr-4" style={{ borderRight: '1px solid var(--color-border-light)', paddingRight: '16px' }}>
      <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
        {currentTime.toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </span>
      <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
        {currentTime.toLocaleDateString('pt-AO', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
      </span>
    </div>
  );
}

const isPendingDeletion = (req) => {
  const status = req.status || req.request_status || req.state;
  if (!status) return true;
  return PENDING_STATUSES.includes(String(status).toLowerCase());
};

// A API pode devolver a notificação directamente ou embrulhada em { data: {...} }
const unwrapNotification = (details) => {
  const unwrapped = details && details.id === undefined && details.data?.id !== undefined ? details.data : details;
  return unwrapped && typeof unwrapped === 'object' ? unwrapped : null;
};

function Navbar({ userName: propUserName, userRole: propUserRole, onItemClick }) {
  const { isDark, toggleTheme } = useTheme();
  const toast = useToast();
  const confirm = useConfirm();
  const invalidate = useInvalidate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [isAprovacoesModalOpen, setIsAprovacoesModalOpen] = useState(false);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const dropdownRef = useRef(null);
  const notificationsRef = useRef(null);
  const navigate = useNavigate();
  const { user, logout, isAdmin } = useAuth();

  const pollOptions = { refetchInterval: NOTIFICATIONS_POLL_MS, enabled: !!user };
  const notificationsQuery = useNotifications(pollOptions);
  const unreadQuery = useUnreadNotificationsCount(pollOptions);
  const notifications = useMemo(() => notificationsQuery.data ?? [], [notificationsQuery.data]);
  const unreadCount = unreadQuery.data ?? 0;

  // Contador de aprovações pendentes (apenas administradores)
  const deletionRequestsQuery = useDeletionRequests({ enabled: !!isAdmin, refetchInterval: PENDING_APPROVALS_POLL_MS });
  const pendingApprovalsCount = useMemo(
    () => (isAdmin ? (deletionRequestsQuery.data ?? []).filter(isPendingDeletion).length : 0),
    [isAdmin, deletionRequestsQuery.data]
  );

  // Detalhes completos da notificação seleccionada (a lista pode trazer só um resumo)
  const selectedId = selectedNotification?.id;
  const notificationDetailQuery = useQuery({
    queryKey: [...queryKeys.notifications.all, 'detail', selectedId],
    queryFn: async () => unwrapNotification(await notificationsAPI.getById(selectedId)),
    enabled: selectedId !== undefined && selectedId !== null,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
  const selectedNotificationDetails = useMemo(() => {
    if (!selectedNotification) return null;
    const details = notificationDetailQuery.data;
    return details ? { ...selectedNotification, ...details } : selectedNotification;
  }, [selectedNotification, notificationDetailQuery.data]);

  const refreshNotifications = () => invalidate(queryKeys.notifications.all);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsDropdownOpen(false);
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) setIsNotificationsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setIsDropdownOpen(false);
    const confirmed = await confirm({
      title: "Terminar Sessão",
      message: (
        <div className="text-center">
          <p className="text-gray-600">Tem a certeza de que deseja terminar a sessão?</p>
          <p className="text-gray-500 text-sm mt-2">Será redireccionado para a página de início de sessão.</p>
        </div>
      ),
      confirmLabel: "Sim, terminar sessão",
      runningLabel: "A terminar sessão...",
      variant: "danger",
      // O logout limpa sempre a sessão local, mesmo que o pedido à API falhe
      onConfirm: () => logout(),
    });
    if (confirmed) navigate("/login", { replace: true });
  };

  const handleMarkAsRead = async (id) => {
    try {
      await notificationsAPI.markAsRead(id);
    } catch (error) {
      console.warn("Não foi possível marcar a notificação como lida:", error);
    } finally {
      refreshNotifications();
    }
  };

  const handleMarkAllAsRead = async () => {
    if (isMarkingAll) return;
    setIsMarkingAll(true);
    try {
      await notificationsAPI.markAllAsRead();
      await refreshNotifications();
    } catch (error) {
      toast.error(getErrorMessage(error, "Não foi possível marcar as notificações como lidas."));
    } finally {
      setIsMarkingAll(false);
    }
  };

  // Devolve true em caso de sucesso (usado pelo modal de detalhes para fechar)
  const handleDeleteNotification = async (id, e) => {
    if (e) e.stopPropagation();
    if (deletingId !== null) return false;
    setDeletingId(id);
    try {
      await notificationsAPI.delete(id);
      await refreshNotifications();
      return true;
    } catch (error) {
      toast.error(getErrorMessage(error, "Não foi possível eliminar a notificação."));
      return false;
    } finally {
      setDeletingId(null);
    }
  };

  const toggleNotifications = () => {
    // Ao abrir, pedir dados frescos (a lista antiga continua visível entretanto)
    if (!isNotificationsOpen) refreshNotifications();
    setIsNotificationsOpen(!isNotificationsOpen);
    setIsDropdownOpen(false);
  };

  const handleNotificationClick = (notification) => {
    setIsNotificationsOpen(false);
    if (!notification.read_at) handleMarkAsRead(notification.id);
    setSelectedNotification(notification);
  };

  const userName = propUserName || user?.name || "Utilizador";
  const rawRole = propUserRole || user?.role;
  const userRole = (typeof rawRole === 'string' ? rawRole : rawRole?.name) || "Utilizador";
  const userInitials = userName.trim().split(/\s+/).map(n => n[0] || '').join('').toUpperCase().slice(0, 2) || 'U';

  const getNotificationContent = (notification) => {
    const sv = notification.data || {};
    let timeDisplay = 'Data desconhecida';
    if (notification.created_at) {
      const date = new Date(notification.created_at);
      if (!isNaN(date.getTime())) timeDisplay = date.toLocaleString('pt-AO');
    }

    const rawType = String(notification.type || sv.type || '');
    const type = (rawType || '').toLowerCase();

    const techName = sv.technician_name || sv.technicianName || sv.user?.name || sv.user_name || sv.requested_by || sv.requested_by_name || sv.nome || sv.name || 'Técnico';

    // Detect deletion request notifications
    const isDeletionRequest =
      type === 'deletion_request' ||
      rawType.includes('DeletionRequest') ||
      type.includes('deletion') ||
      type.includes('elimina') ||
      sv.deletion_request_id ||
      (sv.technician_name && sv.item_name);

    if (isDeletionRequest) {
      const itemName = sv.item_name || sv.itemName || sv.deletable?.company_name || sv.deletable?.commercial_name || sv.deletable?.title || sv.deletable?.name || 'Item';
      const isSupplier =
        (sv.deletable_type && (sv.deletable_type.includes('Supplier') || sv.deletable_type === 'supplier')) ||
        (sv.item_type && (sv.item_type.includes('Supplier') || sv.item_type === 'supplier')) ||
        type.includes('supplier');
      const itemType = isSupplier ? 'Fornecedor' : 'Pedido de Cotação';
      const reason = sv.reason || '';

      return {
        title: `Pedido de Eliminação — ${itemType}`,
        message: `${techName} solicitou a eliminação do ${itemType.toLowerCase()} "${itemName}"${reason ? ` — Motivo: ${reason}` : ''}`,
        timeDisplay,
        isDeletionRequest: true,
      };
    }

    // Detect quotation request notifications (not deletion-related)
    const isQuotationRequest =
      type === 'quotation_request' ||
      rawType.includes('QuotationRequest') ||
      type.includes('quotation') ||
      type.includes('cotação') ||
      type.includes('cotacao') ||
      (techName !== 'Técnico' && (sv.quotation_id || sv.quotation_request_id));

    if (isQuotationRequest) {
      const assunto = sv.assunto || sv.subject || sv.title || sv.activity_name || sv.item_name || sv.activity_description || 'Pedido de Cotação';
      return {
        title: `Pedido de Cotação`,
        message: `${techName} criou um novo pedido de cotação: "${assunto}"`,
        timeDisplay,
        isDeletionRequest: false,
      };
    }

    // Detect activity/atividade notifications
    const isActivity =
      type === 'activity' ||
      type === 'atividade' ||
      rawType.includes('Activity') ||
      rawType.includes('Atividade') ||
      type.includes('activity') ||
      type.includes('atividade') ||
      (techName !== 'Técnico' && (sv.activity_name || sv.activity_id));

    if (isActivity) {
      const activityName = sv.activity_name || sv.title || sv.item_name || sv.name || 'Actividade';
      return {
        title: `Nova Actividade`,
        message: `${techName} registou uma nova actividade: "${activityName}"`,
        timeDisplay,
        isDeletionRequest: false,
      };
    }

    return {
      title: notification.title || sv.title || "Notificação",
      message: notification.message || sv.message || sv.description || "Nova notificação",
      timeDisplay,
      isDeletionRequest: false,
    };
  };



  return (
    <>
      <header
        className="flex items-center gap-4 px-6"
        style={{
          height: 'var(--topbar-height)',
          borderBottom: '1px solid var(--color-border-light)',
          background: 'var(--color-surface)',
        }}
      >
        {/* Spacer */}
        <div className="flex-1" />

        {/* Time and Date */}
        <NavbarClock />

        {/* Right: Dark mode + Notifications + User */}
        <div className="flex items-center gap-2">

          {/* Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            className="relative p-2.5 rounded-xl transition-all duration-200"
            style={{ color: 'var(--color-text-secondary)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            title={isDark ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
          >
            <span style={{ display: 'flex', transition: 'transform 0.3s, opacity 0.3s', transform: isDark ? 'rotate(0deg)' : 'rotate(180deg)', opacity: 1 }}>
              {isDark ? <Sun size={18} style={{ color: '#FBBF24' }} /> : <Moon size={18} />}
            </span>
          </button>

          {/* Admin Approvals */}
          {isAdmin && (
            <button
              onClick={() => {
                setIsAprovacoesModalOpen(true);
                setIsDropdownOpen(false);
                setIsNotificationsOpen(false);
              }}
              className="relative p-2.5 rounded-xl transition-colors"
              style={{ color: pendingApprovalsCount > 0 ? '#F97316' : 'var(--color-text-secondary)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              title={`Aprovações Pendentes${pendingApprovalsCount > 0 ? ` (${pendingApprovalsCount})` : ''}`}
            >
              <AlertTriangle size={18} />
              {pendingApprovalsCount > 0 && (
                <span
                  className="absolute top-1.5 right-1.5 flex items-center justify-center rounded-full text-white font-bold"
                  style={{ background: '#F97316', fontSize: '9px', width: '15px', height: '15px' }}
                >
                  {pendingApprovalsCount > 9 ? '9+' : pendingApprovalsCount}
                </span>
              )}
            </button>
          )}

          {/* Notifications */}
          <div className="relative" ref={notificationsRef}>
            <button
              onClick={toggleNotifications}
              className="relative p-2.5 rounded-xl transition-colors"
              style={{ color: 'var(--color-text-secondary)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span
                  className="absolute top-1.5 right-1.5 flex items-center justify-center rounded-full text-white font-bold"
                  style={{ background: '#EF4444', fontSize: '9px', width: '15px', height: '15px' }}
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {isNotificationsOpen && (
              <div
                className="absolute right-0 mt-2 rounded-2xl overflow-hidden animate-fadeIn"
                style={{
                  width: '360px',
                  border: '1px solid var(--color-border)',
                  boxShadow: 'var(--shadow-xl)',
                  background: 'var(--color-surface)',
                  zIndex: 100,
                  top: '100%',
                }}
              >
                <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--color-border-light)' }}>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm" style={{ color: 'var(--color-text-primary)' }}>Notificações</h3>
                    {unreadCount > 0 && (
                      <span className="badge badge-error text-xs px-2 py-0.5">{unreadCount} novas</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {notificationsQuery.isFetching && (
                      <Loader2 size={12} className="animate-spin" style={{ color: 'var(--color-text-muted)' }} aria-label="A actualizar" />
                    )}
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllAsRead}
                        disabled={isMarkingAll}
                        className="text-xs font-semibold flex items-center gap-1 transition-colors disabled:opacity-60"
                        style={{ color: 'var(--color-primary)' }}
                      >
                        {isMarkingAll ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
                        Marcar todas
                      </button>
                    )}
                  </div>
                </div>

                <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
                  {notificationsQuery.isError && notificationsQuery.data !== undefined && (
                    <div className="flex items-center justify-between gap-2 px-4 py-2 text-xs bg-amber-50 text-amber-800 border-b border-amber-200">
                      <span>Não foi possível actualizar as notificações.</span>
                      <button
                        onClick={() => notificationsQuery.refetch()}
                        disabled={notificationsQuery.isFetching}
                        className="font-semibold hover:underline disabled:opacity-60"
                      >
                        Tentar novamente
                      </button>
                    </div>
                  )}
                  {notificationsQuery.isLoading ? (
                    <div className="flex items-center justify-center gap-2 py-10 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                      <Loader2 size={16} className="animate-spin" />
                      A carregar notificações...
                    </div>
                  ) : notificationsQuery.isError && notificationsQuery.data === undefined ? (
                    <div className="flex flex-col items-center gap-3 py-10 px-4 text-center">
                      <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                        {getErrorMessage(notificationsQuery.error, "Não foi possível carregar as notificações.")}
                      </p>
                      <button
                        onClick={() => notificationsQuery.refetch()}
                        disabled={notificationsQuery.isFetching}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border disabled:opacity-60"
                        style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                      >
                        <RefreshCw size={12} className={notificationsQuery.isFetching ? "animate-spin" : ""} />
                        Tentar novamente
                      </button>
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="empty-state py-10">
                      <div className="empty-state-icon">
                        <Bell size={24} style={{ color: 'var(--color-text-muted)' }} />
                      </div>
                      <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Sem notificações</p>
                    </div>
                  ) : (
                    <div>
                      {notifications.map((notification) => {
                        const content = getNotificationContent(notification);
                        const isRead = !!notification.read_at;
                        const unreadBg = content.isDeletionRequest ? 'rgba(249,115,22,0.06)' : 'rgba(68,177,111,0.04)';
                        const dotColor = content.isDeletionRequest ? '#F97316' : 'var(--color-primary)';
                        return (
                          <div
                            key={notification.id}
                            className="group relative flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors border-b"
                            style={{
                              borderColor: 'var(--color-border-light)',
                              background: !isRead ? unreadBg : 'transparent',
                              borderLeft: content.isDeletionRequest ? '3px solid #F97316' : '3px solid transparent',
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg)'}
                            onMouseLeave={e => e.currentTarget.style.background = !isRead ? unreadBg : 'transparent'}
                            onClick={() => handleNotificationClick(notification)}
                          >
                            <div
                              className="mt-1.5 w-2 h-2 rounded-full flex-shrink-0"
                              style={{ background: !isRead ? dotColor : 'transparent' }}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p
                                  className="text-sm line-clamp-1"
                                  style={{ fontWeight: !isRead ? 600 : 500, color: content.isDeletionRequest ? '#EA580C' : 'var(--color-text-primary)' }}
                                >
                                  {content.title}
                                </p>
                                {content.isDeletionRequest && (
                                  <span className="flex-shrink-0 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-orange-50 text-orange-600 border border-orange-200">
                                    Exclusão
                                  </span>
                                )}
                              </div>
                              <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'var(--color-text-secondary)' }}>
                                {content.message}
                              </p>
                              <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                                {content.timeDisplay}
                              </p>
                            </div>
                            <button
                              onClick={(e) => handleDeleteNotification(notification.id, e)}
                              disabled={deletingId !== null}
                              title="Eliminar notificação"
                              aria-label="Eliminar notificação"
                              className={`p-1 rounded-lg transition-all disabled:cursor-wait ${deletingId === notification.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus:opacity-100'}`}
                              style={{ color: 'var(--color-text-muted)' }}
                              onMouseEnter={e => { e.currentTarget.style.background = '#FEE2E2'; e.currentTarget.style.color = '#DC2626'; }}
                              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-text-muted)'; }}
                            >
                              {deletingId === notification.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Divider */}
          <div style={{ width: '1px', height: '28px', background: 'var(--color-border-light)' }} />

          {/* User Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => { setIsDropdownOpen(!isDropdownOpen); setIsNotificationsOpen(false); }}
              className="flex items-center gap-2.5 pl-1 pr-3 py-1.5 rounded-xl transition-colors"
              onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              {/* Avatar initials */}
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))' }}
              >
                {userInitials}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-semibold leading-tight" style={{ color: 'var(--color-text-primary)' }}>
                  {userName.split(' ')[0]}
                </p>
                <p className="text-xs leading-tight" style={{ color: 'var(--color-text-muted)' }}>{userRole}</p>
              </div>
              <ChevronDown
                size={14}
                style={{ color: 'var(--color-text-muted)', transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}
              />
            </button>

            {isDropdownOpen && (
              <div
                className="absolute right-0 mt-2 rounded-2xl overflow-hidden animate-fadeIn"
                style={{
                  width: '200px',
                  border: '1px solid var(--color-border)',
                  boxShadow: 'var(--shadow-xl)',
                  background: 'var(--color-surface)',
                  zIndex: 100,
                  top: '100%',
                }}
              >
                <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--color-border-light)' }}>
                  <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{userName}</p>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{userRole}</p>
                </div>
                <div className="py-1">
                  <button
                    onClick={() => { setIsDropdownOpen(false); onItemClick?.('meu-perfil'); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
                    style={{ color: 'var(--color-text-secondary)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <User size={15} />
                    Meu Perfil
                  </button>
                  <div className="mx-3 my-1" style={{ height: '1px', background: 'var(--color-border-light)' }} />
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
                    style={{ color: '#DC2626' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#FEF2F2'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <LogOut size={15} />
                    Terminar Sessão
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Modals */}
      {/* O contador de pendentes actualiza-se sozinho: o modal invalida 'deletion-requests' ao aprovar/recusar */}
      <ModalAprovacoesExclusao
        isOpen={isAprovacoesModalOpen}
        onClose={() => setIsAprovacoesModalOpen(false)}
      />

      <ModalDetalhesNotificacao
        isOpen={!!selectedNotification}
        onClose={() => setSelectedNotification(null)}
        notification={selectedNotificationDetails}
        onDelete={handleDeleteNotification}
        isDeleting={selectedId !== undefined && deletingId === selectedId}
      />
    </>
  );
}

export default Navbar;