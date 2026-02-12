const { query } = require('./database');

async function checkOrder() {
  try {
    console.log('🔍 Verificando pedido #00001...');
    
    // Query correta com JOIN
    const result = await query(`
      SELECT 
        p.*,
        c.nome as cliente_nome,
        c.telefone as cliente_telefone
      FROM pedidos p
      LEFT JOIN clientes c ON p.cliente_id = c.id
      WHERE p.codigo = $1
    `, ['#00001']);
    
    if (result.rows.length > 0) {
      console.log('✅ Pedido encontrado:');
      const order = result.rows[0];
      console.log(`  Código: ${order.codigo}`);
      console.log(`  Cliente: ${order.cliente_nome}`);
      console.log(`  Telefone: ${order.cliente_telefone}`);
      console.log(`  Status: ${order.status}`);
      console.log(`  Total: R$ ${order.total}`);
      console.log(`  Data: ${order.data_pedido}`);
    } else {
      console.log('❌ Pedido #00001 não encontrado');
      
      // Verificar todos os pedidos
      const allOrders = await query('SELECT codigo, status FROM pedidos ORDER BY id DESC LIMIT 5');
      console.log('📋 Pedidos existentes:');
      allOrders.rows.forEach(order => {
        console.log(`  ${order.codigo} - ${order.status}`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

checkOrder();
