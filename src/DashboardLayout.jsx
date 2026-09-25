import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Shield } from "lucide-react";
import Navbar from "./Presentation/layout/Navbar";
import Sidebar from "./Presentation/layout/sidebar";
import MainContent from "./Presentation/layout/MainContent";
import { useAuth } from "./context/AuthContext";
import { PERMISSIONS } from "./utils/permissions";

// Páginas do painel e a permissão exigida por cada uma.
// A ordem define o fallback quando o utilizador não pode ver a página pedida.
const PAGES = [
  { id: "dashboard",        permission: PERMISSIONS.DASHBOARD },
  { id: "fornecedores",     permission: PERMISSIONS.FORNECEDORES },
  { id: "aquisicoes",       permission: PERMISSIONS.AQUISICOES },
  { id: "produtos",         permission: PERMISSIONS.PRODUTOS },
  { id: "relatorios",       permission: PERMISSIONS.RELATORIOS },
  { id: "usuarios",         permission: PERMISSIONS.USUARIOS, adminOnly: true },
  { id: "criar-utilizador", permission: PERMISSIONS.USUARIOS, adminOnly: true },
  { id: "permissoes",       permission: PERMISSIONS.USUARIOS, adminOnly: true },
  { id: "logs-eventos",     permission: PERMISSIONS.AUDITORIA, adminOnly: true },
  { id: "config",           permission: PERMISSIONS.CONFIGURACOES, adminOnly: true },
  { id: "meu-perfil" }, // sempre acessível
];

export default function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, userRoleName, isAdmin, canAccessMenu, permissionsLoaded } = useAuth();

  // A página activa é derivada do URL (fonte única de verdade)
  const path = location.pathname.split("/")[1];
  const activeItem = PAGES.some((p) => p.id === path) ? path : "dashboard";

  const canAccessPage = (page) => {
    if (!page.permission) return true;
    if (page.adminOnly && !isAdmin) return false;
    return canAccessMenu(page.permission);
  };

  const currentPage = PAGES.find((p) => p.id === activeItem);
  const permissionsReady = isAdmin || permissionsLoaded;
  const canSeeCurrent = canAccessPage(currentPage);
  const fallbackPage = PAGES.find((p) => p.permission && canAccessPage(p));

  // Redireccionar (alterando o URL) quando o utilizador não tem acesso à página
  useEffect(() => {
    if (!permissionsReady || canSeeCurrent) return;
    if (fallbackPage && fallbackPage.id !== activeItem) {
      navigate(`/${fallbackPage.id}`, { replace: true });
    }
  }, [permissionsReady, canSeeCurrent, fallbackPage, activeItem, navigate]);

  const handleItemClick = (id) => {
    navigate(`/${id}`);
  };

  const userName = user?.name || user?.nome || "Utilizador";

  const renderContent = () => {
    if (canSeeCurrent) return <MainContent activeItem={activeItem} />;
    if (!permissionsReady || fallbackPage) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2" style={{ borderColor: 'var(--color-primary)' }} />
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <Shield size={40} className="mb-3 opacity-40" style={{ color: 'var(--color-text-secondary)' }} />
        <p className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>Sem acessos</p>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
          Contacte o administrador para lhe atribuir permissões.
        </p>
      </div>
    );
  };

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
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
