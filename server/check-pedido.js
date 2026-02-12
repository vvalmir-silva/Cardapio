const { query } = require('./database');

async function checkOrder() {
  try {
    console.log('🔍 Verificando pedido #00001...');
    
    // Buscar todos os pedidos
    const allOrders = await query('SELECT id, codigo, cliente_nome, status, data_pedido FROM pedidos ORDER BY id DESC LIMIT 5');
    console.log('📋 Todos os pedidos recentes:');
    allOrders.rows.forEach(order => {
      console.log(`  ${order.codigo} - ${order.cliente_nome} - ${order.status}`);
    });
    
    // Buscar pedido específico
    const result = await query('SELECT * FROM pedidos WHERE codigo = $1', ['#00001']);
    
    if (result.rows.length > 0) {
      console.log('✅ Pedido encontrado:');
      console.log(JSON.stringify(result.rows[0], null, 2));
    } else {
      console.log('❌ Pedido #00001 não encontrado');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

checkOrder();
