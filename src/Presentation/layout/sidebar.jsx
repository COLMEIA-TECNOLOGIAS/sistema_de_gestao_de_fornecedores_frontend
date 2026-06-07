import { LayoutDashboard, Package, UserCircle, BarChart3, ShoppingCart, Settings, FileText, Tag } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { PERMISSIONS } from "../../utils/permissions";
import LogoutConfirmModal from "../Components/LogoutConfirmModal";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Sidebar({ activeItem, onItemClick }) {
  const { hasPermission, isAdmin, logout } = useAuth();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const navigate = useNavigate();

  const mainMenuItems = [
    { id: "dashboard",   label: "Dashboard",   icon: LayoutDashboard, permission: PERMISSIONS.DASHBOARD },
    { id: "fornecedores",label: "Fornecedores", icon: Package,         permission: PERMISSIONS.FORNECEDORES },
    { id: "cotacoes",    label: "Cotações",     icon: FileText,        permission: PERMISSIONS.COTACOES },
    { id: "aquisicoes",  label: "Aquisições",   icon: ShoppingCart,    permission: PERMISSIONS.AQUISICOES },
    { id: "categorias",  label: "Categorias",   icon: Settings,        permission: PERMISSIONS.CATEGORIAS },
    { id: "relatorios",  label: "Relatórios",   icon: BarChart3,       permission: PERMISSIONS.RELATORIOS },
    { id: "usuarios",    label: "Usuários",     icon: UserCircle,      permission: PERMISSIONS.USUARIOS, adminOnly: true },
    { id: "logs-eventos",label: "Logs de Eventos", icon: FileText,     permission: PERMISSIONS.USUARIOS, adminOnly: true },
  ];

  const menuItems = mainMenuItems.filter(item => {
    if (item.adminOnly && !isAdmin) return false;
    return hasPermission(item.permission);
  });

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

  const handleItemClick = (id) => {
    onItemClick(id);
  };

  return (
    <>
      {/* Sidebar — fills parent container width */}
      <aside
        className="h-screen flex flex-col"
        style={{
          width: 'var(--sidebar-width)',
          background: 'var(--color-surface)',
          borderRight: '1px solid var(--color-border-light)',
          overflow: 'hidden',
        }}
      >
        {/* Logo Header */}
        <div className="flex items-center gap-3 px-5 py-5 flex-shrink-0">
          <div
            className="w-9 h-9 flex items-center justify-center overflow-hidden flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))', borderRadius: '8px' }}
          >
            <img src="/login1.svg" alt="MOSAP3" className="w-6 h-6 object-contain" style={{ filter: 'brightness(0) invert(1)' }} />
          </div>
          <span className="font-bold text-base whitespace-nowrap" style={{ color: 'var(--color-text-primary)' }}>MOSAP3</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 pb-4">
          <p className="sidebar-section-label" style={{ marginTop: '8px' }}>Menu Principal</p>
          <div className="space-y-0.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeItem === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item.id)}
                  className={`sidebar-item ${isActive ? 'active' : ''}`}
                >
                  <Icon size={17} className="flex-shrink-0" />
                  <span className="whitespace-nowrap">{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </aside>

      {/* Logout Modal */}
      <LogoutConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleLogoutConfirm}
        isLoading={isLoggingOut}
      />
    </>
  );
}

export default Sidebar;