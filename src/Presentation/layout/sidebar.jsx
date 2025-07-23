import { LayoutDashboard, Plug, ListChecks, BellRing, Settings, HelpCircle } from 'lucide-react';
import { NavLink } from 'react-router-dom';

export default function Sidebar() {
  return (
    <div className="w-64 h-screen bg-gray-900 text-white fixed left-0 top-0 p-4">
      {/* Logo */}
      <div className="flex items-center justify-center mb-8 p-2">
        <h1 className="text-2xl font-bold">MOSAP3</h1>
      </div>

      {/* Menu Items */}
      <nav className="space-y-2">
        <NavItem icon={<LayoutDashboard size={20} />} text="Dashboard" to="/dashboard" />
        <NavItem icon={<Plug size={20} />} text="Connectedores" to="/connectedores" />
        <NavItem icon={<ListChecks size={20} />} text="Catalogos e Requisitos" to="/catalogos" />
        <NavItem icon={<BellRing size={20} />} text="Notificacoes e Alertas" to="/notificacoes" />
        <NavItem icon={<Settings size={20} />} text="Configuracoes" to="/configuracoes" />
        <NavItem icon={<HelpCircle size={20} />} text="Ajada" to="/ajuda" />
      </nav>
    </div>
  );
}

// Componente auxiliar para itens do menu
function NavItem({ icon, text, to }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => 
        `flex items-center space-x-3 p-3 rounded-lg transition-colors ${isActive ? 'bg-blue-600' : 'hover:bg-gray-700'}`
      }
    >
      <span className="text-gray-300">{icon}</span>
      <span>{text}</span>
    </NavLink>
  );
}