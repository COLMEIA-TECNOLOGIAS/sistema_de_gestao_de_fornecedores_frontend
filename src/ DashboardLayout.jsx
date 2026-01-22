import { useState, useEffect } from "react";
import Navbar from "./Presentation/layout/Navbar";
import Sidebar from "./Presentation/layout/sidebar";
import MainContent from "./Presentation/layout/MainContent";
import { useAuth } from "./context/AuthContext";
import { hasPermission, PERMISSIONS } from "./utils/permissions";

export default function DashboardLayout() {
  const [activeItem, setActiveItem] = useState("dashboard");
  const { user, userRoleName, hasPermission: checkPermission } = useAuth();

  // Gera um avatar baseado no nome do usuário
  const userName = user?.name || user?.nome || "Usuário";
  const userAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userName)}`;

  // Verifica se o usuário tem permissão para acessar o item ativo
  // Se não tiver, redireciona para o dashboard
  useEffect(() => {
    const permissionMap = {
      dashboard: PERMISSIONS.DASHBOARD,
      fornecedores: PERMISSIONS.FORNECEDORES,
      usuarios: PERMISSIONS.USUARIOS,
      relatorios: PERMISSIONS.RELATORIOS,
    };

    const requiredPermission = permissionMap[activeItem];
    if (requiredPermission && !checkPermission(requiredPermission)) {
      setActiveItem("dashboard");
    }
  }, [activeItem, checkPermission]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar
        userName={userName}
        userRole={userRoleName}
        userAvatar={userAvatar}
      />
      <Sidebar activeItem={activeItem} onItemClick={setActiveItem} />
      <MainContent activeItem={activeItem} />
    </div>
  );
}