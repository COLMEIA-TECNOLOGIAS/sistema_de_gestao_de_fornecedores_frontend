# Tabela de Cotações Atualizada - Items Adicionados

## ✅ Alteração Implementada

### **Nova Coluna: Items** na Tabela de Cotações

Adicionada uma coluna que exibe os produtos/items de cada pedido de cotação.

## 📊 Estrutura da Tabela Atualizada

A tabela de cotações agora possui as seguintes colunas:

1. ☑️ **Checkbox** - Seleção múltipla
2. **ID** - Identificador da cotação (#1, #2, etc)
3. **Título** - Título do pedido
4. **Descrição** - Descrição completa (truncada)
5. **✨ Items** - Lista de produtos (NOVO!)
6. **Deadline** - Data e hora limite
7. **Data de Criação** - Quando foi criada
8. **Fornecedores** - Número de fornecedores
9. **Acções** - Revisar e Remover

## 🎨 Visualização da Coluna Items

### Formato de Exibição:

```
Nome do Produto - 10 un
Outro Produto - 5 kg
+3 mais
```

### Regras:
- **Mostra até 2 items** por linha
- Se houver mais de 2 items, exibe **"+X mais"** 
- Cada item mostra: **Nome - Quantidade Unidade**
- Texto pequeno (text-xs) para economizar espaço
- Se não houver items: **"Sem items"**

### Exemplo Visual:

| Items |
|-------|
| **Cadeira Giratória** - 10 un<br/>**Computador Portátil** - 2 un<br/>*+1 mais* |

## 💾 Estrutura de Dados Esperada

```javascript
{
  "id": 1,
  "title": "Aquisição de Mobiliário",
  "description": "Mobiliário para novo escritório",
  "deadline": "2026-02-01 17:00:00",
  "created_at": "2026-01-22 00:00:00",
  "items": [
    {
      "name": "Cadeira Giratória",
      "quantity": 10,
      "unit": "un",
      "specifications": "Cor preta, ergonômica"
    },
    {
      "name": "Mesa de Escritório",
      "quantity": 5,
      "unit": "un",
      "specifications": "120x60cm, madeira"
    },
    {
      "name": "Armário",
      "quantity": 3,
      "unit": "un",
      "specifications": "180cm altura"
    }
  ],
  "suppliers": [1, 2]
}
```

## 🔍 Detalhes da Implementação

### Código da Coluna:

```jsx
<td className="px-6 py-8">
  {cotacao.items && cotacao.items.length > 0 ? (
    <div className="space-y-1">
      {cotacao.items.slice(0, 2).map((item, idx) => (
        <div key={idx} className="text-xs text-gray-600">
          <span className="font-medium">{item.name}</span>
          <span className="text-gray-500"> - {item.quantity} {item.unit}</span>
        </div>
      ))}
      {cotacao.items.length > 2 && (
        <div className="text-xs text-gray-500 italic">
          +{cotacao.items.length - 2} mais
        </div>
      )}
    </div>
  ) : (
    <span className="text-xs text-gray-500">Sem items</span>
  )}
</td>
```

### Características:

1. **Slice(0, 2)**: Mostra apenas os 2 primeiros items
2. **Font-medium**: Nome do produto em negrito
3. **Text-gray-500**: Quantidade e unidade em cinza mais claro
4. **Space-y-1**: Espaçamento vertical entre items
5. **Italic**: Indicador "+X mais" em itálico

## 📋 Headers da Tabela

```jsx
<thead>
  <tr>
    <th>☑️</th>
    <th>ID</th>
    <th>Título</th>
    <th>Descrição</th>
    <th>Items</th>          {/* NOVA COLUNA */}
    <th>Deadline</th>
    <th>Data de Criação</th>
    <th>Fornecedores</th>
    <th>Acções</th>
  </tr>
</thead>
```

## ✨ Benefícios

1. **Visibilidade**: Ver rapidamente quais produtos estão em cada cotação
2. **Compacto**: Mostra info essencial sem ocupar muito espaço
3. **Escalável**: Funciona com 1 ou 100 items
4. **Performance**: Renderiza apenas os 2 primeiros
5. **UX**: "+X mais" indica que há mais items para ver no modal

## 🔄 Integração com Modal

Quando o usuário clica em **"Revisar"**:
- O modal abre e mostra **TODOS os items completos**
- Cada item com nome, quantidade, unidade e especificações
- Tabela completa formatada profissionalmente

## 🧪 Como Testar

1. Acesse http://localhost:5174/
2. Vá para Fornecedores → Cotações
3. Veja a nova coluna "Items"
4. Cotações com items mostrarão:
   - Primeiros 2 items
   - "+X mais" se houver mais
5. Clique em "Revisar" para ver todos os items

## 📊 Cenários de Teste

### Cenário 1: Sem Items
```
Exibe: "Sem items"
```

### Cenário 2: 1 Item
```
Cadeira Giratória - 10 un
```

### Cenário 3: 2 Items
```
Cadeira Giratória - 10 un
Mesa de Escritório - 5 un
```

### Cenário 4: 5 Items
```
Cadeira Giratória - 10 un
Mesa de Escritório - 5 un
+3 mais
```

## 🎯 Próximos Passos Sugeridos

- [ ] Adicionar tooltip ao passar mouse sobre "+X mais"
- [ ] Mostrar especificações resumidas em tooltip
- [ ] Permitir expandir/colapsar items diretamente na tabela
- [ ] Adicionar filtro por tipo de item
- [ ] Exportar lista de items para Excel
- [ ] Adicionar busca por nome de item

## 📝 Observações Técnicas

- ColSpan atualizado para **9** (era 8)
- Renderização condicional para items vazios
- Usa `slice(0, 2)` para limitar visualização
- Calcula quantidade restante: `items.length - 2`
- Text size: `text-xs` para economizar espaço
- Compatível com a estrutura já existente
