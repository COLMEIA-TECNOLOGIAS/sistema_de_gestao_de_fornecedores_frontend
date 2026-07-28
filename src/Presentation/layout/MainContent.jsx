import DashboardPage from "./DashboardPage";
import FornecedoresPage from "./FornecedoresPage";
import UsuariosPage from "./UsuariosPage";
import RelatoriosPage from "./RelatoriosPage";
import AquisicoesPage from "./AquisicoesPage";
import MeuPerfilPage from "./MeuPerfilPage";
import ProdutosPage from "./ProdutosPage";
import LogsEventosPage from "./LogsEventosPage";
import CriarUtilizadorPage from "./CriarUtilizadorPage";
import PermissoesPage from "./PermissoesPage";
import ConfiguracoesPage from "./ConfiguracoesPage";

export default function MainContent({ activeItem }) {
  const renderPage = () => {
    switch (activeItem) {
      case "dashboard":    return <DashboardPage />;
      case "fornecedores": return <FornecedoresPage />;
      case "usuarios":     return <UsuariosPage />;
      case "criar-utilizador": return <CriarUtilizadorPage />;
      case "permissoes":   return <PermissoesPage />;
      case "relatorios":   return <RelatoriosPage />;
      case "aquisicoes":   return <AquisicoesPage />;
      case "meu-perfil":   return <MeuPerfilPage />;
      case "produtos":     return <ProdutosPage />;
      case "logs-eventos": return <LogsEventosPage />;
      case "config":       return <ConfiguracoesPage />;
      default:             return <DashboardPage />;
    }
  };

  return renderPage();
}