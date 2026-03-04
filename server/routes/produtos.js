const express = require('express');
const { query } = require('../database');
const router = express.Router();

// GET /api/produtos - Listar todos os produtos
router.get('/', async (req, res) => {
  try {
    const { categoria_id, ativo } = req.query;
    
    let sql = `
      SELECT p.*, c.nome as categoria_nome 
      FROM produtos p 
      LEFT JOIN categorias c ON p.categoria_id = c.id
      WHERE 1=1
    `;
    const params = [];
    
    if (categoria_id) {
      sql += ' AND p.categoria_id = $' + (params.length + 1);
      params.push(categoria_id);
    }
    
    if (ativo !== undefined) {
      sql += ' AND p.ativo = $' + (params.length + 1);
      params.push(ativo === 'true');
    }
    
    sql += ' ORDER BY p.nome';
    
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/produtos/:id - Obter produto por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const sql = `
      SELECT p.*, c.nome as categoria_nome 
      FROM produtos p 
      LEFT JOIN categorias c ON p.categoria_id = c.id
      WHERE p.id = $1
    `;
    
    const result = await query(sql, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/produtos/categorias - Listar categorias com produtos
router.get('/categorias/all', async (req, res) => {
  try {
    const sql = `
      SELECT 
        c.*,
        COUNT(p.id) as total_produtos
      FROM categorias c
      LEFT JOIN produtos p ON c.id = p.categoria_id AND p.ativo = true
      WHERE c.ativo = true
      GROUP BY c.id
      ORDER BY c.ordem_exibicao
    `;
    
    const result = await query(sql);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/produtos - Criar novo produto (admin)
router.post('/', async (req, res) => {
  try {
    const {
      nome,
      descricao,
      preco,
      imagem_url,
      categoria_id,
      tempo_preparo,
      ingredientes
    } = req.body;
    
    if (!nome || !preco) {
      return res.status(400).json({ error: 'Nome e preço são obrigatórios' });
    }
    
    const sql = `
      INSERT INTO produtos (nome, descricao, preco, imagem_url, categoria_id, tempo_preparo, ingredientes)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    
    const result = await query(sql, [
      nome,
      descricao,
      preco,
      imagem_url,
      categoria_id || null,
      tempo_preparo || 15,
      ingredientes ? JSON.stringify(ingredientes) : null
    ]);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/produtos/:id - Atualizar produto (admin)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nome,
      descricao,
      preco,
      imagem_url,
      categoria_id,
      ativo,
      destaque,
      tempo_preparo,
      ingredientes
    } = req.body;
    
    const sql = `
      UPDATE produtos 
      SET nome = $1, descricao = $2, preco = $3, imagem_url = $4, 
          categoria_id = $5, ativo = $6, destaque = $7, 
          tempo_preparo = $8, ingredientes = $9, updated_at = CURRENT_TIMESTAMP
      WHERE id = $10
      RETURNING *
    `;
    
    const result = await query(sql, [
      nome,
      descricao,
      preco,
      imagem_url,
      categoria_id || null,
      ativo !== undefined ? ativo : true,
      destaque || false,
      tempo_preparo || 15,
      ingredientes ? JSON.stringify(ingredientes) : null,
      id
    ]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/produtos/:id - Desativar produto (admin)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const sql = `
      UPDATE produtos 
      SET ativo = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await query(sql, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    
    res.json({ message: 'Produto desativado com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
