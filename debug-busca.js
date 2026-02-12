// Teste direto da busca por nome
const fetch = require('node-fetch');

async function testBusca() {
  try {
    console.log('🔍 Testando busca por nome...');
    
    // Testar diferentes variações do nome
    const nomes = [
      'João Teste',
      'Joao Teste', 
      'joao teste',
      'João',
      'Teste'
    ];
    
    for (const nome of nomes) {
      console.log(`\n🔍 Testando com: "${nome}"`);
      
      const url = `http://localhost:3001/api/pedidos?cliente_nome=${encodeURIComponent(nome)}`;
      console.log(`URL: ${url}`);
      
      const response = await fetch(url);
      const data = await response.json();
      
      console.log(`Status: ${response.status}`);
      console.log(`Resultados: ${data.length} pedidos`);
      
      if (data.length > 0) {
        console.log('✅ Encontrado:', data[0].codigo, '-', data[0].cliente_nome);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

testBusca();
