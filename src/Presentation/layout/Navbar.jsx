import { Search, Bell } from "lucide-react";

function Navbar({ userName, userRole, userAvatar }) {
  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between fixed top-0 left-0 right-0 z-50">
      <div className="flex items-center gap-8">
        {/* Logo Aumentada */}
        <div className="flex items-center gap-3">
          <img src="/login1.svg" className="w-12 h-12" alt="MOSAP3" />
          <span className="font-bold text-2xl">MOSAP3</span>
        </div>

        {/* Search Bar mais à direita (mas ainda no lado esquerdo) */}
        <div className="relative w-96 ml-16">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search for anything..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#44B16F]/20 focus:border-[#44B16F]"
          />
        </div>
      </div>

      {/* User Info */}
      <div className="flex items-center gap-4">
        <button className="relative p-2 hover:bg-gray-100 rounded-lg">
          <Bell size={20} className="text-gray-600" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">{userName}</p>
            <p className="text-xs text-gray-500">{userRole}</p>
          </div>
          <img
            src={userAvatar || "/api/placeholder/40/40"}
            alt={userName}
            className="w-10 h-10 rounded-full object-cover"
          />
        </div>
      </div>
    </nav>
  );
}

export default Navbar;