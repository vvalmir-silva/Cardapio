const express = require('express');
const { query, transaction } = require('../database');
const router = express.Router();

// GET /api/pedidos - Listar todos os pedidos (admin)
router.get('/', async (req, res) => {
  try {
    const { status, data_inicio, data_fim, limit = 50, offset = 0 } = req.query;
    
    let sql = `
      SELECT 
        p.*,
        c.nome as cliente_nome,
        c.telefone as cliente_telefone,
        e.rua, e.numero, e.bairro, e.cidade, e.cep
      FROM pedidos p
      LEFT JOIN clientes c ON p.cliente_id = c.id
      LEFT JOIN enderecos e ON p.endereco_id = e.id
      WHERE 1=1
    `;
    const params = [];
    
    if (status) {
      sql += ' AND p.status = $' + (params.length + 1);
      params.push(status);
    }
    
    if (data_inicio) {
      sql += ' AND DATE(p.data_pedido) >= $' + (params.length + 1);
      params.push(data_inicio);
    }
    
    if (data_fim) {
      sql += ' AND DATE(p.data_pedido) <= $' + (params.length + 1);
      params.push(data_fim);
    }
    
    sql += ' ORDER BY p.data_pedido DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);
    
    const result = await query(sql, params);
    
    // Buscar itens para cada pedido
    for (const pedido of result.rows) {
      const itensSql = `
        SELECT pi.*, pr.nome as produto_nome
        FROM pedido_itens pi
        LEFT JOIN produtos pr ON pi.produto_id = pr.id
        WHERE pi.pedido_id = $1
      `;
      const itensResult = await query(itensSql, [pedido.id]);
      pedido.itens = itensResult.rows;
    }
    
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/pedidos/:id - Obter pedido por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const sql = `
      SELECT 
        p.*,
        c.nome as cliente_nome,
        c.telefone as cliente_telefone,
        e.rua, e.numero, e.bairro, e.cidade, e.cep, e.complemento
      FROM pedidos p
      LEFT JOIN clientes c ON p.cliente_id = c.id
      LEFT JOIN enderecos e ON p.endereco_id = e.id
      WHERE p.id = $1
    `;
    
    const result = await query(sql, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }
    
    const pedido = result.rows[0];
    
    // Buscar itens
    const itensSql = `
      SELECT pi.*, pr.nome as produto_nome
      FROM pedido_itens pi
      JOIN produtos pr ON pi.produto_id = pr.id
      WHERE pi.pedido_id = $1
    `;
    const itensResult = await query(itensSql, [pedido.id]);
    pedido.itens = itensResult.rows;
    
    res.json(pedido);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/pedidos/codigo/:codigo - Obter pedido por código (cliente)
router.get('/codigo/:codigo', async (req, res) => {
  try {
    const { codigo } = req.params;
    
    const sql = `
      SELECT 
        p.*,
        c.nome as cliente_nome,
        c.telefone as cliente_telefone,
        e.rua, e.numero, e.bairro, e.cidade, e.cep, e.complemento
      FROM pedidos p
      LEFT JOIN clientes c ON p.cliente_id = c.id
      LEFT JOIN enderecos e ON p.endereco_id = e.id
      WHERE p.codigo = $1
    `;
    
    const result = await query(sql, [codigo]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }
    
    const pedido = result.rows[0];
    
    // Buscar itens
    const itensSql = `
      SELECT pi.*, pr.nome as produto_nome
      FROM pedido_itens pi
      JOIN produtos pr ON pi.produto_id = pr.id
      WHERE pi.pedido_id = $1
    `;
    const itensResult = await query(itensSql, [pedido.id]);
    pedido.itens = itensResult.rows;
    
    res.json(pedido);
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
      endereco,
      itens,
      observacoes,
      forma_pagamento,
      valor_total
    } = req.body;
    
    if (!cliente_nome || !cliente_telefone || !itens || itens.length === 0) {
      return res.status(400).json({ error: 'Dados obrigatórios faltando' });
    }
    
    const result = await transaction(async (client) => {
      // Inserir cliente (se não existir)
      let clienteResult = await client.query(
        'SELECT id FROM clientes WHERE telefone = $1',
        [cliente_telefone]
      );
      
      let clienteId;
      if (clienteResult.rows.length === 0) {
        const newCliente = await client.query(
          'INSERT INTO clientes (nome, telefone) VALUES ($1, $2) RETURNING id',
          [cliente_nome, cliente_telefone]
        );
        clienteId = newCliente.rows[0].id;
      } else {
        clienteId = clienteResult.rows[0].id;
      }
      
      // Inserir endereço
      const enderecoResult = await client.query(`
        INSERT INTO enderecos (rua, numero, bairro, cidade, cep, complemento)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `, [
        endereco.rua,
        endereco.numero,
        endereco.bairro,
        endereco.cidade,
        endereco.cep,
        endereco.complemento || ''
      ]);
      
      const enderecoId = enderecoResult.rows[0].id;
      
      // Gerar código único
      const codigo = 'PD' + Date.now().toString().slice(-6);
      
      // Inserir pedido
      const pedidoResult = await client.query(`
        INSERT INTO pedidos (
          cliente_id, endereco_id, codigo, status, 
          data_pedido, valor_total, forma_pagamento, observacoes
        ) VALUES ($1, $2, $3, $4, NOW(), $5, $6, $7)
        RETURNING *
      `, [
        clienteId,
        enderecoId,
        codigo,
        'confirmado',
        valor_total,
        forma_pagamento,
        observacoes || ''
      ]);
      
      const pedido = pedidoResult.rows[0];
      
      // Inserir itens do pedido
      for (const item of itens) {
        await client.query(`
          INSERT INTO pedido_itens (pedido_id, produto_id, quantidade, preco_unitario, subtotal)
          VALUES ($1, $2, $3, $4, $5)
        `, [
          pedido.id,
          item.produto_id,
          item.quantidade,
          item.preco_unitario,
          item.subtotal
        ]);
      }
      
      return pedido;
    });
    
    res.status(201).json(result);
  } catch (error) {
    console.error('Erro ao criar pedido:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/pedidos/:id/status - Atualizar status do pedido
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'Status é obrigatório' });
    }
    
    const sql = `
      UPDATE pedidos 
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;
    
    const result = await query(sql, [status, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/pedidos/cliente/:telefone - Pedidos de um cliente
router.get('/cliente/:telefone', async (req, res) => {
  try {
    const { telefone } = req.params;
    
    const sql = `
      SELECT p.*, c.nome as cliente_nome
      FROM pedidos p
      JOIN clientes c ON p.cliente_id = c.id
      WHERE c.telefone = $1
      ORDER BY p.data_pedido DESC
    `;
    
    const result = await query(sql, [telefone]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
