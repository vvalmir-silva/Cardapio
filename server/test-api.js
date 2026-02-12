const express = require('express');
const { query } = require('./database');

const app = express();
app.use(express.json());

// Teste direto da API
app.get('/test', async (req, res) => {
  try {
    const { cliente_nome } = req.query;
    
    console.log('Buscando por:', cliente_nome);
    console.log('Tipo:', typeof cliente_nome);
    
    let sql = `
      SELECT 
        p.*,
        c.nome as cliente_nome,
        c.telefone as cliente_telefone
      FROM pedidos p
      LEFT JOIN clientes c ON p.cliente_id = c.id
    `;
    const params = [];
    
    if (cliente_nome) {
      sql += ' WHERE c.nome ILIKE $1';
      params.push('%' + cliente_nome + '%');
      console.log('SQL com filtro:', sql);
      console.log('Params:', params);
    }
    
    sql += ' ORDER BY p.data_pedido DESC';
    
    const result = await query(sql, params);
    console.log('Resultado:', result.rows);
    
    res.json({ 
      query: cliente_nome, 
      sql: sql, 
      params: params, 
      result: result.rows 
    });
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(3002, () => {
  console.log('Teste API rodando na porta 3002');
});
