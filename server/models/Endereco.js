const mongoose = require('mongoose');

const EnderecoSchema = new mongoose.Schema({
  cliente_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cliente',
    required: true
  },
  cep: {
    type: String,
    maxlength: 10
  },
  rua: {
    type: String,
    required: true,
    maxlength: 200
  },
  numero: {
    type: String,
    required: true,
    maxlength: 20
  },
  complemento: {
    type: String,
    maxlength: 100
  },
  bairro: {
    type: String,
    maxlength: 100
  },
  cidade: {
    type: String,
    required: true,
    maxlength: 100
  },
  estado: {
    type: String,
    required: true,
    maxlength: 50
  },
  ponto_referencia: {
    type: String,
    maxlength: 500
  },
  principal: {
    type: Boolean,
    default: false
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
EnderecoSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model('Endereco', EnderecoSchema);
