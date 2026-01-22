# Integração de Respostas de Cotações - Finalizado (Simplificado)

## ✅ Resumo das Alterações

### 1. **API de Quotation Responses** (`src/services/api.js`)
- ✅ Endpoint `getAll()` para listar todas as respostas.
- ✅ Endpoint `getById(id)` para detalhes.
- ✅ Endpoints de ação: `approve`, `reject`, `requestRevision`, `createAcquisition`.

### 2. **Página de Fornecedores** (`FornecedoresPage.jsx`)
#### Menu de Ações (Dropdown):
- Atualizado para corresponder exatamente ao design solicitado:
  - **Revisar** (Ícone Documento)
  - **Rejeitar proposta** (Ícone Lixo)
  - **Aprovar proposta** (Ícone Check Circle)
  - **Solicitar revisão** (Ícone Balão de Fala)
  - **Gerar aquisição** (Ícone Refresh)

#### Popups de Ação (Inline):
- Removidos os componentes de modal externos e complexos.
- Implementados **popups simples e leves** diretamente na página para coletar as informações necessárias:
  - **Aprovação/Rejeição**: Campo de notas/motivo.
  - **Solicitar Revisão**: Campo de motivo e mensagem.
  - **Gerar Aquisição**: Campo de data de entrega e justificativa.

### 3. **Modal de Revisão** (`ModalRevisarCotacao.jsx`)
- ✅ Revertido para ser puramente visual, sem botões de ação extras no footer, mantendo o foco nas ações da tabela conforme solicitado.

## 🔄 Fluxo de Trabalho e Payloads API

| Ação | Endpoint | Payload Exemplo |
|------|----------|-----------------|
| **Aprovar** | `/approve` | `{ "notes": "Aprovado, excelente preço" }` |
| **Rejeitar** | `/reject` | `{ "notes": "Preço muito alto" }` |
| **Revisão** | `/request-revision` | `{ "reason": "Preço", "message": "Por favor, reveja o preço unitário..." }` |
| **Aquisição**| `/create-acquisition` | `{ "expected_delivery_date": "2026-03-01", "justification": "Necessidade urgente" }` |

## 📁 Arquivos Modificados
1. `src/services/api.js` - Atualização da API.
2. `src/Presentation/layout/FornecedoresPage.jsx` - Integração completa do menu e popups rápidos.
3. `src/Presentation/Components/ModalRevisarCotacao.jsx` - Simplificação do footer.
