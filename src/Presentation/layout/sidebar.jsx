import { LayoutDashboard, Package, UserCircle, BarChart3, ShoppingCart, Settings, FileText, Tag, Activity, ChevronDown, ChevronRight, Users, UserPlus, Shield } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { PERMISSIONS } from "../../utils/permissions";
import LogoutConfirmModal from "../Components/LogoutConfirmModal";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Sidebar({ activeItem, onItemClick }) {
  const { hasPermission, isAdmin, logout, user, permissionsLoaded } = useAuth();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  // Default expanded for "usuarios" if we are in one of its paths
  const isUsuariosActive = ["usuarios", "criar-utilizador", "permissoes"].includes(activeItem);
  const [expandedMenus, setExpandedMenus] = useState({ "usuarios_group": isUsuariosActive });
  const navigate = useNavigate();

  const toggleMenu = (id) => {
    setExpandedMenus(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Verifica se o utilizador tem permissão para um menu.
  // Para admins: sempre true.
  // Para não-admins: usa estritamente as permissões da API.
  const canSeeMenu = (permission) => {
    if (isAdmin) return true;
    if (!permission) return false;

    // Usar estritamente as permissões carregadas da API
    if (user?.apiPermissions && user.apiPermissions.permissionsMap !== undefined) {
      const map = user.apiPermissions.permissionsMap;
      const perm = map[permission];
      return !!(perm && perm.access !== false);
    }

    // Se as permissões ainda não carregaram ou estão vazias, negar acesso por segurança
    return false;
  };

  const mainMenuItems = [
    { id: "dashboard",   label: "Painel de Controlo",   icon: LayoutDashboard, permission: PERMISSIONS.DASHBOARD },
    { id: "fornecedores",label: "Fornecedores", icon: Package,         permission: PERMISSIONS.FORNECEDORES },
    { id: "aquisicoes",  label: "Aquisições",   icon: ShoppingCart,    permission: PERMISSIONS.AQUISICOES },
    { id: "relatorios",  label: "Relatórios e Análises", icon: BarChart3,     permission: PERMISSIONS.RELATORIOS },
    { 
      id: "usuarios_group",
      label: "Gestão de utilizadores", 
      icon: UserCircle, 
      permission: PERMISSIONS.USUARIOS, 
      adminOnly: true,
      subItems: [
        { id: "usuarios", label: "Lista de Utilizadores", icon: Users },
        { id: "criar-utilizador", label: "Criar Utilizador", icon: UserPlus },
        { id: "permissoes", label: "Gestão de Permissões", icon: Shield }
      ]
    },
    { id: "logs-eventos",label: "Gestão de Logs", icon: Activity,        permission: PERMISSIONS.AUDITORIA, adminOnly: true },
  ];

  const menuItems = mainMenuItems.filter(item => {
    if (item.adminOnly && !isAdmin) return false;
    return canSeeMenu(item.permission);
  });

  // Enquanto as permissões ainda não carregaram, não mostrar menus
  const showMenu = isAdmin || permissionsLoaded;

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
          
          {!showMenu ? (
            <div className="mt-4 space-y-2">
              {[1,2,3].map(i => (
                <div key={i} className="h-10 rounded-xl animate-pulse" style={{ background: 'var(--color-border-light)' }} />
              ))}
            </div>
          ) : menuItems.length === 0 ? (
            <div className="mt-4 p-3 rounded-xl border border-dashed text-center" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg)' }}>
              <Shield size={24} className="mx-auto mb-2 text-gray-400 opacity-50" />
              <p className="text-xs font-medium text-gray-500">Sem acessos</p>
              <p className="text-[10px] text-gray-400 mt-1">Contacte o administrador para lhe atribuir permissões.</p>
            </div>
          ) : (
          <div className="space-y-0.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const hasSub = item.subItems && item.subItems.length > 0;
              const isGroupActive = hasSub && item.subItems.some(sub => sub.id === activeItem);
              const isActive = activeItem === item.id || isGroupActive;
              const isExpanded = expandedMenus[item.id];

              return (
                <div key={item.id} className="flex flex-col">
                  <button
                    onClick={() => {
                      if (hasSub) {
                        toggleMenu(item.id);
                      } else {
                        handleItemClick(item.id);
                      }
                    }}
                    className={`sidebar-item ${isActive && !hasSub ? 'active' : ''}`}
                    style={hasSub && isGroupActive && !isExpanded ? { color: 'var(--color-primary)', fontWeight: 600 } : {}}
                  >
                    <Icon size={17} className="flex-shrink-0" />
                    <span className="whitespace-nowrap flex-1 text-left">{item.label}</span>
                    {hasSub && (
                      <span className="ml-auto flex-shrink-0 opacity-60">
                        {isExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                      </span>
                    )}
                  </button>
                  
                  {/* Submenus */}
                  {hasSub && isExpanded && (
                    <div className="flex flex-col mt-1 mb-1 ml-4 border-l-2 border-gray-100 dark:border-gray-800 space-y-0.5" style={{ paddingLeft: '8px' }}>
                      {item.subItems.map((sub) => {
                        const SubIcon = sub.icon;
                        const isSubActive = activeItem === sub.id;
                        return (
                          <button
                            key={sub.id}
                            onClick={() => handleItemClick(sub.id)}
                            className={`sidebar-item ${isSubActive ? 'active' : ''}`}
                            style={{ padding: '8px 12px', fontSize: '0.8125rem' }}
                          >
                            {SubIcon && <SubIcon size={15} className="flex-shrink-0" />}
                            <span className="whitespace-nowrap">{sub.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          )}
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