import { Fragment } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Home } from "lucide-react";
import { queryKeys } from "../../lib/queryKeys";

// Caminho de cada página do painel: [grupo?, página]
const PAGES = {
    dashboard: { label: "Painel de Controlo" },
    fornecedores: {
        label: "Fornecedores",
        tabs: { fornecedores: "Fornecedores Activos", pendentes: "Pendentes & Convidados", categorias: "Categorias" },
    },
    aquisicoes: {
        label: "Aquisições",
        tabs: {
            atividades: "Actividades",
            aquisicoes: "Actividades em Curso",
            concluidas: "Actividades Concluídas",
            canceladas: "Actividades Canceladas",
            lista_aquisicoes: "Lista de Aquisições",
        },
    },
    produtos: { label: "Produtos" },
    relatorios: { label: "Relatórios e Análises" },
    usuarios: { group: "Gestão de Utilizadores", label: "Lista de Utilizadores" },
    "criar-utilizador": { group: "Gestão de Utilizadores", label: "Criar Utilizador" },
    permissoes: { group: "Gestão de Utilizadores", label: "Gestão de Permissões" },
    "logs-eventos": { label: "Gestão de Logs" },
    config: { label: "Configurações" },
    "meu-perfil": { label: "Meu Perfil" },
};

/**
 * Caminho de navegação da top bar, ex.: Painel / Aquisições / Actividades em Curso / Compra de portáteis
 */
export default function Breadcrumbs() {
    const location = useLocation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const pageId = location.pathname.split("/")[1] || "dashboard";
    const page = PAGES[pageId];
    const pedidoId = pageId === "aquisicoes" ? searchParams.get("pedido") : null;

    // Título do pedido aberto, se já estiver em cache (não faz pedidos à API)
    const { data: pedido } = useQuery({
        queryKey: queryKeys.quotationRequests.detail(pedidoId),
        enabled: false,
    });

    if (!page) return <div className="flex-1" />;

    const crumbs = [];
    if (pageId !== "dashboard") crumbs.push({ label: "Painel", to: "/dashboard", icon: Home });
    if (page.group) crumbs.push({ label: page.group, to: "/usuarios" });
    crumbs.push({ label: page.label, to: `/${pageId}` });

    const tab = searchParams.get("tab");
    if (page.tabs && tab && page.tabs[tab]) {
        crumbs.push({ label: page.tabs[tab], to: `/${pageId}?tab=${tab}` });
    }
    if (pedidoId) {
        crumbs.push({ label: pedido?.title || `Pedido #${pedidoId}` });
    }

    return (
        <nav aria-label="Caminho de navegação" className="flex-1 min-w-0">
            <ol className="flex items-center gap-1.5 text-sm min-w-0">
                {crumbs.map((crumb, index) => {
                    const isLast = index === crumbs.length - 1;
                    const Icon = crumb.icon;
                    return (
                        <Fragment key={`${crumb.label}-${index}`}>
                            {index > 0 && (
                                <ChevronRight size={14} className="flex-shrink-0" style={{ color: "var(--color-text-muted)" }} aria-hidden="true" />
                            )}
                            <li className={`min-w-0 ${isLast ? "truncate" : "flex-shrink-0 hidden md:block"}`}>
                                {isLast || !crumb.to ? (
                                    <span
                                        aria-current={isLast ? "page" : undefined}
                                        className="font-semibold truncate block"
                                        style={{ color: "var(--color-text-primary)" }}
                                        title={crumb.label}
                                    >
                                        {crumb.label}
                                    </span>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => navigate(crumb.to)}
                                        className="flex items-center gap-1.5 font-medium hover:underline underline-offset-2"
                                        style={{ color: "var(--color-text-secondary)" }}
                                    >
                                        {Icon && <Icon size={14} />}
                                        {crumb.label}
                                    </button>
                                )}
                            </li>
                        </Fragment>
                    );
                })}
            </ol>
        </nav>
    );
}
