import { LayoutDashboard, Package, UserCircle, BarChart3, ShoppingCart, Settings } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { PERMISSIONS } from "../../utils/permissions";

function Sidebar({ activeItem, onItemClick }) {
  const { hasPermission, isAdmin } = useAuth();

  // Definição de todos os itens de menu com suas permissões
  const allMenuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      permission: PERMISSIONS.DASHBOARD
    },
    {
      id: "fornecedores",
      label: "Fornecedores",
      sublabel: "Cotações",
      icon: Package,
      permission: PERMISSIONS.FORNECEDORES
    },
    {
      id: "usuarios",
      label: "Usuários",
      icon: UserCircle,
      permission: PERMISSIONS.USUARIOS,
      adminOnly: true // Apenas admin pode ver
    },
    {
      id: "relatorios",
      label: "Relatórios",
      icon: BarChart3,
      permission: PERMISSIONS.RELATORIOS
    },
  ];

  // Filtra os itens de menu baseado nas permissões do usuário
  const menuItems = allMenuItems.filter(item => {
    // Se o item é apenas para admin, verifica se é admin
    if (item.adminOnly && !isAdmin) {
      return false;
    }
    // Verifica se tem permissão para acessar
    return hasPermission(item.permission);
  });

  return (
    <aside className="fixed left-0 top-[65px] w-64 bg-white border-r border-gray-200 h-[calc(100vh-65px)] overflow-y-auto">
      <nav className="p-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeItem === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onItemClick(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                ? "bg-[#44B16F]/10 text-[#44B16F]"
                : "text-gray-700 hover:bg-gray-100"
                }`}
            >
              <Icon size={20} className="flex-shrink-0" />
              <div className="flex flex-col items-start">
                <span className="text-sm font-medium leading-tight">{item.label}</span>
                {item.sublabel && (
                  <span className={`text-xs leading-tight ${isActive ? "text-[#44B16F]/70" : "text-gray-500"}`}>
                    {item.sublabel}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

export default Sidebar;