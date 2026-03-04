const mongoose = require('mongoose');

const ClienteSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  telefone: {
    type: String,
    required: true,
    maxlength: 20
  },
  email: {
    type: String,
    trim: true,
    maxlength: 200,
    lowercase: true
  },
  data_nascimento: {
    type: Date,
    default: null
  },
  cpf: {
    type: String,
    maxlength: 20
  },
  enderecos: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Endereco'
  }],
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
ClienteSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model('Cliente', ClienteSchema);
