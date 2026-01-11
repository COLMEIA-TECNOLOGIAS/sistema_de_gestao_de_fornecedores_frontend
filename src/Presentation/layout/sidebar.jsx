import { LayoutDashboard, Package, UserCircle, BarChart3, Settings } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

function Sidebar({ activeItem, onItemClick }) {
  const { user } = useAuth();
  const userName = user?.nome || user?.name || "Usuário";
  const userAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${userName}`;

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "fornecedores", label: "Fornecedores", sublabel: "Cotações", icon: Package },
    { id: "usuarios", label: "Usuários", icon: UserCircle },
    { id: "relatorios", label: "Relatórios", icon: BarChart3 },
    { id: "configuracoes", label: "Configurações", icon: Settings },
  ];

  return (
    <aside className="fixed left-0 top-[65px] w-64 bg-white border-r border-gray-200 h-[calc(100vh-65px)] overflow-y-auto">
      {/* User Profile Section */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={userAvatar}
              alt={userName}
              className="w-12 h-12 rounded-full object-cover"
            />
            {/* Green online indicator */}
            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{userName}</p>
          </div>
        </div>
      </div>

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