const express = require('express');
const { MercadoPagoConfig, Payment, Preference } = require('mercadopago');
const router = express.Router();

// Configuração do Mercado Pago
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN
});

// Criar preferência de pagamento
router.post('/criar-preferencia', async (req, res) => {
  try {
    const { items, pedidoId, clienteInfo } = req.body;

    const preference = new Preference(client);
    
    const body = {
      items: items.map(item => ({
        title: item.nome,
        quantity: item.quantidade,
        unit_price: parseFloat(item.preco),
        currency_id: 'BRL'
      })),
      payer: {
        name: clienteInfo.nome,
        email: clienteInfo.email
      },
      external_reference: pedidoId.toString()
    };

    const result = await preference.create({ body });
    
    res.json({
      success: true,
      preferenceId: result.id,
      initPoint: result.init_point,
      sandboxInitPoint: result.sandbox_init_point
    });

  } catch (error) {
    console.error('Erro ao criar preferência:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao criar preferência de pagamento',
      error: error.message
    });
  }
});

// Processar pagamento com cartão de crédito
router.post('/processar-cartao', async (req, res) => {
  try {
    const {
      token,
      pedidoId,
      valor,
      parcelas,
      paymentMethodId,
      clienteInfo
    } = req.body;

    const payment = new Payment(client);

    const body = {
      token: token,
      description: `Pedido #${pedidoId}`,
      installments: parseInt(parcelas),
      payment_method_id: paymentMethodId,
      payer: {
        email: clienteInfo.email,
        identification: {
          type: 'CPF',
          number: clienteInfo.cpf || ''
        }
      },
      transaction_amount: parseFloat(valor),
      external_reference: pedidoId.toString()
    };

    const result = await payment.create({ body });

    res.json({
      success: true,
      paymentId: result.id,
      status: result.status,
      statusDetail: result.status_detail,
      paymentMethodId: result.payment_method_id
    });

  } catch (error) {
    // Tenta extrair mensagem detalhada do Mercado Pago
    let mpError = error;
    if (error && error.cause && Array.isArray(error.cause) && error.cause.length > 0) {
      mpError = error.cause.map(e => e.description || e.message || JSON.stringify(e)).join(' | ');
    } else if (error.message) {
      mpError = error.message;
    } else {
      mpError = JSON.stringify(error);
    }
    console.error('Erro ao processar pagamento:', mpError);
    res.status(500).json({
      success: false,
      message: 'Erro ao processar pagamento',
      error: mpError
    });
  }
});

// Gerar QR Code para Pix
router.post('/gerar-pix', async (req, res) => {
  try {
    console.log('=== INICIANDO GERAÇÃO PIX ===');
    console.log('Request body:', req.body);
    
    const { pedidoId, valor, clienteInfo } = req.body;
    
    console.log('Dados recebidos:', { pedidoId, valor, clienteInfo });
    console.log('Access Token:', process.env.MERCADO_PAGO_ACCESS_TOKEN?.substring(0, 20) + '...');
    
    const payment = new Payment(client);

    // Criar pagamento com chave fixa para teste
    const body = {
      description: `Pedido #${pedidoId}`,
      transaction_amount: parseFloat(valor),
      payment_method_id: 'pix',
      payment_method: {
        type: 'bank_transfer',
        data: {
          // Usar uma chave fixa para teste
          // Você precisa substituir pela sua chave real
          pix_key: 'COLE-SUA-CHAVE-PIX-AQUI', // SUBSTITUA PELA SUA CHAVE PIX REAL
          external_reference: pedidoId.toString()
        }
      },
      payer: {
        email: clienteInfo.email,
        first_name: clienteInfo.nome?.split(' ')[0] || '',
        last_name: clienteInfo.nome?.split(' ').slice(1).join(' ') || '',
        identification: {
          type: 'CPF',
          number: clienteInfo.cpf || ''
        }
      },
      external_reference: pedidoId.toString()
    };

    console.log('Body para Mercado Pago:', body);

    const result = await payment.create({ body });
    
    console.log('Resultado Mercado Pago:', result);
    console.log('Status:', result.status);
    console.log('ID:', result.id);

    if (result.status === 'pending') {
      // Gerar QR Code
      const pix = result.point_of_interaction.transaction_data.qr_code_base64;
      
      console.log('QR Code gerado:', !!pix);
      console.log('Tamanho QR Code:', pix?.length || 0);
      
      if (pix) {
        res.json({
          success: true,
          paymentId: result.id,
          qrCodeBase64: pix,
          copiaECola: result.point_of_interaction.transaction_data.qr_code,
          message: 'QR Code gerado com sucesso',
          chavePix: 'sua-chave-pix-aqui' // Mostra qual chave está sendo usada
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Erro ao gerar QR Code'
        });
      }
    } else {
      console.error('Erro ao criar pagamento:', result);
      res.status(500).json({
        success: false,
        message: result.error_message || 'Erro ao processar pagamento'
      });
    }
  } catch (error) {
    console.error('Erro na rota /gerar-pix:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({
      success: false,
      message: error.message || 'Erro interno do servidor'
    });
  }
});

// Verificar status do pagamento
router.get('/verificar/:paymentId', async (req, res) => {
  try {
    const { paymentId } = req.params;
    
    const payment = new Payment(client);
    const result = await payment.get({ paymentId });

    res.json({
      success: true,
      status: result.status,
      statusDetail: result.status_detail,
      paymentMethodId: result.payment_method_id,
      externalReference: result.external_reference,
      dateApproved: result.date_approved,
      dateCreated: result.date_created
    });

  } catch (error) {
    console.error('Erro ao verificar pagamento:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao verificar status do pagamento',
      error: error.message
    });
  }
});

// Webhook para receber notificações do Mercado Pago
router.post('/webhook', (req, res) => {
  try {
    const { type, data } = req.body;

    if (type === 'payment') {
      const paymentId = data.id;
      console.log(`Notificação de pagamento recebida: ${paymentId}`);
      
      // Aqui você pode atualizar o status do pedido no banco
      // TODO: Implementar lógica para atualizar status do pedido
      
      // Exemplo:
      // atualizarStatusPedido(paymentId);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Erro no webhook:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
});

module.exports = router;
