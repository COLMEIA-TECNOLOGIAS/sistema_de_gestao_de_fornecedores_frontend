import { Bell, Trash2, Check, Loader2, User, LogOut, ChevronDown, Sun, Moon, AlertTriangle } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { notificationsAPI, pendingDeletionsAPI } from "../../services/api";
import ModalDetalhesNotificacao from "../Components/ModalDetalhesNotificacao";
import LogoutConfirmModal from "../Components/LogoutConfirmModal";
import ModalAprovacoesExclusao from "../Components/ModalAprovacoesExclusao";

const PAGE_TITLES = {
  dashboard:    "Painel de Controlo",
  fornecedores: "Fornecedores",
  cotacoes:     "Cotações",
  usuarios:     "Gestão de utilizadores",
  relatorios:   "Relatórios",
  aquisicoes:   "Aquisições",
  categorias:   "Categorias",
  produtos:     "Produtos",
  "meu-perfil": "Meu Perfil",
};

const PAGE_SUBTITLES = {
  dashboard:    "Aqui está o resumo das suas atividades.",
  fornecedores: "Gerencie os fornecedores cadastrados.",
  cotacoes:     "Consulte e gerencie as cotações.",
  usuarios:     "Gerencie os utilizadores do sistema.",
  relatorios:   "Análise detalhada e métricas de desempenho.",
  aquisicoes:   "Gerencie as aquisições e respostas.",
  categorias:   "Organize as categorias de produtos.",
  produtos:     "Gerencie o catálogo de produtos.",
  "meu-perfil": "Gerencie as suas informações pessoais.",
};

function Navbar({ userName: propUserName, userRole: propUserRole, onItemClick, activeItem }) {
  const { isDark, toggleTheme } = useTheme();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [locationInfo, setLocationInfo] = useState({ country: 'Angola', city: 'Luanda', local: '' });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [isAprovacoesModalOpen, setIsAprovacoesModalOpen] = useState(false);
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState(0);

  const dropdownRef = useRef(null);
  const notificationsRef = useRef(null);
  const navigate = useNavigate();
  const { user, logout, isAdmin } = useAuth();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchNotifications = async () => {
    try {
      const [countData, listData] = await Promise.all([
        notificationsAPI.getUnreadCount(),
        notificationsAPI.getAll()
      ]);
      setUnreadCount(typeof countData === 'object' ? (countData.count || 0) : countData);
      let notifArray = [];
      if (Array.isArray(listData)) notifArray = listData;
      else if (listData && Array.isArray(listData.data)) notifArray = listData.data;
      setNotifications(notifArray);
    } catch (error) {
      setNotifications([]);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  // Poll pending approvals count (admin only)
  useEffect(() => {
    if (!isAdmin) return;
    const fetchPendingCount = async () => {
      try {
        const response = await pendingDeletionsAPI.getAll();
        const listData = response?.data || response || [];
        let requestsArray = Array.isArray(listData) ? listData : (listData.data || []);
        
        requestsArray = requestsArray.filter(req => {
            const status = req.status || req.request_status || req.state;
            if (!status) return true;
            const s = String(status).toLowerCase();
            return ['pending', 'pendente', 'in_progress', 'inprogress', 'aguardando', 'requested', '0'].includes(s);
        });
        
        setPendingApprovalsCount(requestsArray.length);
      } catch (e) {
        // ignore
      }
    };
    fetchPendingCount();
    const interval = setInterval(fetchPendingCount, 15000);
    return () => clearInterval(interval);
  }, [isAdmin]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsDropdownOpen(false);
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) setIsNotificationsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogoutConfirm = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      navigate("/login");
    } finally {
      setIsLoggingOut(false);
      setIsLogoutModalOpen(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await notificationsAPI.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) { console.error("Error marking as read", error); }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setIsLoadingNotifications(true);
      await notificationsAPI.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read_at: new Date().toISOString() })));
      setUnreadCount(0);
    } catch (error) { console.error("Error marking all as read", error); }
    finally { setIsLoadingNotifications(false); }
  };

  const handleDeleteNotification = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await notificationsAPI.delete(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      fetchNotifications();
    } catch (error) { console.error("Error deleting notification", error); }
  };

  const toggleNotifications = () => {
    if (!isNotificationsOpen) fetchNotifications();
    setIsNotificationsOpen(!isNotificationsOpen);
    setIsDropdownOpen(false);
  };

  const handleNotificationClick = async (notification) => {
    try {
      if (!notification.read_at) handleMarkAsRead(notification.id);
      const details = await notificationsAPI.getById(notification.id);
      setSelectedNotification(details);
    } catch (e) { setSelectedNotification(notification); }
    finally { setIsNotificationsOpen(false); }
  };

  const userName = propUserName || user?.name || "Utilizador";
  const userRole = propUserRole || user?.role || "Utilizador";
  const userInitials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const getNotificationContent = (notification) => {
    const sv = notification.data || {};
    let timeDisplay = 'Data desconhecida';
    try {
      if (notification.created_at) {
        const date = new Date(notification.created_at);
        if (!isNaN(date.getTime())) timeDisplay = date.toLocaleString('pt-AO');
      }
    } catch (e) {}

    const rawType = notification.type || sv.type || '';
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

        {/* Time and Location */}
        <div className="hidden md:flex flex-col items-end justify-center mr-4" style={{ borderRight: '1px solid var(--color-border-light)', paddingRight: '16px' }}>
          <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            {currentTime.toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
          <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            Luanda, Angola
          </span>
        </div>

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
                setPendingApprovalsCount(0); // Reset badge when opened
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
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      disabled={isLoadingNotifications}
                      className="text-xs font-semibold flex items-center gap-1 transition-colors"
                      style={{ color: 'var(--color-primary)' }}
                    >
                      {isLoadingNotifications ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
                      Marcar todas
                    </button>
                  )}
                </div>

                <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
                  {notifications.length === 0 ? (
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
                              className="p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                              style={{ color: 'var(--color-text-muted)' }}
                              onMouseEnter={e => { e.currentTarget.style.background = '#FEE2E2'; e.currentTarget.style.color = '#DC2626'; }}
                              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-text-muted)'; }}
                            >
                              <Trash2 size={13} />
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
                    onClick={() => { setIsDropdownOpen(false); onItemClick('meu-perfil'); }}
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
                    onClick={() => { setIsDropdownOpen(false); setIsLogoutModalOpen(true); }}
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

      <LogoutConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleLogoutConfirm}
        isLoading={isLoggingOut}
      />
      {/* Modals */}
      <ModalAprovacoesExclusao
        isOpen={isAprovacoesModalOpen}
        onClose={() => setIsAprovacoesModalOpen(false)}
      />

      <ModalDetalhesNotificacao
        isOpen={!!selectedNotification}
        onClose={() => setSelectedNotification(null)}
        notification={selectedNotification}
        onDelete={handleDeleteNotification}
      />
    </>
  );
}

export default Navbar;