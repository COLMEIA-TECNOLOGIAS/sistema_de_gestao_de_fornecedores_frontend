import { lazy, Suspense } from "react";
import ErrorBoundary from "../Components/ErrorBoundary";

// Cada página é carregada sob demanda (code-splitting por página)
const PAGES = {
  "dashboard":        lazy(() => import("./DashboardPage")),
  "fornecedores":     lazy(() => import("./FornecedoresPage")),
  "usuarios":         lazy(() => import("./UsuariosPage")),
  "criar-utilizador": lazy(() => import("./CriarUtilizadorPage")),
  "permissoes":       lazy(() => import("./PermissoesPage")),
  "relatorios":       lazy(() => import("./RelatoriosPage")),
  "aquisicoes":       lazy(() => import("./AquisicoesPage")),
  "meu-perfil":       lazy(() => import("./MeuPerfilPage")),
  "produtos":         lazy(() => import("./ProdutosPage")),
  "logs-eventos":     lazy(() => import("./LogsEventosPage")),
  "config":           lazy(() => import("./ConfiguracoesPage")),
};

function PageFallback() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2" style={{ borderColor: 'var(--color-primary)' }} />
    </div>
  );
}

export default function MainContent({ activeItem }) {
  const Page = PAGES[activeItem] || PAGES.dashboard;

  // key: ao mudar de página, o ErrorBoundary volta ao estado inicial
  return (
    <ErrorBoundary key={activeItem}>
      <Suspense fallback={<PageFallback />}>
        <Page />
      </Suspense>
    </ErrorBoundary>
  );
}
