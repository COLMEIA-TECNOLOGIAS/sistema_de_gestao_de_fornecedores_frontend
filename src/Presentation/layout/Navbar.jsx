import { useState } from 'react';
import { Search, Bell, CalendarDays, HelpCircle, ChevronDown, User } from 'lucide-react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed top-0 left-64 right-0 h-20 bg-white border-b border-gray-200 flex items-center justify-between px-8 z-40">
      {/* Barra de Pesquisa */}
      <div className="relative flex-1 max-w-2xl">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Search for anything..."
        />
      </div>

      {/* Ícones e Perfil */}
      <div className="flex items-center space-x-6">
        <button className="p-2 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100">
          <CalendarDays className="h-5 w-5" />
        </button>
        
        <button className="p-2 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100">
          <HelpCircle className="h-5 w-5" />
        </button>
        
        <button className="p-2 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500"></span>
        </button>

        {/* Dropdown do Usuário */}
        <div className="relative">
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center space-x-2 focus:outline-none"
          >
            <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white">
              <User className="h-5 w-5" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-gray-900">António Miranda</p>
              <p className="text-xs text-gray-500">Super Admin</p>
            </div>
            <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
          </button>

          {isOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
              <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Editar Perfil</a>
              <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Terminar Sessão</a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}