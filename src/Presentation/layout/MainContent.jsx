import { lazy, Suspense } from "react";
import DashboardTableSkeleton from "../Components/DashboardTableSkeleton";

const DashboardPage = lazy(() => import("./DashboardPage"));
const FornecedoresPage = lazy(() => import("./FornecedoresPage"));
const UsuariosPage = lazy(() => import("./UsuariosPage"));
const RelatoriosPage = lazy(() => import("./RelatoriosPage"));
const AquisicoesPage = lazy(() => import("./AquisicoesPage"));
const MeuPerfilPage = lazy(() => import("./MeuPerfilPage"));
const ProdutosPage = lazy(() => import("./ProdutosPage"));
const LogsEventosPage = lazy(() => import("./LogsEventosPage"));
const CriarUtilizadorPage = lazy(() => import("./CriarUtilizadorPage"));
const PermissoesPage = lazy(() => import("./PermissoesPage"));
const ConfiguracoesPage = lazy(() => import("./ConfiguracoesPage"));

function PageLoader() {
  return (
    <div className="flex items-center justify-center p-8">
      <DashboardTableSkeleton rows={5} />
    </div>
  );
}

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

  return (
    <Suspense fallback={<PageLoader />}>
      {renderPage()}
    </Suspense>
  );
}
