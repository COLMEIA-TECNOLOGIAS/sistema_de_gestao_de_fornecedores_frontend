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
    const validPaths = ["dashboard", "fornecedores", "cotacoes", "usuarios", "relatorios", "aquisicoes", "meu-perfil", "categorias", "produtos"];
    if (path && validPaths.includes(path)) {
      setActiveItem(path);
    }
  }, [location.pathname]);

  const handleItemClick = (id) => {
    navigate(`/${id}`);
  };

  const { user, userRoleName, hasPermission: checkPermission } = useAuth();

  const userName = user?.name || user?.nome || "Utilizador";
  const userAvatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(userName)}&backgroundColor=44B16F&textColor=ffffff`;

  // Permission check redirect
  useEffect(() => {
    const permissionMap = {
      dashboard:    PERMISSIONS.DASHBOARD,
      fornecedores: PERMISSIONS.FORNECEDORES,
      cotacoes:     PERMISSIONS.COTACOES,
      usuarios:     PERMISSIONS.USUARIOS,
      relatorios:   PERMISSIONS.RELATORIOS,
      aquisicoes:   PERMISSIONS.AQUISICOES,
      categorias:   PERMISSIONS.CATEGORIAS,
      produtos:     PERMISSIONS.PRODUTOS,
    };
    const requiredPermission = permissionMap[activeItem];
    if (requiredPermission && !checkPermission(requiredPermission)) {
      setActiveItem("dashboard");
    }
  }, [activeItem, checkPermission]);

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
          userAvatar={userAvatar}
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