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

// POST /api/admin/login - Login do administrador
router.post('/login', async (req, res) => {
  try {
    const { usuario, senha } = req.body;
    
    if (!usuario || !senha) {
      return res.status(400).json({ error: 'Usuário e senha são obrigatórios' });
    }
    
    // Buscar usuário no banco
    const sql = 'SELECT * FROM usuarios_admin WHERE usuario =  AND ativo = true';
    const result = await query(sql, [usuario]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Usuário ou senha inválidos' });
    }
    
    const user = result.rows[0];
    
    // Verificar senha
    const validPassword = await bcrypt.compare(senha, user.senha);
    if (!validPassword) {
      return res.status(401).json({ error: 'Usuário ou senha inválidos' });
    }
    
    // Atualizar último login
    await query('UPDATE usuarios_admin SET ultimo_login = CURRENT_TIMESTAMP WHERE id = ', [user.id]);
    
    // Gerar token JWT
    const token = jwt.sign(
      { 
        id: user.id, 
        usuario: user.usuario, 
        nome: user.nome,
        nivel_acesso: user.nivel_acesso 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );
    
    // Remover senha do retorno
    delete user.senha;
    
    res.json({
      user,
      token,
      expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    });
    
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/admin/verify - Verificar token
router.get('/verify', authenticateToken, async (req, res) => {
  try {
    const sql = 'SELECT id, nome, email, usuario, nivel_acesso, ultimo_login FROM usuarios_admin WHERE id =  AND ativo = true';
    const result = await query(sql, [req.user.id]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Usuário não encontrado' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/admin/dashboard - Dados do dashboard
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    const hoje = new Date().toISOString().split('T')[0];
    
    // Estatísticas do dia
    const statsSql = 
      SELECT 
        COUNT(*) as pedidos_hoje,
        COUNT(CASE WHEN status = 'entregue' THEN 1 END) as concluidos_hoje,
        COUNT(CASE WHEN status = 'preparando' THEN 1 END) as preparando_hoje,
        COALESCE(SUM(CASE WHEN status != 'cancelado' THEN total END), 0) as faturamento_hoje
      FROM pedidos 
      WHERE DATE(data_pedido) = 
    ;
    const statsResult = await query(statsSql, [hoje]);
    
    // Pedidos recentes
    const pedidosSql = 
      SELECT 
        p.id, p.codigo, p.status, p.total, p.data_pedido,
        c.nome as cliente_nome,
        c.telefone as cliente_telefone
      FROM pedidos p
      LEFT JOIN clientes c ON p.cliente_id = c.id
      WHERE DATE(p.data_pedido) = 
      ORDER BY p.data_pedido DESC
      LIMIT 10
    ;
    const pedidosResult = await query(pedidosSql, [hoje]);
    
    // Produtos mais vendidos
    const produtosSql = 
      SELECT 
        pr.nome,
        SUM(pi.quantidade) as total_vendido,
        SUM(pi.subtotal) as faturamento
      FROM produtos pr
      JOIN pedido_itens pi ON pr.id = pi.produto_id
      JOIN pedidos p ON pi.pedido_id = p.id
      WHERE DATE(p.data_pedido) =  AND p.status != 'cancelado'
      GROUP BY pr.id, pr.nome
      ORDER BY total_vendido DESC
      LIMIT 5
    ;
    const produtosResult = await query(produtosSql, [hoje]);
    
    res.json({
      estatisticas: statsResult.rows[0],
      pedidos_recentes: pedidosResult.rows,
      produtos_mais_vendidos: produtosResult.rows
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/admin/usuarios - Listar usuários (admin)
router.get('/usuarios', authenticateToken, async (req, res) => {
  try {
    const sql = 
      SELECT id, nome, email, usuario, nivel_acesso, ativo, ultimo_login, created_at
      FROM usuarios_admin
      ORDER BY created_at DESC
    ;
    
    const result = await query(sql);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/admin/usuarios - Criar usuário (admin)
router.post('/usuarios', authenticateToken, async (req, res) => {
  try {
    const { nome, email, usuario, senha, nivel_acesso = 'admin' } = req.body;
    
    if (!nome || !usuario || !senha) {
      return res.status(400).json({ error: 'Nome, usuário e senha são obrigatórios' });
    }
    
    // Verificar se usuário já existe
    const existingSql = 'SELECT id FROM usuarios_admin WHERE usuario =  OR email = ';
    const existingResult = await query(existingSql, [usuario, email]);
    
    if (existingResult.rows.length > 0) {
      return res.status(409).json({ error: 'Usuário ou email já existe' });
    }
    
    // Hash da senha
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(senha, saltRounds);
    
    const sql = 
      INSERT INTO usuarios_admin (nome, email, usuario, senha, nivel_acesso)
      VALUES (, , , , )
      RETURNING id, nome, email, usuario, nivel_acesso, ativo, created_at
    ;
    
    const result = await query(sql, [nome, email, usuario, hashedPassword, nivel_acesso]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/admin/usuarios/:id - Atualizar usuário
router.put('/usuarios/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, email, nivel_acesso, ativo } = req.body;
    
    const sql = 
      UPDATE usuarios_admin 
      SET nome = , email = , nivel_acesso = , ativo = , updated_at = CURRENT_TIMESTAMP
      WHERE id = 
      RETURNING id, nome, email, usuario, nivel_acesso, ativo, updated_at
    ;
    
    const result = await query(sql, [nome, email, nivel_acesso, ativo, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/admin/usuarios/:id/senha - Alterar senha
router.put('/usuarios/:id/senha', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { senha_atual, senha_nova } = req.body;
    
    if (!senha_atual || !senha_nova) {
      return res.status(400).json({ error: 'Senha atual e nova são obrigatórias' });
    }
    
    // Buscar usuário e verificar senha atual
    const userSql = 'SELECT senha FROM usuarios_admin WHERE id = ';
    const userResult = await query(userSql, [id]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    const validPassword = await bcrypt.compare(senha_atual, userResult.rows[0].senha);
    if (!validPassword) {
      return res.status(401).json({ error: 'Senha atual incorreta' });
    }
    
    // Hash da nova senha
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(senha_nova, saltRounds);
    
    const sql = 'UPDATE usuarios_admin SET senha = , updated_at = CURRENT_TIMESTAMP WHERE id = ';
    await query(sql, [hashedPassword, id]);
    
    res.json({ message: 'Senha alterada com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/admin/configuracoes - Obter configurações
router.get('/configuracoes', authenticateToken, async (req, res) => {
  try {
    const sql = 'SELECT * FROM configuracoes ORDER BY chave';
    const result = await query(sql);
    
    // Converter para objeto chave-valor
    const config = {};
    result.rows.forEach(row => {
      config[row.chave] = row.tipo === 'json' ? JSON.parse(row.valor) : row.valor;
    });
    
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/admin/configuracoes - Atualizar configurações
router.put('/configuracoes', authenticateToken, async (req, res) => {
  try {
    const configuracoes = req.body;
    
    for (const [chave, valor] of Object.entries(configuracoes)) {
      const valorStr = typeof valor === 'object' ? JSON.stringify(valor) : String(valor);
      
      await query(
        INSERT INTO configuracoes (chave, valor, tipo) 
        VALUES (, , )
        ON CONFLICT (chave) 
        DO UPDATE SET 
          valor = EXCLUDED.valor, 
          tipo = EXCLUDED.tipo,
          updated_at = CURRENT_TIMESTAMP
      , [chave, valorStr, typeof valor === 'object' ? 'json' : 'string']);
    }
    
    res.json({ message: 'Configurações atualizadas com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
