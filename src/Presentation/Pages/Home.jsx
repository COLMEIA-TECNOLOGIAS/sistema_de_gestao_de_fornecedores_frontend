import Sidebar from "../layout/sidebar";
import Navbar from "../layout/Navbar";

export default function Home() {
  return (
    <div className="flex">
      <Sidebar />
      
      {/* Conteúdo principal */}
      <main className="flex-1 ml-64">
        <Navbar />
        <div className="p-8 mt-20"> 
        </div>
      </main>
    </div>
  );
}