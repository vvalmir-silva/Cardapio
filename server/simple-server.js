const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { testConnection } = require('./database');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware básico
app.use(cors());
app.use(express.json());

// Rota de teste
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    message: 'API Artesanal da Nega funcionando!'
  });
});

// Rota de produtos (específica)
app.get('/api/produtos', async (req, res) => {
  try {
    const { query } = require('./database');
    const result = await query('SELECT p.*, c.nome as categoria_nome FROM produtos p LEFT JOIN categorias c ON p.categoria_id = c.id WHERE p.ativo = true ORDER BY p.nome');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rota de buscar pedidos por nome
app.get('/api/pedidos', async (req, res) => {
  try {
    const { query } = require('./database');
    const { cliente_nome } = req.query;
    
    let sql = `
      SELECT 
        p.*,
        c.nome as cliente_nome,
        c.telefone as cliente_telefone
      FROM pedidos p
      LEFT JOIN clientes c ON p.cliente_id = c.id
    `;
    const params = [];
    
    if (cliente_nome) {
      sql += ' WHERE c.nome ILIKE $1';
      params.push('%' + cliente_nome + '%');
    }
    
    sql += ' ORDER BY p.data_pedido DESC';
    
    const result = await query(sql, params);
    
    // Buscar itens para cada pedido
    for (let pedido of result.rows) {
      const itensResult = await query(`
        SELECT pi.*, pr.nome as produto_nome
        FROM pedido_itens pi
        JOIN produtos pr ON pi.produto_id = pr.id
        WHERE pi.pedido_id = $1
      `, [pedido.id]);
      pedido.itens = itensResult.rows;
    }
    
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rota de criar pedido
app.post('/api/pedidos', async (req, res) => {
  try {
    const { query } = require('./database');
    const { cliente_nome, cliente_telefone, endereco, itens, observacoes, forma_pagamento } = req.body;
    
    if (!cliente_nome || !cliente_telefone || !itens || itens.length === 0) {
      return res.status(400).json({ error: 'Dados obrigatórios faltando' });
    }
    
    // Verificar/criar cliente
    let clienteResult = await query('SELECT id FROM clientes WHERE telefone = $1', [cliente_telefone]);
    
    let cliente_id;
    if (clienteResult.rows.length === 0) {
      const newCliente = await query('INSERT INTO clientes (nome, telefone) VALUES ($1, $2) RETURNING id', [cliente_nome, cliente_telefone]);
      cliente_id = newCliente.rows[0].id;
    } else {
      cliente_id = clienteResult.rows[0].id;
    }
    
    // Calcular totais
    let subtotal = 0;
    for (let item of itens) {
      subtotal += item.preco_unitario * item.quantidade;
    }
    
    const taxa_entrega = 0;
    const desconto = 0;
    const total = subtotal + taxa_entrega - desconto;
    
    // Criar pedido
    const pedidoResult = await query(
      'INSERT INTO pedidos (cliente_id, subtotal, taxa_entrega, desconto, total, observacoes, forma_pagamento, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [cliente_id, subtotal, taxa_entrega, desconto, total, observacoes, forma_pagamento, 'confirmado']
    );
    
    const pedido = pedidoResult.rows[0];
    
    // Inserir itens do pedido
    for (let item of itens) {
      await query(
        'INSERT INTO pedido_itens (pedido_id, produto_id, quantidade, preco_unitario, subtotal) VALUES ($1, $2, $3, $4, $5)',
        [pedido.id, item.produto_id, item.quantidade, item.preco_unitario, item.subtotal]
      );
    }
    
    res.status(201).json(pedido);
  } catch (error) {
    console.error('Erro ao criar pedido:', error);
    res.status(500).json({ error: error.message });
  }
});

// Rota de buscar pedido por código
app.get('/api/pedidos/codigo/:codigo', async (req, res) => {
  try {
    const { query } = require('./database');
    const { codigo } = req.params;
    
    const result = await query(`
      SELECT 
        p.*,
        c.nome as cliente_nome,
        c.telefone as cliente_telefone
      FROM pedidos p
      LEFT JOIN clientes c ON p.cliente_id = c.id
      WHERE p.codigo = $1
    `, [codigo]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }
    
    const pedido = result.rows[0];
    
    // Buscar itens
    const itensResult = await query(`
      SELECT pi.*, pr.nome as produto_nome
      FROM pedido_itens pi
      JOIN produtos pr ON pi.produto_id = pr.id
      WHERE pi.pedido_id = $1
    `, [pedido.id]);
    pedido.itens = itensResult.rows;
    
    res.json(pedido);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rota de atualizar status do pedido
app.put('/api/pedidos/:id/status', async (req, res) => {
  try {
    const { query } = require('./database');
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'Status é obrigatório' });
    }
    
    const result = await query(
      'UPDATE pedidos SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rota de cancelar pedido
app.put('/api/pedidos/:id/cancel', async (req, res) => {
  try {
    const { query } = require('./database');
    const { id } = req.params;
    
    const result = await query(
      'UPDATE pedidos SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      ['cancelado', id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Iniciar servidor
async function start() {
  try {
    console.log('🔍 Testando conexão com banco...');
    const connected = await testConnection();
    
    if (!connected) {
      console.error('❌ Falha na conexão com PostgreSQL');
      process.exit(1);
    }
    
    console.log('✅ Conexão OK!');
    console.log('🚀 Iniciando servidor...');
    
    app.listen(PORT, () => {
      console.log(`🌐 Servidor rodando em http://localhost:${PORT}`);
      console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
      console.log(`📦 Produtos: http://localhost:${PORT}/api/produtos`);
    });
    
  } catch (error) {
    console.error('❌ Erro ao iniciar:', error);
    process.exit(1);
  }
}

start();
