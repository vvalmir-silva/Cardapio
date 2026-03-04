const express = require('express');
const mongoose = require('mongoose');
const { Cliente, Pedido } = require('../database');
const router = express.Router();

// GET /api/clientes - Listar clientes (admin)
router.get('/', async (req, res) => {
  try {
    const { nome, telefone, limit = 50, offset = 0 } = req.query;
    
    let matchStage = {};
    
    if (nome) {
      matchStage.nome = { $regex: nome, $options: 'i' };
    }
    
    if (telefone) {
      matchStage.telefone = telefone;
    }
    
    const clientes = await Cliente.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: 'pedidos',
          localField: '_id',
          foreignField: 'cliente_id',
          as: 'pedidos'
        }
      },
      {
        $addFields: {
          total_pedidos: { $size: '$pedidos' },
          total_gasto: {
            $sum: {
              $map: {
                input: '$pedidos',
                as: 'pedido',
                in: '$$pedido.total'
              }
            }
          }
        }
      },
      { $project: { pedidos: 0 } },
      { $sort: { nome: 1 } },
      { $skip: parseInt(offset) },
      { $limit: parseInt(limit) }
    ]);
    
    res.json(clientes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/clientes/:id - Obter cliente por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const clientes = await Cliente.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(id) } },
      {
        $lookup: {
          from: 'pedidos',
          localField: '_id',
          foreignField: 'cliente_id',
          as: 'pedidos'
        }
      },
      {
        $addFields: {
          total_pedidos: { $size: '$pedidos' },
          total_gasto: {
            $sum: {
              $map: {
                input: '$pedidos',
                as: 'pedido',
                in: '$$pedido.total'
              }
            }
          }
        }
      },
      { $project: { pedidos: 0 } }
    ]);
    
    if (clientes.length === 0) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }
    
    res.json(clientes[0]);
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
    const existingClient = await Cliente.findOne({ telefone });
    
    if (existingClient) {
      return res.status(409).json({ error: 'Cliente com este telefone já existe' });
    }
    
    const novoCliente = new Cliente({
      nome,
      telefone,
      email: email || null
    });
    
    await novoCliente.save();
    res.status(201).json(novoCliente);
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
    
    const cliente = await Cliente.findByIdAndUpdate(
      id,
      {
        nome,
        telefone,
        email: email || null,
        updated_at: new Date()
      },
      { new: true, runValidators: true }
    );
    
    if (!cliente) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }
    
    res.json(cliente);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/clientes/telefone/:telefone - Buscar cliente por telefone
router.get('/telefone/:telefone', async (req, res) => {
  try {
    const { telefone } = req.params;
    
    const clientes = await Cliente.aggregate([
      { $match: { telefone } },
      {
        $lookup: {
          from: 'pedidos',
          localField: '_id',
          foreignField: 'cliente_id',
          as: 'pedidos'
        }
      },
      {
        $addFields: {
          total_pedidos: { $size: '$pedidos' },
          total_gasto: {
            $sum: {
              $map: {
                input: '$pedidos',
                as: 'pedido',
                in: '$$pedido.total'
              }
            }
          }
        }
      },
      { $project: { pedidos: 0 } }
    ]);
    
    if (clientes.length === 0) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }
    
    res.json(clientes[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
