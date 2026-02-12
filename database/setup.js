const fs = require('fs');
const path = require('path');

// Configurações do banco (modifique conforme necessário)
const config = {
  host: 'localhost',
  port: 5432,
  database: 'postgres', // Conecta ao postgres padrão primeiro
  user: 'postgres',
  password: 'admin123' // Altere para sua senha
};

// Função para executar comandos shell
function execCommand(command) {
  const { exec } = require('child_process');
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error('Erro:', error);
        reject(error);
      } else {
        console.log('Saída:', stdout);
        resolve(stdout);
      }
    });
  });
}

// Script de setup
async function setupDatabase() {
  try {
    console.log('🚀 Iniciando setup do banco de dados...');
    
    // 1. Criar banco de dados
    console.log('\n📦 Criando banco de dados...');
    await execCommand(`createdb -h ${config.host} -p ${config.port} -U ${config.user} artesanal_da_nega`);
    console.log('✅ Banco criado com sucesso!');
    
    // 2. Importar schema
    console.log('\n📋 Importando schema...');
    const schemaPath = path.join(__dirname, 'schema.sql');
    await execCommand(`psql -h ${config.host} -p ${config.port} -U ${config.user} -d artesanal_da_nega -f "${schemaPath}"`);
    console.log('✅ Schema importado com sucesso!');
    
    // 3. Verificar tabelas
    console.log('\n🔍 Verificando tabelas criadas...');
    const result = await execCommand(`psql -h ${config.host} -p ${config.port} -U ${config.user} -d artesanal_da_nega -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';"`);
    console.log('Tabelas criadas:', result);
    
    console.log('\n🎉 Setup concluído com sucesso!');
    console.log('\n📊 Configurações para conectar:');
    console.log(`   Host: ${config.host}`);
    console.log(`   Porta: ${config.port}`);
    console.log(`   Banco: artesanal_da_nega`);
    console.log(`   Usuário: ${config.user}`);
    console.log(`   Senha: ${config.password}`);
    
  } catch (error) {
    console.error('❌ Erro no setup:', error.message);
    console.log('\n💡 Soluções possíveis:');
    console.log('1. Verifique se PostgreSQL está instalado');
    console.log('2. Verifique se o serviço está rodando');
    console.log('3. Verifique senha do usuário postgres');
    console.log('4. Tente usar Docker (veja DOCKER_POSTGRESQL.md)');
  }
}

// Executar setup
if (require.main === module) {
  setupDatabase();
}

module.exports = { setupDatabase };
