const { query } = require('./database');

async function testBusca() {
  try {
    console.log('🔍 Testando busca por nome...');
    
    // Buscar todos os pedidos
    const todos = await query('SELECT p.codigo, c.nome FROM pedidos p LEFT JOIN clientes c ON p.cliente_id = c.id ORDER BY p.data_pedido DESC');
    console.log('Todos os pedidos:', todos.rows);
    
    // Buscar por nome
    const porNome = await query('SELECT p.codigo, c.nome FROM pedidos p LEFT JOIN clientes c ON p.cliente_id = c.id WHERE c.nome ILIKE $1 ORDER BY p.data_pedido DESC', ['%João%']);
    console.log('Pedidos por nome:', porNome.rows);
    
    // Testar busca exata
    const exato = await query('SELECT p.codigo, c.nome FROM pedidos p LEFT JOIN clientes c ON p.cliente_id = c.id WHERE c.nome = $1 ORDER BY p.data_pedido DESC', ['João Teste']);
    console.log('Pedidos nome exato:', exato.rows);
    
    process.exit(0);
  } catch (error) {
    console.error('Erro:', error.message);
    process.exit(1);
  }
}

testBusca();
