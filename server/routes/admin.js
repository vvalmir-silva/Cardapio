const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../database');
const router = express.Router();

// Middleware para verificar JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido' });
    }
    req.user = user;
    next();
  });
}

// POST /api/admin/login - Login de administrador
router.post('/login', async (req, res) => {
  try {
    const { usuario, senha } = req.body;
    
    if (!usuario || !senha) {
      return res.status(400).json({ error: 'Usuário e senha são obrigatórios' });
    }
    
    const result = await query(
      'SELECT * FROM administradores WHERE usuario = $1',
      [usuario]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Usuário ou senha incorretos' });
    }
    
    const admin = result.rows[0];
    const validPassword = await bcrypt.compare(senha, admin.senha);
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Usuário ou senha incorretos' });
    }
    
    const token = jwt.sign(
      { id: admin.id, usuario: admin.usuario },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );
    
    res.json({
      token,
      admin: {
        id: admin.id,
        usuario: admin.usuario,
        nome: admin.nome
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/admin/dashboard - Dashboard (protegido)
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    // Estatísticas gerais
    const stats = await Promise.all([
      query('SELECT COUNT(*) as total FROM pedidos'),
      query('SELECT COUNT(*) as total FROM clientes'),
      query('SELECT COUNT(*) as total FROM produtos WHERE ativo = true'),
      query('SELECT COALESCE(SUM(valor_total), 0) as faturamento FROM pedidos WHERE status = \'entregue\'')
    ]);
    
    // Pedidos recentes
    const recentOrders = await query(`
      SELECT p.*, c.nome as cliente_nome
      FROM pedidos p
      JOIN clientes c ON p.cliente_id = c.id
      ORDER BY p.data_pedido DESC
      LIMIT 10
    `);
    
    // Produtos mais vendidos
    const topProducts = await query(`
      SELECT 
        pr.nome,
        SUM(pi.quantidade) as total_vendido,
        SUM(pi.subtotal) as faturamento
      FROM pedido_itens pi
      JOIN produtos pr ON pi.produto_id = pr.id
      GROUP BY pr.id, pr.nome
      ORDER BY total_vendido DESC
      LIMIT 5
    `);
    
    res.json({
      stats: {
        orders: parseInt(stats[0].rows[0].total),
        clients: parseInt(stats[1].rows[0].total),
        products: parseInt(stats[2].rows[0].total),
        revenue: parseFloat(stats[3].rows[0].faturamento)
      },
      recentOrders: recentOrders.rows,
      topProducts: topProducts.rows
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/admin/pedidos - Listar pedidos com filtros (protegido)
router.get('/pedidos', authenticateToken, async (req, res) => {
  try {
    const { status, data_inicio, data_fim, cliente_nome, limit = 50, offset = 0 } = req.query;
    
    let sql = `
      SELECT 
        p.*,
        c.nome as cliente_nome,
        c.telefone as cliente_telefone
      FROM pedidos p
      JOIN clientes c ON p.cliente_id = c.id
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
    
    if (cliente_nome) {
      sql += ' AND c.nome ILIKE $' + (params.length + 1);
      params.push('%' + cliente_nome + '%');
    }
    
    sql += ' ORDER BY p.data_pedido DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);
    
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/admin/pedidos/:id/status - Atualizar status do pedido (protegido)
router.put('/pedidos/:id/status', authenticateToken, async (req, res) => {
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

// POST /api/admin/administradores - Criar novo administrador (protegido)
router.post('/administradores', authenticateToken, async (req, res) => {
  try {
    const { usuario, senha, nome } = req.body;
    
    if (!usuario || !senha || !nome) {
      return res.status(400).json({ error: 'Usuário, senha e nome são obrigatórios' });
    }
    
    // Verificar se usuário já existe
    const existingAdmin = await query(
      'SELECT id FROM administradores WHERE usuario = $1',
      [usuario]
    );
    
    if (existingAdmin.rows.length > 0) {
      return res.status(409).json({ error: 'Usuário já existe' });
    }
    
    // Hash da senha
    const hashedPassword = await bcrypt.hash(senha, 10);
    
    const sql = `
      INSERT INTO administradores (usuario, senha, nome)
      VALUES ($1, $2, $3)
      RETURNING id, usuario, nome, created_at
    `;
    
    const result = await query(sql, [usuario, hashedPassword, nome]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/admin/relatorios/vendas - Relatório de vendas (protegido)
router.get('/relatorios/vendas', authenticateToken, async (req, res) => {
  try {
    const { data_inicio, data_fim } = req.query;
    
    let sql = `
      SELECT 
        DATE(data_pedido) as data,
        COUNT(*) as total_pedidos,
        COALESCE(SUM(valor_total), 0) as faturamento,
        AVG(valor_total) as ticket_medio
      FROM pedidos
      WHERE status IN ('entregue', 'confirmado')
    `;
    const params = [];
    
    if (data_inicio) {
      sql += ' AND DATE(data_pedido) >= $' + (params.length + 1);
      params.push(data_inicio);
    }
    
    if (data_fim) {
      sql += ' AND DATE(data_pedido) <= $' + (params.length + 1);
      params.push(data_fim);
    }
    
    sql += ' GROUP BY DATE(data_pedido) ORDER BY DATE(data_pedido) DESC';
    
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
