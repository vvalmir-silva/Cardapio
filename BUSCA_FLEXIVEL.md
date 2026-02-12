# 🔍 Busca Flexível de Pedidos - Nome OU Código

## ✅ **Sistema Atualizado - Busca Inteligente!**

### 🎯 **Como Funciona Agora:**

#### **🔍 Busca por Código (Prioridade):**
- Digite **apenas o código** → Busca direta e rápida
- Ex: `00001` ou `#00001`
- Retorna: Pedido único com detalhes completos

#### **👤 Busca por Nome:**
- Digite **apenas o nome** → Lista todos os pedidos do cliente
- Ex: `João Teste`
- Retorna: Lista com todos os pedidos do cliente

#### **🔐 Busca Híbrida (Segurança):**
- Digite **nome + código** → Verifica se o nome corresponde ao pedido
- Ex: Nome=`João Teste`, Código=`00001`
- Retorna: Pedido apenas se nome corresponder

---

## 📱 **Interface Atualizada:**

```
┌─────────────────────────────────────┐
│  Acompanhar Pedido                │
│  Digite seu nome ou código      │
│  do pedido para acompanhar        │
│                                 │
│  Seu nome                      │
│  [Digite seu nome completo    ] │
│                                 │
│              OU                  │
│         ──────────             │
│                                 │
│  Código do pedido              │
│  [Ex: 00001 ou #00001      ] │
│                                 │
│  [🔍 Buscar Pedido]           │
│  [❌ Cancelar]                │
└─────────────────────────────────────┘
```

---

## 🧪 **Testes Completos:**

### **Teste 1 - Busca por Código:**
- **Nome:** `(vazio)`
- **Código:** `00001`
- **Resultado:** ✅ Mostra detalhes do pedido #00001

### **Teste 2 - Busca por Nome (1 pedido):**
- **Nome:** `João Teste`
- **Código:** `(vazio)`
- **Resultado:** ✅ Mostra detalhes do pedido único

### **Teste 3 - Busca por Nome (múltiplos pedidos):**
- **Nome:** `Cliente com Vários Pedidos`
- **Código:** `(vazio)`
- **Resultado:** ✅ Lista com todos os pedidos do cliente

### **Teste 4 - Busca Híbrida:**
- **Nome:** `João Teste`
- **Código:** `00001`
- **Resultado:** ✅ Mostra pedido apenas se nome corresponder

### **Teste 5 - Campos Vazios:**
- **Nome:** `(vazio)`
- **Código:** `(vazio)`
- **Resultado:** ❌ "Por favor, digite seu nome ou código do pedido"

---

## 📋 **Lista de Múltiplos Pedidos:**

Quando busca por nome e encontra múltiplos pedidos:

```
┌─────────────────────────────────────────────────┐
│  Pedidos de João Teste                    │
│  ┌─────────────────────────────────────┐   │
│  │ #00001 • 11/02/2026 • 2 itens │   │
│  │        R$ 17,00  [Confirmado]    │   │
│  └─────────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────────┐   │
│  │ #00002 • 12/02/2026 • 3 itens │   │
│  │        R$ 45,50  [Entregue]    │   │
│  └─────────────────────────────────────┘   │
│                                         │
│  Clique em um pedido para ver detalhes   │
└─────────────────────────────────────────────────┘
```

---

## 🔧 **Lógica de Busca:**

### **1. Prioridade: Código > Nome**
```javascript
if (code) {
    // Busca por código (mais rápida)
    buscarPorCodigo(formattedCode);
} else if (name) {
    // Busca por nome (pode retornar múltiplos)
    buscarPorNome(name);
}
```

### **2. Validação Flexível:**
```javascript
// Pelo menos um campo deve ser preenchido
if (!name && !code) {
    mostrarErro('Digite nome ou código');
}
```

### **3. Segurança Adicional:**
```javascript
// Se ambos preenchidos, verifica correspondência
if (name && code) {
    if (order.cliente_nome !== name) {
        mostrarErro('Nome não corresponde');
    }
}
```

---

## 🌐 **API Endpoints Utilizados:**

### **Buscar por Código:**
```bash
GET http://localhost:3001/api/pedidos/codigo/#00001
```
- Retorna: Pedido único com itens

### **Buscar por Nome:**
```bash
GET http://localhost:3001/api/pedidos?cliente_nome=João%20Teste
```
- Retorna: Array com pedidos do cliente

---

## 📊 **Exemplos Práticos:**

### **Cenário 1 - Cliente tem o código:**
1. Cliente abre WhatsApp com código #00001
2. Digita apenas `00001` no campo código
3. **Resultado:** Vê detalhes completos do pedido

### **Cenário 2 - Cliente perdeu o código:**
1. Cliente lembra apenas o nome
2. Digita apenas `João Teste` no campo nome
3. **Resultado:** Vê lista com todos os pedidos

### **Cenário 3 - Cliente quer segurança:**
1. Cliente tem nome e código
2. Preenche ambos os campos
3. **Resultado:** Busca apenas se nome corresponder

### **Cenário 4 - Cliente com múltiplos pedidos:**
1. Cliente busca por nome
2. Sistema mostra lista de pedidos
3. **Resultado:** Cliente escolhe qual pedido quer ver

---

## 🎯 **Benefícios da Nova Abordagem:**

### ✅ **Flexibilidade:**
- Cliente pode usar **qualquer informação** que tiver
- Não precisa memorizar ambos os dados

### ✅ **Usabilidade:**
- Interface mais **intuitiva** e menos restritiva
- Reduz fricção no acompanhamento

### ✅ **Segurança:**
- Validação adicional quando ambos preenchidos
- Evita acesso não autorizado

### ✅ **Performance:**
- Busca por código é **direta e rápida**
- Busca por nome mostra **todos os pedidos**

---

## 🚀 **Como Testar Agora:**

1. **Abra** `index.html` no navegador
2. **Clique** em "Acompanhar Pedido"
3. **Teste os cenários:**
   - Digite apenas `00001`
   - Digite apenas `João Teste`
   - Digite ambos os campos
4. **Verifique** os resultados

O sistema agora está **100% flexível** e pronto para uso real! 🎉
