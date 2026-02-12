-- ========================================
-- Banco de Dados: Artesanal da Nega
-- Sistema: Cardápio Digital e Gestão de Pedidos
-- ========================================

-- Criação do banco de dados
-- CREATE DATABASE artesanal_da_nega;
-- \c artesanal_da_nega;

-- ========================================
-- 1. Tabela de Categorias
-- ========================================
CREATE TABLE IF NOT EXISTS categorias (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE,
    descricao TEXT,
    ativo BOOLEAN DEFAULT true,
    ordem_exibicao INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- 2. Tabela de Produtos
-- ========================================
CREATE TABLE IF NOT EXISTS produtos (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(200) NOT NULL,
    descricao TEXT,
    preco DECIMAL(10,2) NOT NULL CHECK (preco >= 0),
    imagem_url VARCHAR(500),
    categoria_id INTEGER REFERENCES categorias(id) ON DELETE SET NULL,
    ativo BOOLEAN DEFAULT true,
    destaque BOOLEAN DEFAULT false,
    tempo_preparo INTEGER DEFAULT 15, -- minutos
    ingredientes TEXT, -- JSON com ingredientes
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- 3. Tabela de Clientes
-- ========================================
CREATE TABLE IF NOT EXISTS clientes (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(200) NOT NULL,
    telefone VARCHAR(20) NOT NULL,
    email VARCHAR(200),
    data_nascimento DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- 4. Tabela de Endereços
-- ========================================
CREATE TABLE IF NOT EXISTS enderecos (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER REFERENCES clientes(id) ON DELETE CASCADE,
    cep VARCHAR(10),
    rua VARCHAR(200) NOT NULL,
    numero VARCHAR(20) NOT NULL,
    complemento VARCHAR(100),
    bairro VARCHAR(100),
    cidade VARCHAR(100) NOT NULL,
    estado VARCHAR(50) NOT NULL,
    ponto_referencia TEXT,
    principal BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- 5. Tabela de Pedidos
-- ========================================
CREATE TABLE IF NOT EXISTS pedidos (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(10) NOT NULL UNIQUE, -- Formato: #00001
    cliente_id INTEGER REFERENCES clientes(id) ON DELETE SET NULL,
    endereco_id INTEGER REFERENCES enderecos(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'confirmado',
    -- Status: confirmado, preparando, saiu-entrega, entregue, cancelado
    subtotal DECIMAL(10,2) NOT NULL CHECK (subtotal >= 0),
    taxa_entrega DECIMAL(10,2) DEFAULT 0 CHECK (taxa_entrega >= 0),
    desconto DECIMAL(10,2) DEFAULT 0 CHECK (desconto >= 0),
    total DECIMAL(10,2) NOT NULL CHECK (total >= 0),
    forma_pagamento VARCHAR(50), -- dinheiro, cartao, pix, etc
    troco_para DECIMAL(10,2), -- para pagamentos em dinheiro
    observacoes TEXT,
    tempo_estimado INTEGER DEFAULT 30, -- minutos
    data_pedido TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_entrega TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- 6. Tabela de Itens do Pedido
-- ========================================
CREATE TABLE IF NOT EXISTS pedido_itens (
    id SERIAL PRIMARY KEY,
    pedido_id INTEGER REFERENCES pedidos(id) ON DELETE CASCADE,
    produto_id INTEGER REFERENCES produtos(id) ON DELETE RESTRICT,
    quantidade INTEGER NOT NULL CHECK (quantidade > 0),
    preco_unitario DECIMAL(10,2) NOT NULL CHECK (preco_unitario >= 0),
    subtotal DECIMAL(10,2) NOT NULL CHECK (subtotal >= 0),
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- 7. Tabela de Status do Pedido (Log)
-- ========================================
CREATE TABLE IF NOT EXISTS pedido_status_log (
    id SERIAL PRIMARY KEY,
    pedido_id INTEGER REFERENCES pedidos(id) ON DELETE CASCADE,
    status_anterior VARCHAR(20),
    status_novo VARCHAR(20) NOT NULL,
    usuario_responsavel VARCHAR(100), -- admin que alterou
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- 8. Tabela de Usuários Administrativos
-- ========================================
CREATE TABLE IF NOT EXISTS usuarios_admin (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(200) NOT NULL,
    email VARCHAR(200) NOT NULL UNIQUE,
    usuario VARCHAR(50) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL, -- hash
    ativo BOOLEAN DEFAULT true,
    nivel_acesso VARCHAR(20) DEFAULT 'admin', -- admin, gerente, operador
    ultimo_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- 9. Tabela de Configurações do Sistema
-- ========================================
CREATE TABLE IF NOT EXISTS configuracoes (
    id SERIAL PRIMARY KEY,
    chave VARCHAR(100) NOT NULL UNIQUE,
    valor TEXT,
    descricao TEXT,
    tipo VARCHAR(20) DEFAULT 'string', -- string, number, boolean, json
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- 10. Tabela de Promoções
-- ========================================
CREATE TABLE IF NOT EXISTS promocoes (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(200) NOT NULL,
    descricao TEXT,
    tipo_desconto VARCHAR(20) NOT NULL, -- percentual, valor_fixo
    valor_desconto DECIMAL(10,2) NOT NULL CHECK (valor_desconto >= 0),
    produto_id INTEGER REFERENCES produtos(id) ON DELETE CASCADE,
    categoria_id INTEGER REFERENCES categorias(id) ON DELETE CASCADE,
    valor_minimo_pedido DECIMAL(10,2),
    data_inicio TIMESTAMP,
    data_fim TIMESTAMP,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- Índices para performance
-- ========================================

-- Índices de produtos
CREATE INDEX IF NOT EXISTS idx_produtos_categoria ON produtos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_produtos_ativos ON produtos(ativo);
CREATE INDEX IF NOT EXISTS idx_produtos_destaque ON produtos(destaque);

-- Índices de pedidos
CREATE INDEX IF NOT EXISTS idx_pedidos_cliente ON pedidos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_status ON pedidos(status);
CREATE INDEX IF NOT EXISTS idx_pedidos_data ON pedidos(data_pedido);
CREATE INDEX IF NOT EXISTS idx_pedidos_codigo ON pedidos(codigo);

-- Índices de itens do pedido
CREATE INDEX IF NOT EXISTS idx_pedido_itens_pedido ON pedido_itens(pedido_id);
CREATE INDEX IF NOT EXISTS idx_pedido_itens_produto ON pedido_itens(produto_id);

-- Índices de clientes
CREATE INDEX IF NOT EXISTS idx_clientes_telefone ON clientes(telefone);
CREATE INDEX IF NOT EXISTS idx_clientes_email ON clientes(email);

-- Índices de endereços
CREATE INDEX IF NOT EXISTS idx_enderecos_cliente ON enderecos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_enderecos_cep ON enderecos(cep);

-- Índices de status log
CREATE INDEX IF NOT EXISTS idx_status_log_pedido ON pedido_status_log(pedido_id);
CREATE INDEX IF NOT EXISTS idx_status_log_data ON pedido_status_log(created_at);

-- ========================================
-- Triggers para atualização automática
-- ========================================

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger às tabelas
CREATE TRIGGER update_categorias_updated_at BEFORE UPDATE ON categorias
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_produtos_updated_at BEFORE UPDATE ON produtos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON clientes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_enderecos_updated_at BEFORE UPDATE ON enderecos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pedidos_updated_at BEFORE UPDATE ON pedidos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_usuarios_admin_updated_at BEFORE UPDATE ON usuarios_admin
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_configuracoes_updated_at BEFORE UPDATE ON configuracoes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_promocoes_updated_at BEFORE UPDATE ON promocoes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- Trigger para log de alterações de status
-- ========================================

CREATE OR REPLACE FUNCTION log_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO pedido_status_log (pedido_id, status_anterior, status_novo, usuario_responsavel)
        VALUES (NEW.id, OLD.status, NEW.status, current_user);
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER log_pedido_status_change AFTER UPDATE ON pedidos
    FOR EACH ROW EXECUTE FUNCTION log_status_change();

-- ========================================
-- Função para gerar código de pedido
-- ========================================

CREATE OR REPLACE FUNCTION gerar_codigo_pedido()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.codigo IS NULL OR NEW.codigo = '' THEN
        NEW.codigo := '#' || lpad(NEW.id::text, 5, '0');
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER gerar_codigo_pedido_trigger BEFORE INSERT ON pedidos
    FOR EACH ROW EXECUTE FUNCTION gerar_codigo_pedido();

-- ========================================
-- View para estatísticas de pedidos
-- ========================================

CREATE OR REPLACE VIEW vw_estatisticas_pedidos AS
SELECT 
    DATE(data_pedido) as data,
    COUNT(*) as total_pedidos,
    COUNT(CASE WHEN status = 'entregue' THEN 1 END) as pedidos_entregues,
    COUNT(CASE WHEN status = 'cancelado' THEN 1 END) as pedidos_cancelados,
    SUM(total) as faturamento_total,
    AVG(total) as ticket_medio
FROM pedidos
GROUP BY DATE(data_pedido)
ORDER BY DATE(data_pedido) DESC;

-- ========================================
-- View para produtos mais vendidos
-- ========================================

CREATE OR REPLACE VIEW vw_produtos_mais_vendidos AS
SELECT 
    p.id,
    p.nome,
    p.preco,
    SUM(pi.quantidade) as total_vendido,
    SUM(pi.subtotal) as faturamento_gerado
FROM produtos p
JOIN pedido_itens pi ON p.id = pi.produto_id
JOIN pedidos ped ON pi.pedido_id = ped.id
WHERE ped.status != 'cancelado'
GROUP BY p.id, p.nome, p.preco
ORDER BY total_vendido DESC;

-- ========================================
-- Inserção de dados iniciais
-- ========================================

-- Categorias
INSERT INTO categorias (nome, descricao, ordem_exibicao) VALUES
('Pasteis Tradicionais', 'Pasteis clássicos e saborosos', 1),
('Pasteis da Casa', 'Receitas especiais da casa', 2),
('Hambúrgueres', 'Hambúrgueres artesanais', 3),
('Bebidas', 'Refrigerantes e sucos', 4)
ON CONFLICT (nome) DO NOTHING;

-- Produtos
INSERT INTO produtos (nome, descricao, preco, imagem_url, categoria_id) VALUES
('Pastel de Queijo', 'Queijo derretido, massa crocante', 8.50, './assets/hamb-1.png', 1),
('Pastel de Carne', 'Carne temperada, cebola e cheiro-verde', 9.00, './assets/hamb-2.png', 1),
('Pastel de Frango', 'Frango desfiado com catupiry', 9.50, './assets/hamb-3.png', 1),
('Pastel Nega Especial', 'Carne, queijo, bacon e molho secreto', 12.90, './assets/hamb-4.png', 2),
('Hambúrguer Smash', 'Pão artesanal, burger 160g, queijo prato', 18.90, './assets/hamb-1.png', 3),
('Hambúrguer Duplo', 'Duplo burger, queijo duplo, bacon', 32.90, './assets/hamb-2.png', 3),
('Refrigerante Lata', 'Coca-Cola, Guaraná ou Fanta', 6.00, './assets/hamb-3.png', 4),
('Suco Natural', 'Laranja, Limão ou Maracujá', 8.00, './assets/hamb-4.png', 4)
ON CONFLICT DO NOTHING;

-- Usuário admin padrão (senha: admin123)
INSERT INTO usuarios_admin (nome, email, usuario, senha) VALUES
('Administrador', 'admin@artesanaldanega.com.br', 'admin', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6ukx.LFvO6')
ON CONFLICT (usuario) DO NOTHING;

-- Configurações do sistema
INSERT INTO configuracoes (chave, valor, descricao, tipo) VALUES
('nome_empresa', 'Artesanal da Nega', 'Nome da empresa', 'string'),
('telefone_empresa', '(11) 99999-9999', 'Telefone da empresa', 'string'),
('endereco_empresa', 'Av Jardim Japão Nº 936, Jardim Brasil', 'Endereço da empresa', 'string'),
('tempo_preparo_padrao', '30', 'Tempo padrão de preparo em minutos', 'number'),
('taxa_entrega_padrao', '0', 'Taxa de entrega padrão', 'number'),
('aberto', 'true', 'Status de funcionamento', 'boolean')
ON CONFLICT (chave) DO NOTHING;

-- ========================================
-- Comentários finais
-- ========================================

-- Este schema foi projetado para:
-- 1. Escalabilidade e performance
-- 2. Integridade referencial
-- 3. Auditoria de alterações
-- 4. Relatórios e estatísticas
-- 5. Flexibilidade para futuras expansões

-- Para usar este banco:
-- 1. Instale PostgreSQL
-- 2. Crie o banco: CREATE DATABASE artesanal_da_nega;
-- 3. Execute este script: psql -d artesanal_da_nega -f schema.sql
-- 4. Configure a conexão na aplicação
