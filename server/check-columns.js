const { query } = require('./database');

async function checkColumns() {
  try {
    const result = await query('SELECT column_name FROM information_schema.columns WHERE table_name = $1 ORDER BY ordinal_position', ['pedidos']);
    
    console.log('Colunas da tabela pedidos:');
    result.rows.forEach(col => {
      console.log('  - ' + col.column_name);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Erro:', error.message);
    process.exit(1);
  }
}

checkColumns();
