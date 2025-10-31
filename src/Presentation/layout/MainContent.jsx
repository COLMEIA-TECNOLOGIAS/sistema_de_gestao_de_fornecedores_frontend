import DashboardPage from "../pages/DashboardPage";
import FornecedoresPage from "../pages/FornecedoresPage";
import UsuariosPage from "../pages/UsuariosPage";
import RelatoriosPage from "../pages/RelatoriosPage";
import ConfiguracoesPage from "../pages/ConfiguracoesPage";

export default function MainContent({ activeItem }) {
  const renderPage = () => {
    switch (activeItem) {
      case "dashboard":
        return <DashboardPage />;
      case "fornecedores":
        return <FornecedoresPage />;
      case "usuarios":
        return <UsuariosPage />
      
      default:
        return <DashboardPage />;
    }
  };

  return (
    <main className="flex-1 bg-gray-50 p-8 mt-[65px] ml-64">
      {renderPage()}
    </main>
  );
}