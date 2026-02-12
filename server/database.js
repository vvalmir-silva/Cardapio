const { Pool } = require('pg');
require('dotenv').config();

// Configuração do pool de conexões PostgreSQL
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'artesanal_da_nega',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  max: 20, // número máximo de clientes no pool
  idleTimeoutMillis: 30000, // tempo ocioso antes de desconectar
  connectionTimeoutMillis: 2000, // tempo para tentativa de conexão
});

// Teste de conexão
pool.on('connect', () => {
  console.log('Conectado ao PostgreSQL!');
});

pool.on('error', (err) => {
  console.error('Erro inesperado no pool PostgreSQL:', err);
});

// Função para executar queries
async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Query executada:', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Erro na query:', error);
    throw error;
  }
}

// Função para transações
async function transaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Teste de conexão inicial
async function testConnection() {
  try {
    const res = await query('SELECT NOW()');
    console.log('Conexão com PostgreSQL estabelecida:', res.rows[0]);
    return true;
  } catch (error) {
    console.error('Falha na conexão com PostgreSQL:', error.message);
    return false;
  }
}

module.exports = {
  query,
  transaction,
  testConnection,
  pool
};
