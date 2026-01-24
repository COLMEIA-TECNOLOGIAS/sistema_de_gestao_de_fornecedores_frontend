import { Search, Bell, ChevronDown, User, LogOut, Trash2, Check, Loader2, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import LogoutConfirmModal from "../Components/LogoutConfirmModal";
import DatePicker from "../Components/DatePicker";
import { notificationsAPI } from "../../services/api";
import ModalDetalhesNotificacao from "../Components/ModalDetalhesNotificacao";

function Navbar({ userName: propUserName, userRole: propUserRole, userAvatar: propUserAvatar, onItemClick }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Notifications state
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);

  const dropdownRef = useRef(null);
  const notificationsRef = useRef(null);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const [countData, listData] = await Promise.all([
        notificationsAPI.getUnreadCount(),
        notificationsAPI.getAll()
      ]);

      // Handle unread count - assuming {count: 5} or just integer
      setUnreadCount(typeof countData === 'object' ? (countData.count || 0) : countData);

      // Handle notifications list - ensure it's an array
      let notifArray = [];
      if (Array.isArray(listData)) {
        notifArray = listData;
      } else if (listData && Array.isArray(listData.data)) {
        notifArray = listData.data;
      }

      console.log('Notifications fetched:', notifArray);
      setNotifications(notifArray);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      setNotifications([]);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll every 60 seconds
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogoutClick = () => {
    setIsDropdownOpen(false);
    setIsLogoutModalOpen(true);
  };

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
      // Optimistic update
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking as read", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setIsLoadingNotifications(true);
      await notificationsAPI.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read_at: new Date().toISOString() })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all as read", error);
    } finally {
      setIsLoadingNotifications(false);
    }
  };

  const handleDeleteNotification = async (id, e) => {
    e.stopPropagation(); // Prevent triggering other clicks
    try {
      await notificationsAPI.delete(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      // Re-fetch count just in case or decrement if it was unread
      // Ideally check if it was unread before decrementing, but fetching API is safer for sync
      fetchNotifications();
    } catch (error) {
      console.error("Error deleting notification", error);
    }
  };

  const toggleNotifications = () => {
    if (!isNotificationsOpen) {
      fetchNotifications(); // Refresh on open
    }
    setIsNotificationsOpen(!isNotificationsOpen);
    setIsDropdownOpen(false);
  };

  const handleNotificationClick = async (notification) => {
    try {
      if (!notification.read_at) {
        handleMarkAsRead(notification.id);
      }

      // Fetch full details
      const details = await notificationsAPI.getById(notification.id);
      setSelectedNotification(details);
    } catch (e) {
      console.error("Error fetching details", e);
      setSelectedNotification(notification);
    } finally {
      setIsNotificationsOpen(false);
    }
  };

  const userName = propUserName || user?.name || "Usuário";
  const userRole = propUserRole || user?.role || "Utilizador";
  const userAvatar = propUserAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userName}`;

  // Helper to get notification content
  const getNotificationContent = (notification) => {
    // Laravel notifications store data in `data` field
    const sv = notification.data || {};

    // Safely parse date
    let timeDisplay = 'Data desconhecida';
    try {
      if (notification.created_at) {
        const date = new Date(notification.created_at);
        if (!isNaN(date.getTime())) {
          timeDisplay = date.toLocaleString('pt-AO');
        }
      }
    } catch (e) {
      console.error("Error parsing date", e);
    }

    return {
      title: notification.title || sv.title || "Notificação",
      message: notification.message || sv.message || sv.description || "Nova notificação",
      timeDisplay
    };
  };

  return (
    <>
      <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between fixed top-0 left-0 right-0 z-50">
        <div className="flex items-center gap-8">
          {/* Logo Aumentada */}
          <div className="flex items-center gap-3">
            <img src="/login1.svg" className="w-12 h-12" alt="MOSAP3" />
            <span className="font-bold text-2xl">MOSAP3</span>
          </div>

          {/* Search Bar mais à direita (mas ainda no lado esquerdo) */}
          <div className="relative w-96 ml-16">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search for anything..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#44B16F]/20 focus:border-[#44B16F]"
            />
          </div>
        </div>

        {/* User Info with Dropdown */}
        <div className="flex items-center gap-4">
          <DatePicker />

          {/* Notifications */}
          <div className="relative" ref={notificationsRef}>
            <button
              onClick={toggleNotifications}
              className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none"
            >
              <Bell size={20} className="text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {isNotificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50 animate-fadeIn">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                  <h3 className="font-bold text-gray-900">Notificações</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      disabled={isLoadingNotifications}
                      className="text-xs font-medium text-[#44B16F] hover:text-[#3a9d5f] flex items-center gap-1 transition-colors"
                    >
                      {isLoadingNotifications ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                      Marcar todas
                    </button>
                  )}
                </div>

                <div className="max-h-[70vh] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <Bell size={32} className="mx-auto mb-3 text-gray-300" />
                      <p className="text-sm">Nenhuma notificação.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {notifications.map((notification) => {
                        const content = getNotificationContent(notification);
                        const isRead = !!notification.read_at;

                        return (
                          <div
                            key={notification.id}
                            className={`relative group px-4 py-4 hover:bg-gray-50 transition-colors cursor-pointer ${!isRead ? 'bg-blue-50/30' : ''}`}
                            onClick={() => handleNotificationClick(notification)}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${!isRead ? 'bg-blue-500' : 'bg-transparent'}`} />
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm ${!isRead ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                                  {content.title}
                                </p>
                                <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">
                                  {content.message}
                                </p>
                                <p className="text-xs text-gray-400 mt-1.5">
                                  {content.timeDisplay}
                                </p>
                              </div>
                              <button
                                onClick={(e) => handleDeleteNotification(notification.id, e)}
                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                title="Remover"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => {
                setIsDropdownOpen(!isDropdownOpen);
                setIsNotificationsOpen(false);
              }}
              className="flex items-center gap-3 hover:bg-gray-50 rounded-lg px-2 py-1 transition-colors"
            >
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{userName}</p>
                <p className="text-xs text-gray-500">{userRole}</p>
              </div>
              <img
                src={userAvatar}
                alt={userName}
                className="w-10 h-10 rounded-full object-cover"
              />
              <ChevronDown
                size={16}
                className={`text-gray-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    onItemClick('meu-perfil');
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors text-left"
                >
                  <User size={18} className="text-gray-500" />
                  <span className="text-sm">Meu Perfil</span>
                </button>
                <hr className="my-1 border-gray-100" />
                <button
                  onClick={handleLogoutClick}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={18} />
                  <span className="text-sm">Terminar Sessão</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Logout Confirmation Modal */}
      <LogoutConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleLogoutConfirm}
        isLoading={isLoggingOut}
      />
      <ModalDetalhesNotificacao
        isOpen={!!selectedNotification}
        notification={selectedNotification}
        onClose={() => setSelectedNotification(null)}
        onDelete={(id) => handleDeleteNotification(id)}
      />
    </>
  );
}

export default Navbar;