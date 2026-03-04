const express = require('express');
const { Pedido, Cliente, Endereco, Produto } = require('../database');
const router = express.Router();

// GET /api/pedidos - Listar todos os pedidos (admin)
router.get('/', async (req, res) => {
  try {
    const { status, data_inicio, data_fim, limit = 50, offset = 0 } = req.query;
    
    let filter = {};
    
    if (status) {
      filter.status = status;
    }
    
    if (data_inicio || data_fim) {
      filter.data_pedido = {};
      if (data_inicio) {
        filter.data_pedido.$gte = new Date(data_inicio);
      }
      if (data_fim) {
        filter.data_pedido.$lte = new Date(data_fim);
      }
    }
    
    const pedidos = await Pedido.find(filter)
      .populate('cliente_id', 'nome telefone email')
      .populate('endereco_id')
      .populate('itens.produto_id', 'nome preco')
      .sort({ data_pedido: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .exec();
    
    res.json(pedidos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/pedidos/codigo/:codigo - Obter pedido por código (cliente)
router.get('/codigo/:codigo', async (req, res) => {
  try {
    const { codigo } = req.params;
    
    const pedido = await Pedido.findOne({ codigo })
      .populate('cliente_id', 'nome telefone email')
      .populate('endereco_id')
      .populate('itens.produto_id', 'nome preco')
      .exec();
    
    if (!pedido) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }
    
    res.json(pedido);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/pedidos/:id - Obter pedido por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const pedido = await Pedido.findById(id)
      .populate('cliente_id', 'nome telefone email')
      .populate('endereco_id')
      .populate('itens.produto_id', 'nome preco')
      .exec();
    
    if (!pedido) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }
    
    res.json(pedido);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/pedidos/cliente/:telefone - Pedidos de um cliente
router.get('/cliente/:telefone', async (req, res) => {
  try {
    const { telefone } = req.params;
    
    const cliente = await Cliente.findOne({ telefone });
    
    if (!cliente) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }
    
    const pedidos = await Pedido.find({ cliente_id: cliente._id })
      .populate('cliente_id', 'nome telefone')
      .populate('itens.produto_id', 'nome preco')
      .sort({ data_pedido: -1 })
      .exec();
    
    res.json(pedidos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/pedidos - Criar novo pedido
router.post('/', async (req, res) => {
  try {
    const {
      cliente_nome,
      cliente_telefone,
      cliente_email,
      endereco,
      itens,
      observacoes,
      forma_pagamento,
      subtotal,
      taxa_entrega = 0,
      desconto = 0
    } = req.body;
    
    if (!cliente_nome || !cliente_telefone || !itens || itens.length === 0) {
      return res.status(400).json({ error: 'Dados obrigatórios faltando' });
    }
    
    // Validar itens
    for (const item of itens) {
      if (!item.produto_id || !item.quantidade || !item.preco_unitario) {
        return res.status(400).json({ error: 'Itens inválidos' });
      }
    }
    
    // Buscar ou criar cliente
    let cliente = await Cliente.findOne({ telefone: cliente_telefone });
    
    if (!cliente) {
      cliente = new Cliente({
        nome: cliente_nome,
        telefone: cliente_telefone,
        email: cliente_email || null
      });
      await cliente.save();
    }
    
    // Criar endereço
    const novoEndereco = new Endereco({
      cliente_id: cliente._id,
      rua: endereco.rua,
      numero: endereco.numero,
      bairro: endereco.bairro,
      cidade: endereco.cidade,
      cep: endereco.cep,
      estado: endereco.estado,
      complemento: endereco.complemento || null,
      ponto_referencia: endereco.ponto_referencia || null
    });
    await novoEndereco.save();
    
    // Gerar código único
    const codigo = '#' + String(Math.floor(Math.random() * 100000)).padStart(5, '0');
    
    // Calcular total
    const total = subtotal + taxa_entrega - desconto;
    
    // Criar pedido
    const novoPedido = new Pedido({
      codigo,
      cliente_id: cliente._id,
      endereco_id: novoEndereco._id,
      status: 'confirmado',
      itens: itens.map(item => ({
        produto_id: item.produto_id,
        quantidade: item.quantidade,
        preco_unitario: item.preco_unitario,
        subtotal: item.subtotal || item.quantidade * item.preco_unitario,
        observacoes: item.observacoes || null
      })),
      subtotal,
      taxa_entrega,
      desconto,
      total,
      forma_pagamento,
      observacoes: observacoes || null
    });
    
    await novoPedido.save();
    await novoPedido.populate('cliente_id', 'nome telefone').execPopulate();
    
    res.status(201).json({
      _id: novoPedido._id,
      codigo: novoPedido.codigo,
      cliente: novoPedido.cliente_id,
      status: novoPedido.status,
      total: novoPedido.total,
      data_pedido: novoPedido.data_pedido
    });
  } catch (error) {
    console.error('Erro ao criar pedido:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/pedidos/:id/status - Atualizar status do pedido
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, observacoes } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'Status é obrigatório' });
    }
    
    const statusValidos = ['confirmado', 'preparando', 'saiu-entrega', 'entregue', 'cancelado'];
    if (!statusValidos.includes(status)) {
      return res.status(400).json({ error: 'Status inválido' });
    }
    
    const pedido = await Pedido.findById(id);
    
    if (!pedido) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }
    
    const statusAnterior = pedido.status;
    pedido.status = status;
    
    // Adicionar ao log de status
    pedido.status_log.push({
      status_anterior: statusAnterior,
      status_novo: status,
      observacoes: observacoes || null,
      created_at: new Date()
    });
    
    // Se entregue, atualizar data_entrega
    if (status === 'entregue') {
      pedido.data_entrega = new Date();
    }
    
    await pedido.save();
    
    res.json({
      _id: pedido._id,
      codigo: pedido.codigo,
      status: pedido.status,
      status_anterior: statusAnterior
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/pedidos/:id/cancel - Cancelar pedido
router.delete('/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;
    const { motivo } = req.body;
    
    const pedido = await Pedido.findById(id);
    
    if (!pedido) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }
    
    if (pedido.status === 'entregue' || pedido.status === 'cancelado') {
      return res.status(400).json({ error: 'Não é possível cancelar este pedido' });
    }
    
    const statusAnterior = pedido.status;
    pedido.status = 'cancelado';
    
    pedido.status_log.push({
      status_anterior: statusAnterior,
      status_novo: 'cancelado',
      observacoes: motivo || 'Cancelado',
      created_at: new Date()
    });
    
    await pedido.save();
    
    res.json({ 
      message: 'Pedido cancelado com sucesso',
      codigo: pedido.codigo
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/orders/:codigo - Rota alternativa para compatibilidade
router.get('/order/:codigo', async (req, res) => {
  try {
    const { codigo } = req.params;
    
    const pedido = await Pedido.findOne({ codigo })
      .populate('cliente_id', 'nome telefone')
      .populate('endereco_id')
      .populate('itens.produto_id', 'nome preco')
      .exec();
    
    if (!pedido) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }
    
    res.json(pedido);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
