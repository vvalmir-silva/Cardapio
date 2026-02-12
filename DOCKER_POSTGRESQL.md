# 🐳 Docker PostgreSQL - Mais Fácil e Rápido

## Instalação com Docker (Recomendado para Windows)

### 1. Instalar Docker Desktop
# Baixe em: https://www.docker.com/products/docker-desktop/

### 2. Criar container PostgreSQL
docker-compose up -d

### 3. Verificar se está rodando
docker ps

### 4. Conectar ao banco
# Host: localhost
# Porta: 5432
# Banco: artesanal_da_nega
# Usuário: postgres
# Senha: admin123

### 5. Testar conexão
# Use pgAdmin ou DBeaver para conectar

### 6. Parar container
docker-compose down

### 7. Ver logs
docker-compose logs postgres
