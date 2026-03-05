const express = require('express');
const cors = require('cors');
const { MercadoPagoConfig, Payment } = require('mercadopago');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Configuração do Mercado Pago
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN
});

// Rota para gerar QR Code Pix
app.post('/api/pagamentos/gerar-pix', async (req, res) => {
  try {
    console.log('=== INICIANDO GERAÇÃO PIX ===');
    console.log('Request body:', req.body);
    
    const { pedidoId, valor, clienteInfo } = req.body;
    
    console.log('Dados recebidos:', { pedidoId, valor, clienteInfo });
    console.log('Access Token:', process.env.MERCADO_PAGO_ACCESS_TOKEN?.substring(0, 20) + '...');
    
    if (!process.env.MERCADO_PAGO_ACCESS_TOKEN) {
      return res.status(500).json({
        success: false,
        message: 'Mercado Pago access token não configurado'
      });
    }
    
    const payment = new Payment(client);

    // Criar pagamento Pix
    const body = {
      description: `Pedido #${pedidoId}`,
      transaction_amount: parseFloat(valor),
      payment_method_id: 'pix',
      payer: {
        email: clienteInfo.email,
        first_name: clienteInfo.nome?.split(' ')[0] || '',
        last_name: clienteInfo.nome?.split(' ').slice(1).join(' ') || '',
        identification: {
          type: 'CPF',
          number: clienteInfo.cpf && clienteInfo.cpf.length === 11 ? clienteInfo.cpf : '12345678909' // CPF válido de teste
        }
      },
      external_reference: pedidoId.toString()
    };

    console.log('Body para Mercado Pago:', JSON.stringify(body, null, 2));

    const result = await payment.create({ body });
    
    console.log('Resultado Mercado Pago:', result);
    console.log('Status:', result.status);
    console.log('ID:', result.id);

    if (result.status === 'pending') {
      // Gerar QR Code
      const pix = result.point_of_interaction?.transaction_data?.qr_code_base64;
      
      console.log('QR Code gerado:', !!pix);
      console.log('Tamanho QR Code:', pix?.length || 0);
      
      if (pix) {
        res.json({
          success: true,
          paymentId: result.id,
          qrCodeBase64: pix,
          copiaECola: result.point_of_interaction.transaction_data.qr_code,
          message: 'QR Code gerado com sucesso'
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'QR Code não gerado pelo Mercado Pago',
          debug: result
        });
      }
    } else {
      console.error('Status inesperado:', result);
      res.status(500).json({
        success: false,
        message: `Status inesperado: ${result.status}`,
        debug: result
      });
    }
  } catch (error) {
    console.error('Erro na rota /gerar-pix:', error);
    console.error('Stack:', error.stack);
    
    // Tenta extrair mensagem detalhada do Mercado Pago
    let mpError = error;
    if (error && error.cause && Array.isArray(error.cause) && error.cause.length > 0) {
      mpError = error.cause.map(e => e.description || e.message || JSON.stringify(e)).join(' | ');
    } else if (error.message) {
      mpError = error.message;
    } else {
      mpError = JSON.stringify(error);
    }
    
    res.status(500).json({
      success: false,
      message: 'Erro ao gerar QR Code Pix',
      error: mpError,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Rota de teste
app.get('/api/test', (req, res) => {
  res.json({
    message: 'Servidor de teste funcionando',
    timestamp: new Date().toISOString(),
    hasToken: !!process.env.MERCADO_PAGO_ACCESS_TOKEN
  });
});

const PORT = 3002;
app.listen(PORT, () => {
  console.log(`🚀 Servidor de teste rodando na porta ${PORT}`);
  console.log(`📡 Test endpoint: http://localhost:${PORT}/api/test`);
  console.log(`💡 Pix endpoint: http://localhost:${PORT}/api/pagamentos/gerar-pix`);
});
