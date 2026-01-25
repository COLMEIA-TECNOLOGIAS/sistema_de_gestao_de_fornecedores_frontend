import DashboardPage from "./DashboardPage";
import FornecedoresPage from "./FornecedoresPage";
import UsuariosPage from "./UsuariosPage";
import RelatoriosPage from "./RelatoriosPage";
import AquisicoesPage from "./AquisicoesPage";
import MeuPerfilPage from "./MeuPerfilPage";
import CategoriasPage from "./CategoriasPage";
import ProdutosPage from "./ProdutosPage"; // Import

export default function MainContent({ activeItem }) {
  const renderPage = () => {
    switch (activeItem) {
      case "dashboard":
        return <DashboardPage />;
      case "fornecedores":
        return <FornecedoresPage />;
      case "usuarios":
        return <UsuariosPage />;
      case "relatorios":
        return <RelatoriosPage />;
      case "aquisicoes":
        return <AquisicoesPage />;
      case "meu-perfil":
        return <MeuPerfilPage />;
      case "categorias":
        return <CategoriasPage />;
      case "produtos":
        return <ProdutosPage />;
      case "configuracoes":
        return <div className="text-center text-gray-600 mt-20">Página de Configurações em desenvolvimento...</div>;
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