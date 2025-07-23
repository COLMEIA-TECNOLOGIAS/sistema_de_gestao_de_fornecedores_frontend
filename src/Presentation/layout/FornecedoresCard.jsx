import React from 'react';
import { Search, Plus, Filter } from 'lucide-react';

// Componente Button reutilizável
function Button({ children, type = "button", onClick, variant = "primary", className = "" }) {
  const baseClasses = "py-2 px-4 rounded-lg transition-colors font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2";
  
  const variants = {
    primary: "bg-green-500 text-white hover:bg-green-600 flex items-center gap-2",
    secondary: "bg-green-500 text-white hover:bg-green-600 flex items-center gap-2"
  };

  return (
    <button
      type={type}
      onClick={onClick}
      className={`${baseClasses} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

export default function FornecedoresCard() {
  const handleAddFornecedor = () => {
    console.log("Adicionar fornecedor");
  };

  const handleSelectCategory = () => {
    console.log("Selecionar categoria");
  };

  const handleSearch = (e) => {
    console.log("Pesquisar:", e.target.value);
  };

  return (
    <div className="bg-white rounded-lg overflow-hidden mx-4 sm:mx-6 lg:mx-8">
      {/* Header Section */}
      <div className="relative h-32 sm:h-36 lg:h-40 flex items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left side - Title and description */}
        <div className="z-10 flex-1 pr-4">
          <h1 className="text-2xl sm:text-3xl lg:text-6xl font-bold text-gray-900 mb-1">Fornecedores</h1>
          <p className="text-sm sm:text-base text-gray-600">Gerencie os fornecedores cadastrados</p>
        </div>
        
        {/* Right side - Background image container */}
       <img src="/public/fornecedor.jpg" className=' h-32 w-3xl bg-cover rounded-2xl' alt="" />
      </div>

      {/* Controls Section */}
      <div className="px-4 sm:px-6 lg:px-8 pb-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-10" />
            <input
              type="text"
              placeholder="Search for anything..."
              onChange={handleSearch}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white text-gray-700 text-sm"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Button 
              variant="primary" 
              onClick={handleAddFornecedor}
              className="px-4 text-2xl justify-center w-full sm:w-auto whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Add fornecedor
            </Button>
            
            <Button 
              variant="secondary" 
              onClick={handleSelectCategory}
              className="px-4 text-2xl justify-center w-full sm:w-auto whitespace-nowrap"
            >
              <Filter className="w-4 h-4" />
              Selecionar categoria...
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}