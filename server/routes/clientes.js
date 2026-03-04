const express = require('express');
const { query } = require('../database');
const router = express.Router();

// GET /api/clientes - Listar clientes (admin)
router.get('/', async (req, res) => {
  try {
    const { nome, telefone, limit = 50, offset = 0 } = req.query;
    
    let sql = `
      SELECT 
        c.*,
        COUNT(p.id) as total_pedidos,
        COALESCE(SUM(p.valor_total), 0) as total_gasto
      FROM clientes c
      LEFT JOIN pedidos p ON c.id = p.cliente_id
      WHERE 1=1
    `;
    const params = [];
    
    if (nome) {
      sql += ' AND c.nome ILIKE $' + (params.length + 1);
      params.push('%' + nome + '%');
    }
    
    if (telefone) {
      sql += ' AND c.telefone = $' + (params.length + 1);
      params.push(telefone);
    }
    
    sql += ' GROUP BY c.id ORDER BY c.nome LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);
    
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/clientes/:id - Obter cliente por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const sql = `
      SELECT 
        c.*,
        COUNT(p.id) as total_pedidos,
        COALESCE(SUM(p.valor_total), 0) as total_gasto
      FROM clientes c
      LEFT JOIN pedidos p ON c.id = p.cliente_id
      WHERE c.id = $1
      GROUP BY c.id
    `;
    
    const result = await query(sql, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/clientes - Criar novo cliente
router.post('/', async (req, res) => {
  try {
    const { nome, telefone, email } = req.body;
    
    if (!nome || !telefone) {
      return res.status(400).json({ error: 'Nome e telefone são obrigatórios' });
    }
    
    // Verificar se cliente já existe
    const existingClient = await query(
      'SELECT id FROM clientes WHERE telefone = $1',
      [telefone]
    );
    
    if (existingClient.rows.length > 0) {
      return res.status(409).json({ error: 'Cliente com este telefone já existe' });
    }
    
    const sql = `
      INSERT INTO clientes (nome, telefone, email)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    
    const result = await query(sql, [nome, telefone, email || null]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/clientes/:id - Atualizar cliente
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, telefone, email } = req.body;
    
    if (!nome || !telefone) {
      return res.status(400).json({ error: 'Nome e telefone são obrigatórios' });
    }
    
    const sql = `
      UPDATE clientes 
      SET nome = $1, telefone = $2, email = $3, updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *
    `;
    
    const result = await query(sql, [nome, telefone, email || null, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/clientes/telefone/:telefone - Buscar cliente por telefone
router.get('/telefone/:telefone', async (req, res) => {
  try {
    const { telefone } = req.params;
    
    const sql = `
      SELECT 
        c.*,
        COUNT(p.id) as total_pedidos,
        COALESCE(SUM(p.valor_total), 0) as total_gasto
      FROM clientes c
      LEFT JOIN pedidos p ON c.id = p.cliente_id
      WHERE c.telefone = $1
      GROUP BY c.id
    `;
    
    const result = await query(sql, [telefone]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
