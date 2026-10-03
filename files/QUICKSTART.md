# 🚀 Quick Start — Simulador Imobiliário

## ⚡ 5 Minutos para Começar

### 1️⃣ Clonar & Setup

```bash
git clone https://github.com/SEU_USER/simulador-imobiliario.git
cd simulador-imobiliario
npm install
```

### 2️⃣ Obter Credenciais

**Neon PostgreSQL:**
1. Ir para https://console.neon.tech
2. Criar projeto (free tier)
3. Copiar connection string (`postgresql://...`)

**Anthropic API:**
1. Ir para https://console.anthropic.com
2. Gerar API key (`sk-ant-...`)

### 3️⃣ Configurar Ambiente

Criar `.env.local`:

```env
DATABASE_URL=postgresql://user:password@ep-xxxx.us-east-1.neon.tech/simulador
ANTHROPIC_API_KEY=sk-ant-xxxxx
```

### 4️⃣ Setup Database

No Neon Console, executar:

```sql
CREATE TABLE analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  localizacao VARCHAR(255) NOT NULL,
  tipo VARCHAR(255) NOT NULL,
  data TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  json_data JSONB NOT NULL,
  user_id VARCHAR(255)
);
```

### 5️⃣ Rodar Local

```bash
npm run dev
```

Acessar: **http://localhost:3000**

---

## 🎯 Testar Fluxo Completo

1. Preencher:
   - Localização: `Asa Norte 912, Brasília/DF`
   - Tipo: `Kit 30m², mobiliada`

2. Clicar `Pesquisar com IA`

3. Ver dashboard carregar com:
   - Indicadores (ADR, ocupação, receita)
   - Análise (preços, sazonalidade)
   - Estratégia (precificação)
   - Cálculos (projeção 12 meses)

---

## 📤 Deploy Vercel

```bash
# 1. Push pro GitHub
git add .
git commit -m "Initial commit"
git push origin main

# 2. Em https://vercel.com/dashboard
# - "Add New..." → "Project"
# - Selecionar repositório simulador-imobiliario
# - Adicionar variáveis de ambiente:
#   DATABASE_URL
#   ANTHROPIC_API_KEY
# - Deploy

# 3. Seu app estará em:
# https://simulador-imobiliario.vercel.app
```

---

## 🐛 Troubleshooting

| Erro | Solução |
|------|---------|
| `Error: connect ECONNREFUSED` | Verificar DATABASE_URL em .env.local |
| `Invalid API Key` | Gerar nova API key no console.anthropic.com |
| `Module not found` | Rodar `npm install` |
| `TypeError: Cannot read property 'text'` | Resposta Claude inválida — checar prompt |

---

## 📚 Próximas Features

- [ ] Autenticação (NextAuth)
- [ ] Histórico de análises
- [ ] Export PDF
- [ ] Dark mode
- [ ] Gráficos (Recharts)
- [ ] Simulação de múltiplos cenários

---

**Pronto? Boa sorte! 🎉**
