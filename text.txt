# Análise de Dados Esperados pelo Frontend

Este documento detalha todos os campos de dados que o frontend espera consumir e enviar para a API. O objectivo é alinhar a estrutura da API com as necessidades do frontend, garantindo que não faltem campos (como o `telefone 2` reportado).

Abaixo estão as tabelas/entidades principais e os campos exatos que os formulários e tabelas do frontend estão a utilizar. A equipa de backend deve verificar se a API actual suporta a leitura (GET) e a escrita (POST/PUT) de todos estes campos.

## 1. Tabela: Fornecedores (`/suppliers`)

No formulário de cadastro e na modal de detalhes de fornecedores, o frontend espera os seguintes campos:

**Campos de Texto/Dados:**
- `legal_name` (Nome Legal) - *Obrigatório*
- `commercial_name` (Nome Comercial) - *Obrigatório*
- `email` (Email Profissional) - *Obrigatório*
- `phone` (Telefone 1) - *Obrigatório*
- `alt_phone` (**NOVO: Telefone 2**) - *Opcional* -> **Nota:** Este é o campo que atualmente falta na API.
- `nif` (Número de Identificação Fiscal) - *Obrigatório*
- `activity_type` (Tipo de Actividade)
- `province` (Província) - *Obrigatório*
- `municipality` (Município) - *Obrigatório*
- `address` (Endereço Completo) - *Obrigatório*
- `categories` (Array de IDs de Categorias) - *Obrigatório*
- `is_active` (Status Ativo/Inativo)
- `registration_status` (Status do Cadastro: 'invited', 'completed', 'approved', etc.)

**Campos de Ficheiros (Uploads / Multipart Form-Data):**
- `commercial_certificate` (Certificado Comercial)
- `pacto_social` (Pacto Social)
- `non_debtor_certificate` (Certificado de Não Devedor AGT/INSS)
- `nif_proof` (Comprovativo NIF)
- `product_list` (Lista de Produtos)
- `commercial_license` / `commercial_licenses[]` (Alvará Comercial - Múltiplos ficheiros suportados)

---

## 2. Tabela: Usuários (`/users`)

No formulário de criação/edição de usuários, os seguintes campos são enviados/recebidos:

- `name` (Nome Completo) - *Obrigatório*
- `email` (Email) - *Obrigatório*
- `password` (Senha) - *Obrigatório na criação, opcional na edição*
- `role` (Função: 'admin' ou 'procurement_technician') - *Obrigatório*
- `is_active` (Boolean para conta ativa/inativa)

---

## 3. Tabela: Produtos (`/products`)

No formulário de criação de produtos:

- `name` (Nome do Produto) - *Obrigatório*
- `description` (Descrição detalhada) - *Opcional*
- `unit` (Unidade de Medida, ex: 'Kg', 'Unidade') - *Padrão: 'Unidade'*
- `category_id` (ID da Categoria) - *Obrigatório*

---

## 4. Tabela: Pedidos de Cotação (`/quotation-requests`)

No momento de solicitar uma cotação, o frontend envia os seguintes dados (podendo ser JSON ou Multipart se houver documentos anexos):

- `title` (Assunto da Solicitação) - *Obrigatório*
- `reference` / `reference_number` (Referência Manual) - *Obrigatório*
- `buyer_email` / `buyer` (Email do Comprador) - *Enviado nos dois formatos para garantir compatibilidade*
- `description` (Corpo da Mensagem)
- `activity_description` (Descrição da Atividade)
- `deadline` (Data limite de entrega / Prazo de Resposta, formato datetime 'YYYY-MM-DD HH:MM:SS')
- `ocultar_referencia` / `hide_auto_reference` (Boolean / '1' para esconder referência automática)
- `suppliers` (Array de IDs de Fornecedores selecionados) - *Mínimo 3*

**Itens do Pedido (Array `items`):**
Cada item dentro do pedido de cotação contém:
- `items[index][name]` (Nome do Produto)
- `items[index][quantity]` (Quantidade)
- `items[index][unit]` (Unidade)
- `items[index][specifications]` (Especificações / Descrição do Produto)

**Anexos (Opcional):**
- `documents[]` (Array de ficheiros anexados ao pedido)

---

## 5. Tabela: Categorias (`/categories`)

- `name` (Nome da Categoria)

---

## Resumo de Acção para a Equipa de Backend:

1. **Adicionar o campo `alt_phone`** na tabela e nos recursos da API de `Fornecedores`.
2. **Revisar a estrutura de Pedidos de Cotação**, garantindo que a API aceita `reference`, `buyer_email`, `activity_description`, os itens (produtos com quantidade e unidade) e anexos (`documents[]`).
3. **Validar o suporte a múltiplos Alvarás Comerciais** (`commercial_license` como array) no endpoint de atualização de fornecedores.
