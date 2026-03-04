const mongoose = require('mongoose');

const ProdutoSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  descricao: {
    type: String,
    trim: true
  },
  preco: {
    type: Number,
    required: true,
    min: 0,
    type: mongoose.Decimal128
  },
  imagem_url: {
    type: String,
    maxlength: 500
  },
  categoria_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Categoria',
    default: null
  },
  ativo: {
    type: Boolean,
    default: true
  },
  destaque: {
    type: Boolean,
    default: false
  },
  tempo_preparo: {
    type: Number,
    default: 15 // minutos
  },
  ingredientes: {
    type: [String],
    default: []
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

// Índices
ProdutoSchema.index({ categoria_id: 1 });
ProdutoSchema.index({ ativo: 1 });
ProdutoSchema.index({ nome: 'text', descricao: 'text' });

// Atualizar data de modificação
ProdutoSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model('Produto', ProdutoSchema);
