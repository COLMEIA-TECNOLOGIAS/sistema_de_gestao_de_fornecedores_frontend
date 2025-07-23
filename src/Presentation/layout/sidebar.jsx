import { 
  LayoutDashboard, 
  Truck,
  ListChecks, 
  FileText,
  BellRing, 
  Settings, 
  HelpCircle,
  Home
} from 'lucide-react';
import { NavLink } from 'react-router-dom';

export default function Sidebar() {
  return (
    <div className="w-72 h-screen bg-white text-gray-800 fixed left-0 top-0 p-6 border-r border-gray-200">
      {/* Logo com linha separadora */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <img src="/logo.svg" className='w-28 h-28 ' alt="" />
          </div>
        </div>
        <div className="border-t border-gray-200 my-4"></div>
      </div>

      {/* Menu Items com texto maior */}
      <nav className="space-y-2">
        <NavItem icon={<LayoutDashboard size={22} />} text="Dashboard" to="/" />
        <NavItem icon={<Truck size={22} />} text="Fornecedores" to="/fornecedores" />
        <NavItem icon={<ListChecks size={22} />} text="Categorias e Requisitos" to="/categorias" />
        <NavItem icon={<FileText size={22} />} text="Relatórios" to="/relatorios" />
        <NavItem icon={<BellRing size={22} />} text="Notificações e Alertas" to="/notificacoes" />
        <NavItem icon={<Settings size={22} />} text="Configurações" to="/configuracoes" />
      </nav>

      {/* Seção de Ajuda */}
      <div className="absolute bottom-6 left-6 right-6 bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center mb-2">
          <HelpCircle size={20} className="text-gray-600 mr-2" />
          <span className="font-medium text-gray-700">Ajuda</span>
        </div>
        <p className="text-sm text-gray-600 mb-3 leading-snug">
          Se tem alguma dificuldade ou precisa de ajuda, estamos aqui para apoiar.
        </p>
        <button className="w-full bg-white border border-gray-300 rounded-md py-2 px-3 text-sm text-gray-700 hover:bg-gray-100 transition-colors">
          Write a message
        </button>
      </div>
    </div>
  );
}

// Componente auxiliar corrigido
function NavItem({ icon, text, to }) {
  return (
    <NavLink
      to={to}
      end  // Adicionado para correspondência exata
      className={({ isActive }) =>
        isActive 
          ? 'flex items-center space-x-4 p-3 rounded-lg bg-blue-50 text-blue-600 font-medium text-base'
          : 'flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-100 text-gray-700 text-base'
      }
    >
      {({ isActive }) => (
        <>
          <span className={isActive ? 'text-blue-500' : 'text-gray-500'}>
            {icon}
          </span>
          <span>{text}</span>
        </>
      )}
    </NavLink>
  );
}