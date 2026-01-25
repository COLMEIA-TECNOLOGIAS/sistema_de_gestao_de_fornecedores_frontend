# Integração de Cotações - Sistema de Gestão de Fornecedores

## 📋 Resumo das Alterações

### 1. **API Service** (`src/services/api.js`)
- ✅ Adicionado novo módulo `quotationRequestsAPI` com os seguintes endpoints:
  - `getAll()` - Listar todas as cotações
  - `getById(id)` - Obter detalhes de uma cotação específica
  - `create(quotationData)` - Criar novo pedido de cotação
  - `update(id, quotationData)` - Atualizar cotação existente
  - `delete(id)` - Remover cotação

### 2. **Modal de Pedido de Cotação** (`src/Presentation/Components/ModalPedirCotacao.jsx`)

#### Novos Campos Adicionados:
- **Assunto do pedido** (obrigatório)
- **Descrição do pedido** (opcional)
- **Prazo (deadline)** - Seletor de data e hora
- **Fornecedores** (obrigatório) - Select múltiplo com lista da API
- **Nome do produto**
- **Especificações do produto**
- **Quantidade** (campo numérico)
- **Unidade** (select com opções: un, kg, g, l, ml, m, cm, m², pc, cx)

#### Funcionalidades do Select de Fornecedores:
- ✅ **Carregamento automático** da lista de fornecedores da API
- ✅ **Seleção múltipla** - permite escolher vários fornecedores
- ✅ **Tags visuais** - exibe chips com os fornecedores selecionados
- ✅ **Remoção rápida** - clique no X para remover um fornecedor
- ✅ **Loading state** - mostra feedback enquanto carrega
- ✅ **Auto-seleção** - se um fornecedor foi passado como prop, é automaticamente selecionado
- ✅ **Validação obrigatória** - impede envio sem selecionar fornecedor

#### Funcionalidades Gerais Implementadas:
- ✅ Integração com API de quotation-requests
- ✅ Integração com API de fornecedores
- ✅ Validação de campos obrigatórios
- ✅ Feedback visual de erro/sucesso
- ✅ Loading state durante o envio
- ✅ Formatação correta da data para MySQL (YYYY-MM-DD HH:MM:SS)
- ✅ Auto-reload da página após criar cotação com sucesso
- ✅ Deadline padrão de 30 dias se não especificado

#### Formato dos Dados Enviados:
```json
{
  "title": "Aquisição de Mobiliário",
  "description": "Mobiliário para novo escritório",
  "deadline": "2026-02-01 17:00:00",
  "items": [
    {
      "name": "Cadeira Giratória",
      "quantity": 10,
      "unit": "un",
      "specifications": "Cor preta, ergonômica"
    }
  ],
  "suppliers": [1, 2]
}
```

### 3. **Página de Fornecedores** (`src/Presentation/layout/FornecedoresPage.jsx`)

#### Alterações:
- ✅ Removidos dados mockados de cotações
- ✅ Adicionado state para cotações da API
- ✅ Adicionado loading state para cotações
- ✅ Adicionado error handling para cotações
- ✅ useEffect para buscar cotações quando a aba "Cotações" está ativa

#### Tabela de Cotações Atualizada:
Colunas exibidas:
- ID
- Título
- Descrição (truncada)
- Deadline (formatado)
- Data de Criação (formatado)
- Número de Fornecedores
- Ações (Ver detalhes, Remover)

#### Recursos:
- ✅ Loading skeleton durante carregamento
- ✅ Mensagens de erro se falhar
- ✅ Formatação de datas para pt-AO
- ✅ Exibição do número de fornecedores associados

## 🔄 Fluxo de Trabalho

### Criar Nova Cotação:
1. Usuário clica em "Solicitar cotação" ou "Pedir Cotação" em um fornecedor
2. Modal abre na primeira etapa (introdução)
3. Sistema automaticamente carrega lista de fornecedores da API
4. Usuário clica em "Continuar"
5. Formulário completo é exibido:
   - Preenche assunto (obrigatório)
   - Preenche descrição (opcional)
   - Seleciona deadline (opcional - padrão 30 dias)
   - **Seleciona fornecedor(es)** (obrigatório) - pode selecionar múltiplos
   - Adiciona produtos com nome, especificações, quantidade e unidade
6. Clica em "Enviar pedido de cotação"
7. Sistema valida:
   - ✅ Assunto preenchido
   - ✅ Pelo menos 1 produto adicionado
   - ✅ Pelo menos 1 fornecedor selecionado
8. Dados são enviados para API
9. Feedback de sucesso/erro é exibido
10. Se sucesso, página recarrega após 2 segundos

### Listar Cotações:
1. Usuário acessa aba "Cotações" na página de Fornecedores
2. Sub-abas disponíveis:
   - Pedidos enviados
   - Respostas
   - Pedidos Cancelados
3. Dados são carregados automaticamente da API
4. Tabela exibe todas as cotações com formatação adequada

## 🎨 Interface do Select de Fornecedores

### Como Usar:
1. **Seleção Única**: Clique em um fornecedor
2. **Seleção Múltipla**: 
   - Windows: Segure Ctrl + Clique
   - Mac: Segure Cmd + Clique
3. **Ver Selecionados**: Os fornecedores selecionados aparecem como chips verdes abaixo do select
4. **Remover**: Clique no X no chip do fornecedor

### Estados Visuais:
- **Loading**: Mostra "Carregando fornecedores..."
- **Vazio**: Select com altura mínima de 120px
- **Com Seleção**: Chips verdes com nome do fornecedor e botão X
- **Campo Obrigatório**: Indicado com asterisco (*) no label

## 🧪 Como Testar

1. **Iniciar o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

2. **Criar uma nova cotação:**
   - Acesse a página de Fornecedores
   - Clique em "Solicitar cotação"
   - Preencha o formulário
   - **Selecione pelo menos um fornecedor**
   - Adicione pelo menos um produto
   - Clique em "Enviar pedido de cotação"

3. **Testar seleção múltipla de fornecedores:**
   - No modal, segure Ctrl (Windows) ou Cmd (Mac)
   - Clique em vários fornecedores
   - Veja os chips aparecendo abaixo
   - Remova um clicando no X

4. **Ver cotações existentes:**
   - Acesse a aba "Cotações"
   - Veja a lista de cotações retornadas da API

5. **Verificar integração:**
   - Abra o console do navegador
   - Verifique os logs:
     - "Erro ao buscar fornecedores:" (se houver erro)
     - "Enviando pedido de cotação:" (dados enviados)
     - "Resposta da API:" (resposta recebida)
     - "Cotações recebidas da API:" (ao listar)

## 📝 Notas Importantes

- O endpoint da API de cotações: `https://mosap3-api.yetuware.com/api/quotation-requests`
- O endpoint da API de fornecedores: `https://mosap3-api.yetuware.com/api/suppliers`
- Token de autenticação é automaticamente adicionado aos headers
- Todas as datas são formatadas para o fuso horário pt-AO
- O modal pode ser usado com ou sem um fornecedor específico selecionado
- Quando um fornecedor está selecionado ao abrir o modal, ele é automaticamente adicionado à seleção 
- **É obrigatório selecionar pelo menos 1 fornecedor** para criar a cotação
- Pode-se selecionar múltiplos fornecedores para enviar a mesma cotação
 
## 🐛 Debug

Se encontrar problemas:
1. Verifique o console do navegador para erros
2. Verifique a aba Network para ver as requisições HTTP
3. Confirme que o token está sendo enviado nos headers
4. Verifique se o formato dos dados está correto
5. Confirme que a lista de fornecedores está sendo carregada
6. Verifique se os IDs dos fornecedores são números válidos

## ✨ Próximos Passos Sugeridos

- [ ] Implementar filtros por status nas sub-abas de cotações
- [ ] Adicionar modal de detalhes da cotação (incluindo fornecedores associados)
- [ ] Implementar edição de cotações
- [ ] Adicionar paginação na lista de cotações
- [ ] Implementar busca/filtro de cotações
- [ ] Adicionar notificações toast em vez de reload
- [ ] Melhorar UX do select múltiplo (adicionar busca/filtro no select)
- [ ] Adicionar confirmação antes de remover fornecedor selecionado
- [ ] Exibir mais detalhes do fornecedor ao passar o mouse sobre o chip

## 🎯 Validações Implementadas

### Campos Obrigatórios:
1. **Assunto do pedido** - Não pode estar vazio
2. **Fornecedores** - Pelo menos 1 deve ser selecionado
3. **Produtos** - Pelo menos 1 deve ser adicionado

### Feedback ao Usuário:
- Botão de envio desabilitado se algum campo obrigatório estiver vazio
- Mensagem de erro clara se a requisição falhar
- Mensagem de sucesso com auto-redirect
- Loading spinner durante envio
- Indicação visual de campos obrigatórios (asterisco *)
