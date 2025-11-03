import { useState } from "react";
import Navbar from "../layout/Navbar";
import Sidebar from "../layout/sidebar";
import ListUsuarios from '../layout/ListUsuarios';


function DashboardLayout() {
  const [activeItem, setActiveItem] = useState("dashboard");

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar 
        userName="Adão Magalhães" 
        userRole="Super Admin" 
        userAvatar="/public/tea.png"
      />
      <div className="flex">
        <Sidebar activeItem={activeItem} onItemClick={setActiveItem} />
        <ListUsuarios></ListUsuarios>
      </div>
    </div>
  );
}

export default DashboardLayout;