import Sidebar from "../layout/sidebar";
import Navbar from "../layout/Navbar";

export default function Home() {
  return (
    <div className="flex">
      <Sidebar />
      
      {/* Conteúdo principal */}
      <main className="flex-1 ml-64">
        <Navbar />
        <div className="p-8 mt-20"> {/* Ajuste o mt conforme a altura do navbar */}
          {/* Conteúdo da página aqui */}
        </div>
      </main>
    </div>
  );
}