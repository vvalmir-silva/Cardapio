const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { UsuarioAdmin, Pedido, Cliente, Produto } = require('../database');
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
    
    const admin = await UsuarioAdmin.findOne({ usuario });
    
    if (!admin) {
      return res.status(401).json({ error: 'Usuário ou senha incorretos' });
    }
    
    const validPassword = await bcrypt.compare(senha, admin.senha);
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Usuário ou senha incorretos' });
    }
    
    const token = jwt.sign(
      { id: admin._id, usuario: admin.usuario },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );
    
    res.json({
      token,
      admin: {
        id: admin._id,
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
    const [totalPedidos, totalClientes, totalProdutos, faturamento] = await Promise.all([
      Pedido.countDocuments(),
      Cliente.countDocuments(),
      Produto.countDocuments({ ativo: true }),
      Pedido.aggregate([
        { $match: { status: 'entregue' } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ])
    ]);
    
    // Pedidos recentes
    const recentOrders = await Pedido.find({})
      .populate('cliente_id', 'nome telefone')
      .sort({ data_pedido: -1 })
      .limit(10);
    
    // Produtos mais vendidos
    const topProducts = await Pedido.aggregate([
      { $unwind: '$itens' },
      {
        $lookup: {
          from: 'produtos',
          localField: 'itens.produto_id',
          foreignField: '_id',
          as: 'produto'
        }
      },
      { $unwind: '$produto' },
      {
        $group: {
          _id: '$produto._id',
          nome: { $first: '$produto.nome' },
          total_vendido: { $sum: '$itens.quantidade' },
          faturamento: { $sum: '$itens.subtotal' }
        }
      },
      { $sort: { total_vendido: -1 } },
      { $limit: 5 }
    ]);
    
    res.json({
      stats: {
        orders: totalPedidos,
        clients: totalClientes,
        products: totalProdutos,
        revenue: faturamento.length > 0 ? faturamento[0].total : 0
      },
      recentOrders,
      topProducts
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/admin/pedidos - Listar pedidos com filtros (protegido)
router.get('/pedidos', authenticateToken, async (req, res) => {
  try {
    const { status, data_inicio, data_fim, cliente_nome, limit = 50, offset = 0 } = req.query;
    
    let matchStage = {};
    
    if (status) {
      matchStage.status = status;
    }
    
    if (data_inicio || data_fim) {
      matchStage.data_pedido = {};
      if (data_inicio) {
        matchStage.data_pedido.$gte = new Date(data_inicio);
      }
      if (data_fim) {
        matchStage.data_pedido.$lte = new Date(data_fim);
      }
    }
    
    if (cliente_nome) {
      matchStage['cliente_id.nome'] = { $regex: cliente_nome, $options: 'i' };
    }
    
    const pedidos = await Pedido.find(matchStage)
      .populate('cliente_id', 'nome telefone')
      .sort({ data_pedido: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset));
    
    res.json(pedidos);
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
    
    const pedido = await Pedido.findByIdAndUpdate(
      id,
      { status, updated_at: new Date() },
      { new: true, runValidators: true }
    );
    
    if (!pedido) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }
    
    res.json(pedido);
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
    const existingAdmin = await UsuarioAdmin.findOne({ usuario });
    
    if (existingAdmin) {
      return res.status(409).json({ error: 'Usuário já existe' });
    }
    
    // Hash da senha
    const hashedPassword = await bcrypt.hash(senha, 10);
    
    const novoAdmin = new UsuarioAdmin({
      usuario,
      senha: hashedPassword,
      nome
    });
    
    await novoAdmin.save();
    
    // Remover senha da resposta
    const adminResponse = novoAdmin.toJSON();
    
    res.status(201).json(adminResponse);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/admin/relatorios/vendas - Relatório de vendas (protegido)
router.get('/relatorios/vendas', authenticateToken, async (req, res) => {
  try {
    const { data_inicio, data_fim } = req.query;
    
    let matchStage = {
      status: { $in: ['entregue', 'confirmado'] }
    };
    
    if (data_inicio || data_fim) {
      matchStage.data_pedido = {};
      if (data_inicio) {
        matchStage.data_pedido.$gte = new Date(data_inicio);
      }
      if (data_fim) {
        matchStage.data_pedido.$lte = new Date(data_fim);
      }
    }
    
    const relatorio = await Pedido.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$data_pedido'
            }
          },
          data: { $first: { $dateToString: { format: '%Y-%m-%d', date: '$data_pedido' } } },
          total_pedidos: { $sum: 1 },
          faturamento: { $sum: '$total' },
          ticket_medio: { $avg: '$total' }
        }
      },
      { $sort: { '_id': -1 } },
      {
        $project: {
          _id: 0,
          data: '$_id',
          total_pedidos: 1,
          faturamento: 1,
          ticket_medio: 1
        }
      }
    ]);
    
    res.json(relatorio);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
