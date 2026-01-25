import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "./Presentation/layout/Navbar";
import Sidebar from "./Presentation/layout/sidebar";
import MainContent from "./Presentation/layout/MainContent";
import { useAuth } from "./context/AuthContext";
import { hasPermission, PERMISSIONS } from "./utils/permissions";

export default function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeItem, setActiveItem] = useState("dashboard");

  // Atualiza activeItem baseado na URL
  useEffect(() => {
    const path = location.pathname.split("/")[1];
    if (path && ["dashboard", "fornecedores", "usuarios", "relatorios", "aquisicoes", "meu-perfil", "categorias", "produtos"].includes(path)) {
      setActiveItem(path);
    }
  }, [location.pathname]);

  const handleItemClick = (id) => {
    navigate(`/${id}`);
  };

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
      aquisicoes: PERMISSIONS.AQUISICOES,
      categorias: PERMISSIONS.CATEGORIAS,
      produtos: PERMISSIONS.PRODUTOS,
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
        onItemClick={handleItemClick}
      />
      <Sidebar activeItem={activeItem} onItemClick={handleItemClick} />
      <MainContent activeItem={activeItem} />
    </div>
  );
}