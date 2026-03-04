const mongoose = require('mongoose');

const CategoriaSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    maxlength: 100
  },
  descricao: {
    type: String,
    trim: true
  },
  ativo: {
    type: Boolean,
    default: true
  },
  ordem_exibicao: {
    type: Number,
    default: 0
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

// Atualizar data de modificação antes de salvar
CategoriaSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model('Categoria', CategoriaSchema);
