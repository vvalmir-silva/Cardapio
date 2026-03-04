const mongoose = require('mongoose');
require('dotenv').config();

// Importar modelos
const Categoria = require('./models/Categoria');
const Produto = require('./models/Produto');
const Cliente = require('./models/Cliente');
const Endereco = require('./models/Endereco');
const Pedido = require('./models/Pedido');
const UsuarioAdmin = require('./models/UsuarioAdmin');
const Configuracao = require('./models/Configuracao');

// Configuração da conexão MongoDB
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/artesanal_da_nega';

// Configurações de conexão
const mongoOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  retryWrites: true,
  w: 'majority',
  maxPoolSize: 10,
  socketTimeoutMS: 45000,
};

// Conectar ao MongoDB
async function connect() {
  try {
    await mongoose.connect(mongoURI, mongoOptions);
    console.log('✅ Conectado ao MongoDB com sucesso!');
    console.log(`📍 Database: ${mongoose.connection.db.databaseName}`);
    return true;
  } catch (error) {
    console.error('❌ Erro ao conectar ao MongoDB:', error.message);
    return false;
  }
}

// Teste de conexão
async function testConnection() {
  try {
    await mongoose.connection.db.admin().ping();
    console.log('✅ Ping ao MongoDB bem-sucedido');
    return true;
  } catch (error) {
    console.error('❌ Falha no ping ao MongoDB:', error.message);
    return false;
  }
}

// Desconectar do MongoDB
async function disconnect() {
  try {
    await mongoose.disconnect();
    console.log('✅ Desconectado do MongoDB');
  } catch (error) {
    console.error('❌ Erro ao desconectar:', error.message);
  }
}

// Exportar modelos e funções
module.exports = {
  // Funções de conexão
  connect,
  testConnection,
  disconnect,
  mongoose,
  
  // Modelos
  Categoria,
  Produto,
  Cliente,
  Endereco,
  Pedido,
  UsuarioAdmin,
  Configuracao,
};
