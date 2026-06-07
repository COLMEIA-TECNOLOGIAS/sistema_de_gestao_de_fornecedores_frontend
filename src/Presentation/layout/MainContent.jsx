import DashboardPage from "./DashboardPage";
import FornecedoresPage from "./FornecedoresPage";
import UsuariosPage from "./UsuariosPage";
import RelatoriosPage from "./RelatoriosPage";
import AquisicoesPage from "./AquisicoesPage";
import MeuPerfilPage from "./MeuPerfilPage";
import CategoriasPage from "./CategoriasPage";
import ProdutosPage from "./ProdutosPage";
import CotacoesPage from "./CotacoesPage";
import LogsEventosPage from "./LogsEventosPage";

export default function MainContent({ activeItem }) {
  const renderPage = () => {
    switch (activeItem) {
      case "dashboard":    return <DashboardPage />;
      case "fornecedores": return <FornecedoresPage />;
      case "cotacoes":     return <CotacoesPage />;
      case "usuarios":     return <UsuariosPage />;
      case "relatorios":   return <RelatoriosPage />;
      case "aquisicoes":   return <AquisicoesPage />;
      case "meu-perfil":   return <MeuPerfilPage />;
      case "categorias":   return <CategoriasPage />;
      case "produtos":     return <ProdutosPage />;
      case "logs-eventos": return <LogsEventosPage />;
      default:             return <DashboardPage />;
    }
  };

  return renderPage();
}