# Configuração do Mercado Pago - Artesanal da Nega

Este guia explica como configurar o sistema de pagamentos com Mercado Pago para o cardápio digital da Artesanal da Nega.

## 📋 Pré-requisitos

- Conta no Mercado Pago (Brasil)
- Node.js instalado
- Projeto já configurado com backend PostgreSQL

## 🔧 Passo 1: Obter Credenciais do Mercado Pago

1. Acesse [Mercado Pago Developers](https://www.mercadopago.com.br/developers)
2. Faça login com sua conta
3. Vá para "Suas Aplicações" e clique em "Criar Aplicação"
4. Configure:
   - **Nome da aplicação**: "Artesanal da Nega - Cardápio"
   - **Descrição**: "Sistema de pagamentos para cardápio digital"
   - **Categoria**: "E-commerce"
   - **URL de produção**: `https://seusite.com` (se tiver)
   - **URL de callback**: `https://seusite.com/pagamento-sucesso.html`

5. Após criar, você receberá:
   - **Access Token** (Token de acesso)
   - **Public Key** (Chave pública)

## 🔐 Passo 2: Configurar Variáveis de Ambiente

No arquivo `server/.env`, adicione suas credenciais:

```env
# Configurações Mercado Pago
MERCADO_PAGO_ACCESS_TOKEN=SEU_ACCESS_TOKEN_AQUI
MERCADO_PAGO_PUBLIC_KEY=SEU_PUBLIC_KEY_AQUI
```

**Importante**: 
- Use as credenciais de **TESTE** durante o desenvolvimento (prefixo `TEST-`)
- Em produção, use as credenciais reais **SEM** o prefixo `TEST-`

## 🚀 Passo 3: Instalar Dependências

Já foi instalado o SDK do Mercado Pago:

```bash
cd server
npm install mercadopago
```

## 📱 Passo 4: Configurar Frontend

No arquivo `pagamento.html`, atualize a chave pública:

```javascript
// Linha ~200
mp = new MercadoPago('TEST-SEU_PUBLIC_KEY_AQUI', {
    locale: 'pt-BR'
});
```

## 💳 Passo 5: Formas de Pagamento Disponíveis

### ✅ Pix
- Geração automática de QR Code
- Pagamento instantâneo
- Verificação de status em tempo real

### 💳 Cartão de Crédito
- Até 12 parcelas (configurável)
- Processamento seguro via Mercado Pago
- Validação de dados em tempo real

### 💳 Cartão de Débito
- Débito direto na conta
- Processamento imediato
- Mesma segurança do crédito

### 💵 Dinheiro (Mantido)
- Processo existente mantido
- Campo para troco
- Entrega com pagamento na porta

## 🔗 Endpoints da API

### Backend (`/api/pagamentos`)

| Método | Endpoint | Descrição |
|--------|-----------|----------|
| POST | `/criar-preferencia` | Cria preferência de pagamento |
| POST | `/processar-cartao` | Processa pagamento com cartão |
| POST | `/gerar-pix` | Gera QR Code para Pix |
| GET | `/verificar/:paymentId` | Verifica status do pagamento |
| POST | `/webhook` | Recebe notificações do Mercado Pago |

## 🧪 Testes

### Ambiente de Teste
1. Use credenciais de teste (`TEST-`)
2. Cartões de teste disponíveis no [docs do Mercado Pago](https://www.mercadopago.com.br/developers/pt/guides/payments/api/testing)

### Cartões de Teste
| Bandeira | Número | CVV | Validade |
|-----------|---------|-----|----------|
| Mastercard | 5031 4332 1290 6757 | 123 | 11/25 |
| Visa | 4235 6477 2805 3756 | 123 | 11/25 |

### Fluxo de Teste
1. Adicione produtos ao carrinho
2. Preencha dados de entrega
3. Selecione forma de pagamento online
4. Será redirecionado para página de pagamento
5. Teste com dados de teste

## 📊 Webhooks (Opcional)

Para receber notificações automáticas:

1. No painel do Mercado Pago, configure webhooks
2. URL: `https://seusite.com/api/pagamentos/webhook`
3. Eventos: `payment`, `payment.updated`

## 🔒 Segurança

- **Never** exponha seu Access Token no frontend
- Use sempre HTTPS em produção
- Valide dados do cliente no backend
- Implemente rate limiting (já configurado)

## 🚨 Solução de Problemas

### Erro Comum: "Invalid access token"
- Verifique se o token no `.env` está correto
- Confirme se está usando as credenciais corretas (teste vs produção)

### Erro Comum: "Card token creation failed"
- Verifique se a Public Key está correta no frontend
- Confirme se os dados do cartão são válidos

### Pagamento não aprovado
- Use dados de teste válidos
- Verifique se o usuário tem saldo (em teste)

## 📞 Suporte

- **Documentação Mercado Pago**: https://www.mercadopago.com.br/developers
- **Suporte Mercado Pago**: https://www.mercadopago.com.br/ajuda

## 🔄 Próximos Passos

1. ✅ Configurar credenciais de teste
2. ✅ Testar todas as formas de pagamento
3. ⏳ Configurar webhooks (opcional)
4. ⏳ Substituir credenciais de teste para produção
5. ⏳ Configurar domínio e HTTPS

---

**Atenção**: Este sistema usa credenciais de TESTE. Para aceitar pagamentos reais, configure as credenciais de produção e use HTTPS.
