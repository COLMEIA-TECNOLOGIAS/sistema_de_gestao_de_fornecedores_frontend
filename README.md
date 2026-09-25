# MOSAP3 — Plataforma de Gestão de Fornecedores (Frontend)

Aplicação React (Vite + Tailwind CSS 4) para gestão de fornecedores, pedidos de cotação, aquisições, utilizadores e permissões.

## Requisitos

- Node.js 20+
- npm

## Configuração

```bash
npm install
cp .env.example .env   # opcional — por omissão usa a API de produção
```

| Variável       | Descrição                    |
| -------------- | ---------------------------- |
| `VITE_API_URL` | URL base da API (sem `/` final) |

## Scripts

| Comando           | Descrição                               |
| ----------------- | --------------------------------------- |
| `npm run dev`     | Servidor de desenvolvimento com HMR     |
| `npm run build`   | Build de produção em `dist/` (com PWA)  |
| `npm run preview` | Pré-visualizar o build de produção      |
| `npm run lint`    | ESLint                                  |

## Estrutura

```
src/
├── App.jsx                  # Rotas (páginas públicas, protegidas e só-admin)
├── DashboardLayout.jsx      # Layout do painel: sidebar + navbar + página activa (derivada do URL)
├── context/
│   ├── AuthContext.jsx      # Sessão, utilizador e verificação de permissões
│   └── ThemeContext.jsx     # Tema claro/escuro
├── services/api.js          # Cliente axios e endpoints da API
├── utils/permissions.js     # Normalização das permissões devolvidas pela API
└── Presentation/
    ├── Pages/               # Login, recuperação de senha, landing page
    ├── layout/              # Páginas do painel (carregadas sob demanda)
    └── Components/          # Modais e componentes partilhados
```

## Permissões

As permissões de cada utilizador são obtidas de `GET /user/permissions` após o login e guardadas em cache no `localStorage`.
O administrador tem acesso total; os restantes utilizadores só vêem os menus/páginas autorizados pela API
(`canAccessMenu` no `AuthContext`). As páginas de gestão de utilizadores, logs e configurações são exclusivas do administrador.

## Dados, filtros e actualização

- **Dados** — [TanStack Query](https://tanstack.com/query) (`src/lib/queryClient.js`). Os hooks em `src/hooks/queries.js`
  (`useSuppliers`, `useUsers`, `useAcquisitions`, …) devolvem listas já normalizadas. A cache é partilhada entre páginas,
  é actualizada ao voltar ao separador/recuperar a ligação e tenta de novo em falhas de rede.
- **Após criar/editar/eliminar** — invalidar as chaves afectadas (`src/lib/queryKeys.js`) com `useInvalidate()`;
  todas as páginas que mostram esses dados actualizam-se sozinhas.
- **Filtros** — `useUrlFilters` guarda pesquisa, filtros, ordenação e página no URL (sobrevivem ao F5 e podem ser partilhados).
- **UI partilhada** — `src/Presentation/Components/ui/` (`SearchInput`, `RefreshButton`, `FilterChips`, `Pagination`,
  `SortableHeader`, `EmptyState`/`ErrorState`/`StaleDataBanner`, `OfflineBanner`).
- **Feedback** — `useToast()` para notificações e `useConfirm()` para confirmações (nunca `alert`/`confirm` nativos).
- **Erros da API** — `getErrorMessage(err)` em `src/utils/apiHelpers.js` traduz erros de rede, validação (422) e HTTP para pt-PT.
