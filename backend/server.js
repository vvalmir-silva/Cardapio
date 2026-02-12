// ...existing code...
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Inicializa o banco de dados SQLite
const db = new sqlite3.Database('./orders.db', (err) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados:', err.message);
  } else {
    console.log('Conectado ao banco de dados SQLite.');
  }
});

// Cria tabela de pedidos se não existir
const createTable = `CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE,
  status TEXT,
  details TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`;
db.run(createTable);

// Endpoint para criar novo pedido
app.post('/api/orders', (req, res) => {
  const { code, details } = req.body;
  const status = 'Recebido';
  db.run('INSERT INTO orders (code, status, details) VALUES (?, ?, ?)', [code, status, details], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ id: this.lastID, code, status });
  });
});

// Endpoint para atualizar status do pedido
app.put('/api/orders/:code', (req, res) => {
  const { code } = req.params;
  const { status } = req.body;
  db.run('UPDATE orders SET status = ? WHERE code = ?', [status, code], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ updated: this.changes });
  });
});

// Endpoint para consultar status do pedido
app.get('/api/orders/:code', (req, res) => {
  const { code } = req.params;
  db.get('SELECT * FROM orders WHERE code = ?', [code], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }
    res.json(row);
  });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
