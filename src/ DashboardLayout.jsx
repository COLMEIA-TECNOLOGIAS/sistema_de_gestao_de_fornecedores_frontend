import { useState } from "react";
import Navbar from "./Presentation/layout/Navbar";
import Sidebar from "./Presentation/layout/sidebar";
import MainContent from "./Presentation/layout/MainContent";

export default function DashboardLayout() {
  const [activeItem, setActiveItem] = useState("dashboard");

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar
        userName="António Miranda"
        userRole="Super Admin"
        userAvatar="https://api.dicebear.com/7.x/avataaars/svg?seed=Antonio"
      />
      <Sidebar activeItem={activeItem} onItemClick={setActiveItem} />
      <MainContent activeItem={activeItem} />
    </div>
  );
}