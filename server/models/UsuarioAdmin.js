const mongoose = require('mongoose');

const UsuarioAdminSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    maxlength: 200
  },
  usuario: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    maxlength: 50
  },
  senha: {
    type: String,
    required: true,
    minlength: 6
  },
  ativo: {
    type: Boolean,
    default: true
  },
  nivel_acesso: {
    type: String,
    enum: ['admin', 'gerente', 'operador'],
    default: 'admin'
  },
  ultimo_login: {
    type: Date,
    default: null
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

// Não retornar senha em consultas por padrão
UsuarioAdminSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.senha;
  return obj;
};

// Atualizar data de modificação
UsuarioAdminSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model('UsuarioAdmin', UsuarioAdminSchema);
