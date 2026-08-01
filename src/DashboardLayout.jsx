import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "./Presentation/layout/Navbar";
import Sidebar from "./Presentation/layout/sidebar";
import MainContent from "./Presentation/layout/MainContent";
import { useAuth } from "./context/AuthContext";
import { PERMISSIONS } from "./utils/permissions";

export default function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeItem, setActiveItem] = useState("dashboard");

  // Update activeItem based on URL
  useEffect(() => {
    const path = location.pathname.split("/")[1];
    const validPaths = ["dashboard", "fornecedores", "usuarios", "criar-utilizador", "permissoes", "relatorios", "aquisicoes", "meu-perfil", "produtos", "logs-eventos", "config"];
    if (path && validPaths.includes(path)) {
      setActiveItem(path);
    }
  }, [location.pathname]);

  const handleItemClick = (id) => {
    navigate(`/${id}`);
  };

  const { user, userRoleName, hasPermission: checkPermission, isAdmin } = useAuth();

  const userName = user?.name || user?.nome || "Utilizador";
  // Verifica permissão usando a API quando disponível (mesmo critério que a sidebar)
  const canAccessPage = (permission) => {
    if (isAdmin) return true;
    if (!permission) return false;
    
    // Usar estritamente as permissões carregadas da API
    if (user?.apiPermissions && user.apiPermissions.permissionsMap !== undefined) {
      const map = user.apiPermissions.permissionsMap;
      const perm = map[permission];
      return !!(perm && perm.access !== false);
    }
    
    // Se as permissões ainda não carregaram ou estão vazias, negar acesso
    return false;
  };

  // Permission check redirect
  useEffect(() => {
    const permissionMap = {
      dashboard:    PERMISSIONS.DASHBOARD,
      fornecedores: PERMISSIONS.FORNECEDORES,
      usuarios:     PERMISSIONS.USUARIOS,
      "criar-utilizador": PERMISSIONS.USUARIOS,
      permissoes:   PERMISSIONS.USUARIOS,
      relatorios:   PERMISSIONS.RELATORIOS,
      aquisicoes:   PERMISSIONS.AQUISICOES,
      produtos:     PERMISSIONS.PRODUTOS,
      config:       PERMISSIONS.CONFIGURACOES,
      "logs-eventos": PERMISSIONS.AUDITORIA,
    };
    const requiredPermission = permissionMap[activeItem];
    if (requiredPermission && !canAccessPage(requiredPermission)) {
      setActiveItem("dashboard");
    }
  }, [activeItem, user]);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--color-bg)' }}>
      {/* Sidebar — always visible */}
      <div style={{ flexShrink: 0, position: 'relative', zIndex: 50 }}>
        <Sidebar
          activeItem={activeItem}
          onItemClick={handleItemClick}
        />
      </div>

      {/* Main Area */}
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        {/* Topbar */}
        <Navbar
          userName={userName}
          userRole={userRoleName}
          onItemClick={handleItemClick}
          activeItem={activeItem}
        />

        {/* Page Content */}
        <main
          className="flex-1 overflow-y-auto"
          style={{ padding: '24px', background: 'var(--color-bg)' }}
        >
          <MainContent activeItem={activeItem} />
        </main>
      </div>
    </div>
  );
}