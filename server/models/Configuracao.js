const mongoose = require('mongoose');

const ConfiguracaoSchema = new mongoose.Schema({
  chave: {
    type: String,
    required: true,
    unique: true,
    maxlength: 100
  },
  valor: {
    type: String,
    default: null
  },
  descricao: {
    type: String,
    maxlength: 500
  },
  tipo: {
    type: String,
    enum: ['string', 'number', 'boolean', 'json'],
    default: 'string'
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

// Atualizar data de modificação
ConfiguracaoSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model('Configuracao', ConfiguracaoSchema);
