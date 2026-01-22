# Modal de Revisão de Cotações - Implementado

## ✅ Alterações Realizadas

### 1. **Novo Componente: ModalRevisarCotacao.jsx**

Criado componente completo de modal para revisar cotações com a seguinte estrutura:

#### Layout do Modal:
- **Header**: Título com nome do fornecedor + Logo MOSAP3
- **Endereço do fornecedor**: Província, município, endereço e telefone
- **3 Colunas de Informação**:
  1. **Solicitado por**: Dados da empresa MOSAP3
  2. **Enviado para**: Dados do fornecedor selecionado
  3. **Detalhes**: ID da cotação e data de criação

- **Título e Descrição**: Mostra o título e descrição completa da cotação
- **Tabela de Produtos**: 3 colunas (Produtos, Descrição, Valor)
- **Total**: Cálculo automático do total em AOA
- **Botões de Ação**:
  - **Finalizar aquisição** (verde)
  - **Cancelar aquisição** (vermelho)

#### Funcionalidades:
- ✅ Exibe logo MOSAP3 (`/logo.svg`)
- ✅ Formatação de ID com padding (001, 002, etc)
- ✅ Formatação de datas para pt-AO
- ✅ Lista todos os items da cotação
- ✅ Mostra quantidade e unidade de cada produto
- ✅ Calcula total automático (se houver preços)
- ✅ Fecha ao clicar no backdrop
- ✅ Responsivo e com scroll interno

### 2. **Página de Fornecedores Atualizada**

#### Mudanças na Tabela de Cotações:
- ❌ **Removido**: Botão "Mais detalhes"
- ✅ **Adicionado**: Botão "Revisar" com ícone de documento
- ✅ **Mantido**: Botão "Remover" com confirmação

#### Novos States:
```javascript
const [isRevisarModalOpen, setIsRevisarModalOpen] = useState(false);
const [selectedCotacao, setSelectedCotacao] = useState(null);
```

#### Ações dos Botões:
1. **Revisar**:
   - Abre o ModalRevisarCotacao
   - Passa os dados completos da cotação selecionada
   - Fecha o menu dropdown

2. **Remover**:
   - Exibe confirmação antes de remover
   - Log no console para debug
   - Fecha o menu dropdown

### 3. **Import e Integração**

```javascript
import ModalRevisarCotacao from "../Components/ModalRevisarCotacao";

// No final do componente:
<ModalRevisarCotacao
  isOpen={isRevisarModalOpen}
  onClose={() => {
    setIsRevisarModalOpen(false);
    setSelectedCotacao(null);
  }}
  cotacao={selectedCotacao}
/>
```

## 📊 Estrutura de Dados da Cotação

O modal espera receber um objeto `cotacao` com a seguinte estrutura:

```javascript
{
  id: 1,
  title: "Aquisição de Mobiliário",
  description: "Mobiliário para novo escritório",
  deadline: "2026-02-01 17:00:00",
  created_at: "2026-01-22 00:00:00",
  items: [
    {
      name: "Cadeira Giratória",
      quantity: 10,
      unit: "un",
      specifications: "Cor preta, ergonômica",
      price: 120.45  // Opcional
    }
  ],
  suppliers: [
    {
      id: 1,
      commercial_name: "NCR Angola",
      legal_name: "NCR Angola Lda",
      province: "Luanda",
      municipality: "Luanda",
      address: "Rua Marquinhos 23",
      phone: "607 456 442"
    }
  ]
}
```

## 🎨 Design Visual

### Cores e Estilos:
- **Botão Finalizar**: Verde (#44B16F)
- **Botão Cancelar**: Vermelho (#EF4444)
- **Backdrop**: Preto 50% com blur
- **Modal**: Branco com sombra e bordas arredondadas
- **Altura máxima**: 90vh com scroll interno
- **Logo**: 16 (h-16) de altura

### Responsividade:
- Grid de 3 colunas para informações principais
- Scroll vertical quando o conteúdo é grande
- Padding consistente (px-8 py-6)
- Bordas e separadores sutis

## 🔄 Fluxo de Uso

1. Usuário acessa aba "Cotações"
2. Clica no menu de ações (3 pontos) de uma cotação
3. Clica em "Revisar"
4. Modal abre com todos os detalhes da cotação
5. Usuário pode:
   - **Finalizar aquisição**: Fecha o modal (você pode adicionar lógica)
   - **Cancelar aquisição**: Fecha o modal (você pode adicionar lógica)
   - **Fechar**: Clica no backdrop ou ESC

## 🧪 Como Testar

1. Acesse http://localhost:5174/
2. Vá para a página de Fornecedores
3. Clique na aba "Cotações"
4. Se houver cotações listadas:
   - Clique nos 3 pontos de uma cotação
   - Clique em "Revisar"
   - Veja o modal com todos os detalhes
5. Teste os botões:
   - "Finalizar aquisição"
   - "Cancelar aquisição"
   - Clicar fora para fechar

## 📝 Próximos Passos Sugeridos

- [ ] Implementar lógica real de finalização de aquisição
- [ ] Implementar lógica real de cancelamento
- [ ] Adicionar API call para atualizar status da cotação
- [ ] Adicionar modal de confirmação para finalizar/cancelar
- [ ] Exibir histórico de alterações da cotação
- [ ] Permitir edição de preços dos items
- [ ] Adicionar exportação para PDF
- [ ] Implementar assinatura digital

## 🐛 Observações

- O campo `price` nos items é opcional - se não houver, mostra "---"
- O cálculo do total só funciona se os items tiverem o campo `price`
- A logo usa `/logo.svg` do diretório public
- Se a logo não carregar, ela será escondida automaticamente
- Os dados de "Solicitado por" estão hardcoded (MOSAP3) - você pode torná-los dinâmicos se necessário
