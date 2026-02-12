# 🚀 Integração com PostgreSQL - Guia Completo

## 📋 Estrutura Criada

### ��️ Banco de Dados
- **database/schema.sql** - Estrutura completa do PostgreSQL
- **10 tabelas** com relacionamentos e índices
- **Triggers** para auditoria automática
- **Views** para relatórios

### 🔧 Backend API
- **server/** - Pasta completa com API Node.js
- **package.json** - Dependências e scripts
- **server.js** - Servidor principal Express
- **database.js** - Conexão PostgreSQL
- **routes/** - Endpoints da API

## 🛠️ Passos para Configuração

### 1. Instalar PostgreSQL
\\\ash
# Windows: Baixe e instale postgresql.org
# Ubuntu/Debian:
sudo apt update
sudo apt install postgresql postgresql-contrib

# macOS:
brew install postgresql
brew services start postgresql
\\\

### 2. Criar Banco de Dados
\\\ash
# Acessar PostgreSQL
sudo -u postgres psql

# Criar banco
CREATE DATABASE artesanal_da_nega;
CREATE USER artesanal_user WITH PASSWORD 'sua_senha';
GRANT ALL PRIVILEGES ON DATABASE artesanal_da_nega TO artesanal_user;
\\q
\\\

### 3. Importar Schema
\\\ash
cd database
psql -d artesanal_da_nega -f schema.sql
\\\

### 4. Configurar Backend
\\\ash
cd server
npm install

# Configurar .env
cp .env.example .env
# Edite o .env com suas credenciais
\\\

### 5. Iniciar Servidor
\\\ash
npm run dev
# API estará rodando em http://localhost:3001
\\\

## �� Endpoints Disponíveis

### 🍔 Produtos
- \GET /api/produtos\ - Lista todos os produtos
- \GET /api/produtos/:id\ - Detalhes do produto
- \POST /api/produtos\ - Criar produto (admin)

### 📦 Pedidos
- \GET /api/pedidos\ - Lista pedidos (admin)
- \POST /api/pedidos\ - Criar novo pedido
- \GET /api/pedidos/codigo/:codigo\ - Buscar pedido por código
- \PUT /api/pedidos/:id/status\ - Atualizar status

### 👥 Clientes
- \GET /api/clientes\ - Lista clientes (admin)
- \POST /api/clientes\ - Criar cliente
- \GET /api/clientes/telefone/:telefone\ - Buscar por telefone

### 🔐 Admin
- \POST /api/admin/login\ - Login administrativo
- \GET /api/admin/dashboard\ - Dashboard com estatísticas

## 🔗 Atualizar Frontend

### 1. Substituir localStorage por chamadas API

No **index.html**, substitua as funções de armazenamento:

\\\javascript
// Antes (localStorage)
let orders = [];
orders.push(order);

// Depois (API)
async function submitOrder() {
  try {
    const response = await fetch('http://localhost:3001/api/pedidos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cliente_nome: name,
        cliente_telefone: phone,
        endereco: {
          rua: address,
          numero: number,
          complemento: complement,
          bairro: neighborhood,
          cidade: city,
          cep: cep
        },
        itens: cart.map(item => ({
          produto_id: item.id,
          quantidade: item.quantity,
          preco_unitario: item.price,
          subtotal: item.price * item.quantity
        })),
        observacoes: notes,
        forma_pagamento: 'dinheiro'
      })
    });
    
    const order = await response.json();
    console.log('Pedido criado:', order);
    
    // Mostrar sucesso
    document.getElementById('order-code').textContent = order.codigo;
    document.getElementById('success-modal').classList.remove('hidden');
    
  } catch (error) {
    console.error('Erro ao criar pedido:', error);
    showToast('Erro ao processar pedido', 'error');
  }
}
\\\

### 2. Carregar produtos da API

\\\javascript
// Carregar produtos do banco
async function loadProducts() {
  try {
    const response = await fetch('http://localhost:3001/api/produtos');
    const products = await response.json();
    
    // Atualizar array de produtos
    window.products = products;
    
    // Renderizar produtos
    renderProducts();
  } catch (error) {
    console.error('Erro ao carregar produtos:', error);
    showToast('Erro ao carregar cardápio', 'error');
  }
}

// Chamar no carregamento da página
document.addEventListener('DOMContentLoaded', function() {
  loadProducts();
  // ... resto do código
});
\\\

### 3. Acompanhamento de pedidos

\\\javascript
// Buscar pedido por código
async function searchOrder() {
  const code = document.getElementById('tracking-code').value.trim();
  const name = document.getElementById('tracking-name').value.trim();
  
  try {
    const response = await fetch(\http://localhost:3001/api/pedidos/codigo/\\);
    
    if (!response.ok) {
      throw new Error('Pedido não encontrado');
    }
    
    const order = await response.json();
    
    // Verificar se nome corresponde
    if (order.cliente_nome.toLowerCase() !== name.toLowerCase()) {
      throw new Error('Nome não corresponde ao pedido');
    }
    
    // Mostrar detalhes
    showOrderDetails(order);
    
  } catch (error) {
    console.error('Erro ao buscar pedido:', error);
    showToast(error.message, 'error');
  }
}
\\\

## �� Painel Administrativo

### Atualizar painel-admin.html

\\\javascript
// Login com API
async function handleLogin(e) {
  e.preventDefault();
  
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  
  try {
    const response = await fetch('http://localhost:3001/api/admin/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ usuario: username, senha: password })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      // Salvar token
      localStorage.setItem('adminToken', data.token);
      localStorage.setItem('adminUser', JSON.stringify(data.user));
      
      // Mostrar dashboard
      showDashboard();
      loadDashboardData();
    } else {
      document.getElementById('login-error').classList.remove('hidden');
    }
    
  } catch (error) {
    console.error('Erro no login:', error);
    document.getElementById('login-error').classList.remove('hidden');
  }
}

// Carregar dados do dashboard
async function loadDashboardData() {
  const token = localStorage.getItem('adminToken');
  
  try {
    const response = await fetch('http://localhost:3001/api/admin/dashboard', {
      headers: {
        'Authorization': \Bearer \\
      }
    });
    
    const data = await response.json();
    
    // Atualizar estatísticas
    document.getElementById('today-orders').textContent = data.estatisticas.pedidos_hoje;
    document.getElementById('completed-orders').textContent = data.estatisticas.concluidos_hoje;
    document.getElementById('preparing-orders').textContent = data.estatisticas.preparando_hoje;
    document.getElementById('today-revenue').textContent = \R\$ \\;
    
    // Renderizar pedidos
    renderOrders(data.pedidos_recentes);
    
  } catch (error) {
    console.error('Erro ao carregar dashboard:', error);
  }
}

// Atualizar status do pedido
async function updateOrderStatus(orderId, newStatus) {
  const token = localStorage.getItem('adminToken');
  
  try {
    const response = await fetch(\http://localhost:3001/api/pedidos/\/status\, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': \Bearer \\
      },
      body: JSON.stringify({ 
        status: newStatus,
        usuario_responsavel: localStorage.getItem('adminUser').nome
      })
    });
    
    if (response.ok) {
      showToast(\Status atualizado para \\);
      loadDashboardData(); // Recarregar dados
    } else {
      throw new Error('Erro ao atualizar status');
    }
    
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    showToast('Erro ao atualizar status', 'error');
  }
}
\\\

## 🧪 Testes

### Testar API
\\\ash
# Health check
curl http://localhost:3001/api/health

# Listar produtos
curl http://localhost:3001/api/produtos

# Login admin
curl -X POST http://localhost:3001/api/admin/login \\
  -H \
Content-Type:
application/json\ \\
  -d '{\usuario\: \admin\, \senha\: \admin123\}'
\\\

### Testar Frontend
1. Abra \index.html\ no navegador
2. Verifique se os produtos carregam da API
3. Teste criar um pedido
4. Verifique no painel administrativo

## 🚀 Deploy

### Backend (Heroku/Render)
\\\ash
# Instalar CLI do serviço
# Heroku:
heroku create artesanal-da-nega-api
heroku config:set DB_HOST=...
heroku config:set JWT_SECRET=...
git push heroku main

# Render:
# Conecte repositório no painel Render
# Configure variáveis de ambiente
\\\

### Frontend (Netlify/Vercel)
\\\ash
# Atualizar URLs da API para produção
const API_BASE_URL = 'https://sua-api.herokuapp.com/api';

# Deploy estático
# Netlify: Arrastar pasta para netlify.app
# Vercel: \ercel --prod\
\\\

## 📊 Benefícios

### ✅ Com PostgreSQL
- **Dados persistentes** - Não perde pedidos ao recarregar
- **Multiusuário** - Vários administradores podem usar
- **Relatórios** - Estatísticas reais do negócio
- **Escalabilidade** - Suporta milhares de pedidos
- **Segurança** - Backup e recuperação de dados

### ✅ Performance
- **Índices otimizados** - Buscas rápidas
- **Pool de conexões** - Múltiplos usuários simultâneos
- **Cache** - Produtos em memória
- **Paginação** - Não sobrecarrega o servidor

### ✅ Profissionalismo
- **API RESTful** - Padrão da indústria
- **Autenticação JWT** - Segurança moderna
- **Logs completos** - Auditoria de todas as operações
- **Documentação** - API bem documentada

## 🎯 Próximos Passos

1. **Configurar ambiente** - PostgreSQL + Node.js
2. **Importar schema** - Criar tabelas
3. **Testar API** - Verificar endpoints
4. **Atualizar frontend** - Substituir localStorage
5. **Deploy** - Colocar em produção

O sistema estará 100% profissional e pronto para uso comercial! 🚀
