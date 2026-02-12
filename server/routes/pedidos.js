const express = require('express');
const { query, transaction } = require('../database');
const router = express.Router();

// GET /api/pedidos - Listar todos os pedidos (admin)
router.get('/', async (req, res) => {
  try {
    const { status, data_inicio, data_fim, limit = 50, offset = 0 } = req.query;
    
    let sql = 
      SELECT 
        p.*,
        c.nome as cliente_nome,
        c.telefone as cliente_telefone,
        e.rua, e.numero, e.bairro, e.cidade, e.cep
      FROM pedidos p
      LEFT JOIN clientes c ON p.cliente_id = c.id
      LEFT JOIN enderecos e ON p.endereco_id = e.id
      WHERE 1=1
    ;
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
    
    // Buscar itens de cada pedido
    for (let pedido of result.rows) {
      const itensSql = 
        SELECT pi.*, pr.nome as produto_nome
        FROM pedido_itens pi
        JOIN produtos pr ON pi.produto_id = pr.id
        WHERE pi.pedido_id = 
      ;
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
    
    const sql = 
      SELECT 
        p.*,
        c.nome as cliente_nome,
        c.telefone as cliente_telefone,
        e.rua, e.numero, e.bairro, e.cidade, e.cep, e.complemento
      FROM pedidos p
      LEFT JOIN clientes c ON p.cliente_id = c.id
      LEFT JOIN enderecos e ON p.endereco_id = e.id
      WHERE p.id = 
    ;
    
    const result = await query(sql, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }
    
    const pedido = result.rows[0];
    
    // Buscar itens
    const itensSql = 
      SELECT pi.*, pr.nome as produto_nome
      FROM pedido_itens pi
      JOIN produtos pr ON pi.produto_id = pr.id
      WHERE pi.pedido_id = 
    ;
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
    
    const sql = 
      SELECT 
        p.*,
        c.nome as cliente_nome,
        c.telefone as cliente_telefone,
        e.rua, e.numero, e.bairro, e.cidade, e.cep, e.complemento
      FROM pedidos p
      LEFT JOIN clientes c ON p.cliente_id = c.id
      LEFT JOIN enderecos e ON p.endereco_id = e.id
      WHERE p.codigo = 
    ;
    
    const result = await query(sql, [codigo]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }
    
    const pedido = result.rows[0];
    
    // Buscar itens
    const itensSql = 
      SELECT pi.*, pr.nome as produto_nome
      FROM pedido_itens pi
      JOIN produtos pr ON pi.produto_id = pr.id
      WHERE pi.pedido_id = 
    ;
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
      forma_pagamento
    } = req.body;
    
    if (!cliente_nome || !cliente_telefone || !itens || itens.length === 0) {
      return res.status(400).json({ error: 'Dados obrigatórios faltando' });
    }
    
    const result = await transaction(async (client) => {
      // Verificar/criar cliente
      let clienteResult = await client.query(
        'SELECT id FROM clientes WHERE telefone = ',
        [cliente_telefone]
      );
      
      let cliente_id;
      if (clienteResult.rows.length === 0) {
        const newCliente = await client.query(
          'INSERT INTO clientes (nome, telefone) VALUES (, ) RETURNING id',
          [cliente_nome, cliente_telefone]
        );
        cliente_id = newCliente.rows[0].id;
      } else {
        cliente_id = clienteResult.rows[0].id;
        // Atualizar nome se necessário
        await client.query(
          'UPDATE clientes SET nome =  WHERE id = ',
          [cliente_nome, cliente_id]
        );
      }
      
      // Verificar/criar endereço
      let endereco_id;
      if (endereco) {
        const enderecoResult = await client.query(
          'INSERT INTO enderecos (cliente_id, cep, rua, numero, complemento, bairro, cidade, estado, principal) VALUES (, , , , , , , , true) RETURNING id',
          [
            cliente_id,
            endereco.cep || '',
            endereco.rua,
            endereco.numero,
            endereco.complemento || '',
            endereco.bairro || '',
            endereco.cidade || '',
            endereco.estado || 'SP'
          ]
        );
        endereco_id = enderecoResult.rows[0].id;
      }
      
      // Calcular totais
      let subtotal = 0;
      for (let item of itens) {
        subtotal += item.preco_unitario * item.quantidade;
      }
      
      const taxa_entrega = 0; // Configurar taxa se necessário
      const desconto = 0;
      const total = subtotal + taxa_entrega - desconto;
      
      // Criar pedido
      const pedidoResult = await client.query(
        'INSERT INTO pedidos (cliente_id, endereco_id, subtotal, taxa_entrega, desconto, total, observacoes, forma_pagamento) VALUES (, , , , , , , ) RETURNING *',
        [cliente_id, endereco_id, subtotal, taxa_entrega, desconto, total, observacoes, forma_pagamento]
      );
      
      const pedido = pedidoResult.rows[0];
      
      // Inserir itens do pedido
      for (let item of itens) {
        await client.query(
          'INSERT INTO pedido_itens (pedido_id, produto_id, quantidade, preco_unitario, subtotal, observacoes) VALUES (, , , , , )',
          [pedido.id, item.produto_id, item.quantidade, item.preco_unitario, item.subtotal, item.observacoes]
        );
      }
      
      return pedido;
    });
    
    // Buscar pedido completo
    const pedidoCompleto = await query(
      'SELECT p.*, c.nome as cliente_nome, c.telefone as cliente_telefone FROM pedidos p LEFT JOIN clientes c ON p.cliente_id = c.id WHERE p.id = ',
      [result.id]
    );
    
    res.status(201).json(pedidoCompleto.rows[0]);
  } catch (error) {
    console.error('Erro ao criar pedido:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/pedidos/:id/status - Atualizar status do pedido
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, usuario_responsavel } = req.body;
    
    const validStatus = ['confirmado', 'preparando', 'saiu-entrega', 'entregue', 'cancelado'];
    if (!validStatus.includes(status)) {
      return res.status(400).json({ error: 'Status inválido' });
    }
    
    const sql = 
      UPDATE pedidos 
      SET status = , updated_at = CURRENT_TIMESTAMP
      WHERE id = 
      RETURNING *
    ;
    
    const result = await query(sql, [status, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }
    
    // Registrar log de alteração
    await query(
      'INSERT INTO pedido_status_log (pedido_id, status_novo, usuario_responsavel) VALUES (, , )',
      [id, status, usuario_responsavel || 'system']
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/pedidos/estatisticas - Estatísticas dos pedidos
router.get('/estatisticas/daily', async (req, res) => {
  try {
    const { data } = req.query;
    const dataConsulta = data || new Date().toISOString().split('T')[0];
    
    const sql = 
      SELECT 
        COUNT(*) as total_pedidos,
        COUNT(CASE WHEN status = 'entregue' THEN 1 END) as pedidos_entregues,
        COUNT(CASE WHEN status = 'cancelado' THEN 1 END) as pedidos_cancelados,
        COUNT(CASE WHEN status = 'preparando' THEN 1 END) as pedidos_preparando,
        COUNT(CASE WHEN status = 'saiu-entrega' THEN 1 END) as pedidos_entrega,
        COALESCE(SUM(total), 0) as faturamento_total,
        COALESCE(AVG(total), 0) as ticket_medio
      FROM pedidos 
      WHERE DATE(data_pedido) = 
    ;
    
    const result = await query(sql, [dataConsulta]);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
