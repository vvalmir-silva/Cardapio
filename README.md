# Artesanal da Nega - Cardápio Digital

Sistema completo de cardápio digital com backend Node.js, PostgreSQL e integração Mercado Pago.

## 🚀 Funcionalidades

- Cardápio interativo com produtos e categorias
- Carrinho de compras
- Sistema de pedidos com acompanhamento
- Painel administrativo
- Integração com Mercado Pago (Pix e Cartão)
- Responsivo e acessível

## 🛠️ Tecnologias

- **Frontend:** HTML, TailwindCSS, JavaScript
- **Backend:** Node.js, Express
- **Banco:** PostgreSQL
- **Pagamentos:** Mercado Pago

## 📋 Pré-requisitos

- Node.js (v16+)
- PostgreSQL
- Conta Mercado Pago

## 🔧 Instalação e Configuração

### 1. Clone o repositório
```bash
git clone https://github.com/vvalmir-silva/Cardapio.git
cd Cardapio
```

### 2. Backend
```bash
cd server
npm install
```

Configure o arquivo `.env`:
```env
# Banco de dados
DB_HOST=localhost
DB_PORT=5432
DB_NAME=artesanal_da_nega
DB_USER=postgres
DB_PASSWORD=sua_senha

# Mercado Pago (produção - sem TEST-)
MERCADO_PAGO_ACCESS_TOKEN=APP_USR-...
MERCADO_PAGO_PUBLIC_KEY=APP_USR-...

# Outras configurações...
```

Inicie o backend:
```bash
npm start
```

### 3. Frontend
Abra `index.html` no navegador ou use um servidor local.

## 🌐 Deploy

### Frontend (Vercel)
1. Conecte o repositório no Vercel
2. O deploy será automático

### API (Backend)
Para produção, você precisa hospedar a API em um serviço como:
- Vercel
- Railway
- Render
- Heroku

**Importante:** Atualize a URL da API nos arquivos HTML:
```javascript
window.API_BASE_URL = 'https://sua-api-producao.vercel.app';
```

### Configuração de Produção
1. **API URL:** Substitua `https://cardapio-api.vercel.app` pela URL real da sua API
2. **CORS:** Adicione o domínio do frontend na configuração CORS do backend
3. **Banco:** Configure um banco PostgreSQL na nuvem (ElephantSQL, Supabase, etc.)

## 📱 Uso

1. Acesse o cardápio
2. Adicione produtos ao carrinho
3. Faça o pedido
4. Acompanhe pelo código do pedido
5. Pague via Pix ou cartão

## 🔐 Mercado Pago

Para configurar pagamentos:
1. Acesse [Mercado Pago Developers](https://www.mercadopago.com.br/developers)
2. Crie uma aplicação
3. Use credenciais de produção (sem `TEST-`)
4. Configure webhooks se necessário

## 📝 Scripts

```bash
# Backend
npm start          # Inicia servidor
npm run dev        # Desenvolvimento com nodemon

# Frontend
npm run dev        # Tailwind watch
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-feature`)
3. Commit (`git commit -m 'Adiciona nova feature'`)
4. Push (`git push origin feature/nova-feature`)
5. Abra um Pull Request
