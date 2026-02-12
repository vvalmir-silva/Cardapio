const { testConnection } = require('./database');

async function test() {
  try {
    console.log('🧪 Testando conexão com PostgreSQL...');
    const connected = await testConnection();
    
    if (connected) {
      console.log('✅ Conexão bem-sucedida!');
      
      // Testar query simples
      const { query } = require('./database');
      const result = await query('SELECT COUNT(*) as total FROM produtos');
      console.log(`📦 Produtos no banco: ${result.rows[0].total}`);
      
      // Testar categorias
      const catResult = await query('SELECT COUNT(*) as total FROM categorias');
      console.log(`📂 Categorias no banco: ${catResult.rows[0].total}`);
      
    } else {
      console.log('❌ Falha na conexão');
    }
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
  
  process.exit(0);
}

test();
