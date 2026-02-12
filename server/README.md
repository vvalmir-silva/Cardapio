# 🚀 API Artesanal da Nega

Backend completo em Node.js + PostgreSQL para o sistema de cardápio digital da Artesanal da Nega.

## 📋 Requisitos

- Node.js 16+ 
- PostgreSQL 12+
- npm ou yarn

## 🛠️ Instalação

### 1. Instalar dependências
\\\ash
npm install
\\\

### 2. Configurar banco de dados
\\\ash
# Criar banco de dados
createdb artesanal_da_nega

# Importar schema
psql -d artesanal_da_nega -f ../database/schema.sql
\\\

### 3. Configurar variáveis de ambiente
Copie o arquivo \.env.example\ para \.env\ e configure:

\\\nv
# Configurações do Banco de Dados PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=artesanal_da_nega
DB_USER=postgres
DB_PASSWORD=sua_senha_aqui

# Configurações do Servidor
PORT=3001
NODE_ENV=development

# Configurações de Segurança
JWT_SECRET=seu_jwt_secret_aqui_muito_secreto
JWT_EXPIRES_IN=24h
\\\

### 4. Iniciar servidor
\\\ash
# Desenvolvimento
npm run dev

# Produção
npm start
\\\

## 📡 Endpoints da API

### 🍔 Produtos
- \GET /api/produtos\ - Listar produtos
- \GET /api/produtos/:id\ - Obter produto
- \GET /api/produtos/categorias/all\ - Listar categorias
- \POST /api/produtos\ - Criar produto (admin)
- \PUT /api/produtos/:id\ - Atualizar produto (admin)
- \DELETE /api/produtos/:id\ - Desativar produto (admin)

### 📦 Pedidos
- \GET /api/pedidos\ - Listar pedidos (admin)
- \GET /api/pedidos/:id\ - Obter pedido
- \GET /api/pedidos/codigo/:codigo\ - Buscar por código (cliente)
- \POST /api/pedidos\ - Criar pedido
- \PUT /api/pedidos/:id/status\ - Atualizar status
- \GET /api/pedidos/estatisticas/daily\ - Estatísticas diárias

### 👥 Clientes
- \GET /api/clientes\ - Listar clientes (admin)
- \GET /api/clientes/:id\ - Obter cliente
- \GET /api/clientes/telefone/:telefone\ - Buscar por telefone
- \POST /api/clientes\ - Criar cliente
- \PUT /api/clientes/:id\ - Atualizar cliente
- \POST /api/clientes/:id/enderecos\ - Adicionar endereço

### 🔐 Admin
- \POST /api/admin/login\ - Login
- \GET /api/admin/verify\ - Verificar token
- \GET /api/admin/dashboard\ - Dashboard
- \GET /api/admin/usuarios\ - Listar usuários
- \POST /api/admin/usuarios\ - Criar usuário
- \PUT /api/admin/usuarios/:id\ - Atualizar usuário
- \PUT /api/admin/usuarios/:id/senha\ - Alterar senha
- \GET /api/admin/configuracoes\ - Configurações
- \PUT /api/admin/configuracoes\ - Atualizar configurações

## 🗄️ Estrutura do Banco

### Tabelas Principais
- **categorias** - Categorias de produtos
- **produtos** - Produtos do cardápio
- **clientes** - Clientes cadastrados
- **enderecos** - Endereços de entrega
- **pedidos** - Pedidos realizados
- **pedido_itens** - Itens dos pedidos
- **usuarios_admin** - Usuários administrativos
- **configuracoes** - Configurações do sistema

### Views
- **vw_estatisticas_pedidos** - Estatísticas de pedidos
- **vw_produtos_mais_vendidos** - Produtos mais vendidos

## 🔒 Autenticação

A API usa JWT tokens para autenticação:

\\\javascript
// Login
POST /api/admin/login
{
  \
usuario\: \admin\,
  \senha\: \admin123\
}

// Resposta
{
  \user\: { \id\: 1, \nome\: \Admin\, ... },
  \token\: \eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...\,
  \expiresIn\: \24h\
}

// Usar token em requisições
Authorization: Bearer <token>
\\\

## 📊 Exemplos de Uso

### Criar Pedido
\\\javascript
POST /api/pedidos
{
  \cliente_nome\: \João
Silva\,
  \cliente_telefone\: \
11
99999-8888\,
  \endereco\: {
    \rua\: \Rua
São
Paulo\,
    \numero\: \123\,
    \bairro\: \Centro\,
    \cidade\: \São
Paulo\,
    \estado\: \SP\,
    \cep\: \01234-567\
  },
  \itens\: [
    {
      \produto_id\: 1,
      \quantidade\: 2,
      \preco_unitario\: 8.50,
      \subtotal\: 17.00
    }
  ],
  \observacoes\: \Sem
cebola\,
  \forma_pagamento\: \dinheiro\
}
\\\

### Atualizar Status
\\\javascript
PUT /api/pedidos/1/status
{
  \status\: \preparando\,
  \usuario_responsavel\: \admin\
}
\\\

## 🧪 Testes

\\\ash
# Rodar testes
npm test

# Testes de cobertura
npm run test:coverage
\\\

## 🚀 Deploy

### Variáveis de Ambiente de Produção
\\\nv
NODE_ENV=production
DB_HOST=seu_host_postgresql
DB_PORT=5432
DB_NAME=artesanal_da_nega
DB_USER=seu_usuario
DB_PASSWORD=sua_senha_forte
JWT_SECRET=segredo_muito_forte_aqui
PORT=3001
\\\

### PM2 (Process Manager)
\\\ash
# Instalar PM2
npm install -g pm2

# Iniciar aplicação
pm2 start server.js --name \artesanal-da-nega-api\

# Verificar status
pm2 status

# Ver logs
pm2 logs artesanal-da-nega-api
\\\

## 📝 Logs

A API gera logs detalhados para:
- Conexões com banco
- Queries executadas
- Erros e falhas
- Requisições HTTP

## 🔧 Manutenção

### Backup do Banco
\\\ash
# Backup completo
pg_dump artesanal_da_nega > backup_\.sql

# Restaurar
psql -d artesanal_da_nega < backup_20240211.sql
\\\

### Limpeza de Logs
\\\ash
# Limpar logs antigos (manter 30 dias)
find /var/log/artesanal-da-nega -name \*.log\ -mtime +30 -delete
\\\

## 🐛 Troubleshooting

### Problemas Comuns

1. **Conexão com PostgreSQL**
   - Verifique se o PostgreSQL está rodando
   - Confirme as credenciais no .env
   - Teste conexão: \psql -h localhost -U postgres -d artesanal_da_nega\

2. **Porta em uso**
   - Verifique se a porta 3001 está livre
   - Use \
etstat -tulpn | grep 3001\

3. **Token JWT inválido**
   - Verifique JWT_SECRET no .env
   - Confirme se o token não expirou

### Monitoramento
- Health check: \GET /api/health\
- Logs: Console e arquivo de logs
- Metrics: Dashboard interno

## 📞 Suporte

Em caso de dúvidas ou problemas:
1. Verifique os logs
2. Consulte a documentação
3. Abra uma issue no repositório

---

## 📄 Licença

MIT License - Copyright (c) 2024 Artesanal da Nega
