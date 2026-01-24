import { Search, Bell, ChevronDown, User, LogOut, MessageSquare } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import LogoutConfirmModal from "../Components/LogoutConfirmModal";
import DatePicker from "../Components/DatePicker";

function Navbar({ userName: propUserName, userRole: propUserRole, userAvatar: propUserAvatar, onItemClick }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
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

  const userName = propUserName || user?.name || "Usuário";
  const userRole = propUserRole || user?.role || "Utilizador";
  const userAvatar = propUserAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userName}`;

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

          <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <MessageSquare size={20} className="text-gray-600" />
          </button>

          <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Bell size={20} className="text-gray-600" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full"></span>
          </button>

          {/* User Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
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
    </>
  );
}

export default Navbar;