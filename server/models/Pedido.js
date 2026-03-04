const mongoose = require('mongoose');

const ItemPedidoSchema = new mongoose.Schema({
  produto_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Produto',
    required: true
  },
  quantidade: {
    type: Number,
    required: true,
    min: 1
  },
  preco_unitario: {
    type: mongoose.Decimal128,
    required: true,
    min: 0
  },
  subtotal: {
    type: mongoose.Decimal128,
    required: true,
    min: 0
  },
  observacoes: {
    type: String,
    maxlength: 500
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

const PedidoSchema = new mongoose.Schema({
  codigo: {
    type: String,
    required: true,
    unique: true,
    maxlength: 10
  },
  cliente_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cliente',
    default: null
  },
  endereco_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Endereco',
    default: null
  },
  status: {
    type: String,
    enum: ['confirmado', 'preparando', 'saiu-entrega', 'entregue', 'cancelado'],
    default: 'confirmado'
  },
  itens: [ItemPedidoSchema],
  subtotal: {
    type: mongoose.Decimal128,
    required: true,
    min: 0
  },
  taxa_entrega: {
    type: mongoose.Decimal128,
    default: 0,
    min: 0
  },
  desconto: {
    type: mongoose.Decimal128,
    default: 0,
    min: 0
  },
  total: {
    type: mongoose.Decimal128,
    required: true,
    min: 0
  },
  forma_pagamento: {
    type: String,
    enum: ['dinheiro', 'cartao', 'pix'],
    default: 'dinheiro'
  },
  troco_para: {
    type: mongoose.Decimal128,
    default: null
  },
  pix_qr_code: {
    type: String,
    default: null
  },
  pix_copia_cola: {
    type: String,
    default: null
  },
  payment_id: {
    type: String,
    default: null
  },
  observacoes: {
    type: String,
    maxlength: 1000
  },
  tempo_estimado: {
    type: Number,
    default: 30 // minutos
  },
  data_pedido: {
    type: Date,
    default: Date.now
  },
  data_entrega: {
    type: Date,
    default: null
  },
  status_log: [{
    status_anterior: String,
    status_novo: String,
    usuario_responsavel: String,
    observacoes: String,
    created_at: { type: Date, default: Date.now }
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

// Índices
PedidoSchema.index({ codigo: 1 });
PedidoSchema.index({ cliente_id: 1 });
PedidoSchema.index({ status: 1 });
PedidoSchema.index({ data_pedido: -1 });

// Atualizar data de modificação
PedidoSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model('Pedido', PedidoSchema);
