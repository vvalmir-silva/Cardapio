const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
console.log('MERCADO_PAGO_ACCESS_TOKEN:', process.env.MERCADO_PAGO_ACCESS_TOKEN);

const { testConnection } = require('./database');

// Importar rotas
const produtosRoutes = require('./routes/produtos');
const pedidosRoutes = require('./routes/pedidos');
const clientesRoutes = require('./routes/clientes');
const adminRoutes = require('./routes/admin');
const pagamentosRoutes = require('./routes/pagamentos');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware de segurança
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // limite de 100 requisições por IP
  message: 'Muitas requisições deste IP, tente novamente mais tarde.'
});
app.use('/api/', limiter);

// CORS
app.use(cors({
  origin: [
    'http://localhost:3000', 
    'http://127.0.0.1:5500', 
    'file://',
    'https://cardapio-ivory-nu.vercel.app',
    'https://cardapio-ecru-zeta.vercel.app'
  ],
  credentials: true
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rotas
app.use('/api/produtos', produtosRoutes);
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/pagamentos', pagamentosRoutes);

// Rota para obter a public key do Mercado Pago
app.get('/api/mercado-pago/config', (req, res) => {
  res.json({
    publicKey: process.env.MERCADO_PAGO_PUBLIC_KEY
  });
});

// Rota de saúde
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Rota 404
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Rota não encontrada',
    path: req.originalUrl,
    method: req.method
  });
});

// Middleware de erros
app.use((err, req, res, next) => {
  console.error('Erro:', err);
  
  if (err.code === '23505') { // Violation de chave única
    return res.status(409).json({
      error: 'Registro já existe',
      detail: err.detail
    });
  }
  
  if (err.code === '23503') { // Violation de chave estrangeira
    return res.status(400).json({
      error: 'Referência inválida',
      detail: err.detail
    });
  }
  
  res.status(err.status || 500).json({
    error: err.message || 'Erro interno do servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Inicialização do servidor
async function startServer() {
  try {
    // Testar conexão com banco
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error('Não foi possível conectar ao banco de dados');
      process.exit(1);
    }
    
    // Iniciar servidor
    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
      console.log(`📡 Ambiente: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🗄️  Banco: ${process.env.DB_NAME || 'artesanal_da_nega'}`);
      console.log(`🌐 API: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM recebido, fechando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT recebido, fechando servidor...');
  process.exit(0);
});

startServer();

module.exports = app;
