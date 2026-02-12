const express = require('express');
const { query } = require('../database');
const router = express.Router();

// GET /api/clientes - Listar clientes (admin)
router.get('/', async (req, res) => {
  try {
    const { nome, telefone, limit = 50, offset = 0 } = req.query;
    
    let sql = 
      SELECT 
        c.*,
        COUNT(p.id) as total_pedidos,
        COALESCE(SUM(p.total), 0) as total_gasto
      FROM clientes c
      LEFT JOIN pedidos p ON c.id = p.cliente_id
      WHERE 1=1
    ;
    const params = [];
    
    if (nome) {
      sql += ' AND c.nome ILIKE $' + (params.length + 1);
      params.push('%' + nome + '%');
    }
    
    if (telefone) {
      sql += ' AND c.telefone ILIKE $' + (params.length + 1);
      params.push('%' + telefone + '%');
    }
    
    sql += ' GROUP BY c.id ORDER BY c.created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
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
    
    const sql = 
      SELECT 
        c.*,
        COUNT(p.id) as total_pedidos,
        COALESCE(SUM(p.total), 0) as total_gasto
      FROM clientes c
      LEFT JOIN pedidos p ON c.id = p.cliente_id
      WHERE c.id = 
      GROUP BY c.id
    ;
    
    const result = await query(sql, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }
    
    // Buscar endereços do cliente
    const enderecosSql = 'SELECT * FROM enderecos WHERE cliente_id =  ORDER BY principal DESC, created_at DESC';
    const enderecosResult = await query(enderecosSql, [id]);
    
    const cliente = result.rows[0];
    cliente.enderecos = enderecosResult.rows;
    
    res.json(cliente);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/clientes/telefone/:telefone - Buscar cliente por telefone
router.get('/telefone/:telefone', async (req, res) => {
  try {
    const { telefone } = req.params;
    
    const sql = 'SELECT * FROM clientes WHERE telefone = ';
    const result = await query(sql, [telefone]);
    
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
    const { nome, telefone, email, data_nascimento } = req.body;
    
    if (!nome || !telefone) {
      return res.status(400).json({ error: 'Nome e telefone são obrigatórios' });
    }
    
    // Verificar se cliente já existe
    const existingSql = 'SELECT id FROM clientes WHERE telefone = ';
    const existingResult = await query(existingSql, [telefone]);
    
    if (existingResult.rows.length > 0) {
      return res.status(409).json({ error: 'Cliente com este telefone já existe' });
    }
    
    const sql = 
      INSERT INTO clientes (nome, telefone, email, data_nascimento)
      VALUES (, , , )
      RETURNING *
    ;
    
    const result = await query(sql, [
      nome,
      telefone,
      email || null,
      data_nascimento || null
    ]);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/clientes/:id - Atualizar cliente
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, telefone, email, data_nascimento } = req.body;
    
    if (!nome || !telefone) {
      return res.status(400).json({ error: 'Nome e telefone são obrigatórios' });
    }
    
    const sql = 
      UPDATE clientes 
      SET nome = , telefone = , email = , data_nascimento = , updated_at = CURRENT_TIMESTAMP
      WHERE id = 
      RETURNING *
    ;
    
    const result = await query(sql, [nome, telefone, email, data_nascimento, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/clientes/:id/enderecos - Adicionar endereço ao cliente
router.post('/:id/enderecos', async (req, res) => {
  try {
    const { id } = req.params;
    const { cep, rua, numero, complemento, bairro, cidade, estado, ponto_referencia, principal } = req.body;
    
    if (!rua || !numero || !cidade || !estado) {
      return res.status(400).json({ error: 'Rua, número, cidade e estado são obrigatórios' });
    }
    
    // Se for principal, desmarcar outros endereços
    if (principal) {
      await query('UPDATE enderecos SET principal = false WHERE cliente_id = ', [id]);
    }
    
    const sql = 
      INSERT INTO enderecos (cliente_id, cep, rua, numero, complemento, bairro, cidade, estado, ponto_referencia, principal)
      VALUES (, , , , , , , , , )
      RETURNING *
    ;
    
    const result = await query(sql, [
      id,
      cep || '',
      rua,
      numero,
      complemento || '',
      bairro || '',
      cidade,
      estado,
      ponto_referencia || '',
      principal || false
    ]);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
