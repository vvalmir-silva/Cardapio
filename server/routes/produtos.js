const express = require('express');
const { Produto, Categoria } = require('../database');
const router = express.Router();

// GET /api/produtos - Listar todos os produtos
router.get('/', async (req, res) => {
  try {
    const { categoria_id, ativo } = req.query;
    
    let filter = {};
    
    if (categoria_id) {
      filter.categoria_id = categoria_id;
    }
    
    if (ativo !== undefined) {
      filter.ativo = ativo === 'true';
    }
    
    const produtos = await Produto.find(filter)
      .populate('categoria_id', 'nome descricao')
      .sort({ nome: 1 })
      .exec();
    
    res.json(produtos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/produtos/categorias/all - Listar categorias com contagem
router.get('/categorias/all', async (req, res) => {
  try {
    const categorias = await Categoria.find({ ativo: true })
      .sort({ ordem_exibicao: 1 })
      .exec();
    
    const categoriasComProdutos = await Promise.all(
      categorias.map(async (cat) => {
        const totalProdutos = await Produto.countDocuments({
          categoria_id: cat._id,
          ativo: true
        });
        
        const obj = cat.toObject();
        obj.total_produtos = totalProdutos;
        return obj;
      })
    );
    
    res.json(categoriasComProdutos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/produtos/:id - Obter produto por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const produto = await Produto.findById(id)
      .populate('categoria_id', 'nome descricao')
      .exec();
    
    if (!produto) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    
    res.json(produto);
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
    
    const novoProduto = new Produto({
      nome,
      descricao,
      preco,
      imagem_url,
      categoria_id: categoria_id || null,
      tempo_preparo: tempo_preparo || 15,
      ingredientes: Array.isArray(ingredientes) ? ingredientes : []
    });
    
    await novoProduto.save();
    await novoProduto.populate('categoria_id', 'nome descricao');
    
    res.status(201).json(novoProduto);
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
    
    const produto = await Produto.findByIdAndUpdate(
      id,
      {
        nome,
        descricao,
        preco,
        imagem_url,
        categoria_id: categoria_id || null,
        ativo: ativo !== undefined ? ativo : true,
        destaque: destaque || false,
        tempo_preparo: tempo_preparo || 15,
        ingredientes: Array.isArray(ingredientes) ? ingredientes : [],
        updated_at: new Date()
      },
      { new: true, runValidators: true }
    ).populate('categoria_id', 'nome descricao');
    
    if (!produto) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    
    res.json(produto);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/produtos/:id - Desativar produto (admin)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const produto = await Produto.findByIdAndUpdate(
      id,
      { ativo: false, updated_at: new Date() },
      { new: true }
    );
    
    if (!produto) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    
    res.json({ message: 'Produto desativado com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
