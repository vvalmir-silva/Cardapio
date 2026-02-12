const { query } = require('./database');

async function checkAllOrders() {
  try {
    console.log('🔍 Verificando todos os pedidos...');
    
    // Verificar se há pedidos
    const countResult = await query('SELECT COUNT(*) as total FROM pedidos');
    console.log(`📊 Total de pedidos: ${countResult.rows[0].total}`);
    
    if (countResult.rows[0].total === 0) {
      console.log('❌ Nenhum pedido encontrado no banco');
      console.log('');
      console.log('💡 Possíveis causas:');
      console.log('1. O pedido foi criado via localStorage (nÃO salvou no banco)');
      console.log('2. A API não está sendo usada no frontend');
      console.log('3. Ocorreu erro ao criar o pedido');
      console.log('');
      console.log('🔧 Soluções:');
      console.log('1. Verifique se o frontend está usando a API');
      console.log('2. Crie um pedido via API para testar');
      console.log('3. Verifique console do navegador por erros');
    } else {
      // Listar todos os pedidos
      const ordersResult = await query(`
        SELECT 
          p.codigo,
          c.nome as cliente_nome,
          p.status,
          p.total,
          p.data_pedido
        FROM pedidos p
        LEFT JOIN clientes c ON p.cliente_id = c.id
        ORDER BY p.id DESC
      `);
      
      console.log('📋 Pedidos encontrados:');
      ordersResult.rows.forEach(order => {
        console.log(`  ${order.codigo} - ${order.cliente_nome} - ${order.status} - R$ ${order.total}`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

checkAllOrders();
