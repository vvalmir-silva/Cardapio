# Backend - Rastreador de Pedidos

## Como rodar

1. Instale as dependências:
   ```bash
   npm install
   ```
2. Inicie o servidor:
   ```bash
   npm start
   ```

O backend ficará disponível em http://localhost:3001

## Endpoints
- `POST /api/orders` — Cria novo pedido
- `PUT /api/orders/:code` — Atualiza status do pedido
- `GET /api/orders/:code` — Consulta status do pedido
