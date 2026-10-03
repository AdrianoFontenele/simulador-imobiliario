# Simulador Imobiliário 🏠

**Análise de viabilidade para aluguel por temporada (Airbnb/VRBO/Seazone)**

Um aplicativo web que avalia investimentos em imóveis para aluguel de curta duração, fornecendo análises de mercado, projeções financeiras e recomendações de precificação.

---

## 📋 Visão Geral

O **Simulador Imobiliário** é uma ferramenta SaaS que:
- ✅ Analisa localização e tipo de imóvel
- ✅ Retorna dados de mercado (preços min/med/máx, sazonalidade, ocupação)
- ✅ Calcula rentabilidade anual vs aluguel tradicional
- ✅ Projeta fluxo de caixa mês a mês
- ✅ Recomenda estratégia de precificação dinâmica
- ✅ Salva análises no banco de dados para histórico

**Stack:**
- **Frontend:** React/Next.js (TypeScript) — iOS-style UI com Tailwind CSS
- **Backend:** Next.js API Routes (serverless)
- **Banco:** Neon (PostgreSQL serverless)
- **Hospedagem:** Vercel

---

## 🏗️ Arquitetura

```
simulador-imobiliario/
├── app/
│   ├── page.tsx              # Home / Pesquisa
│   ├── dashboard/            # Dashboard com análise
│   ├── api/
│   │   ├── analyze/route.ts  # POST /api/analyze (chama Claude)
│   │   └── history/route.ts  # GET/POST para salvar análises
│   └── layout.tsx
├── components/
│   ├── Nav.tsx               # Navegação com tabs
│   ├── SearchForm.tsx        # Pesquisa + inputs
│   ├── Dashboard.tsx         # 4 seções: Indicadores, Análise, Estratégia, Cálculos
│   └── Toast.tsx             # Notificações
├── lib/
│   ├── db.ts                 # Pool Neon
│   ├── claude.ts             # Client API Claude
│   └── calculations.ts       # Fórmulas financeiras
├── styles/
│   └── globals.css           # Apple Design System
├── .env.local                # Variáveis locais
└── package.json
```

---

## 🚀 Setup para Claude Code

### Pré-requisitos
1. **Node.js 18+** instalado
2. **Conta Vercel** (deploy gratuito)
3. **Conta Neon** (DB gratuito até 3GB)
4. **API Key Anthropic** (Claude)

### Passo 1: Criar repositório GitHub

```bash
git init simulador-imobiliario
cd simulador-imobiliario
git remote add origin https://github.com/SEU_USER/simulador-imobiliario.git
```

### Passo 2: Inicializar Next.js

```bash
npx create-next-app@latest . \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --no-git
```

### Passo 3: Instalar dependências adicionais

```bash
npm install pg dotenv uuid
npm install -D @types/pg
```

### Passo 4: Configurar variáveis de ambiente

Criar `.env.local`:

```env
# Neon PostgreSQL
DATABASE_URL=postgresql://user:password@ep-XXXX.us-east-1.neon.tech/simulador

# Anthropic Claude
ANTHROPIC_API_KEY=sk-ant-...

# Vercel
VERCEL_ENV=development
```

### Passo 5: Criar banco de dados

No **Neon Console**, executar:

```sql
CREATE TABLE analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  localizacao VARCHAR(255) NOT NULL,
  tipo VARCHAR(255) NOT NULL,
  data TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  json_data JSONB NOT NULL,
  user_id VARCHAR(255),
  INDEX(user_id, data DESC)
);

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 📁 Estrutura de Arquivos a Criar

### `app/layout.tsx`
```typescript
// Layout principal
// - Fonte do sistema (SF Pro Display)
// - Tailwind com cores Apple (azul #007AFF, verde #34C759)
// - Navbar sticky
```

### `app/page.tsx`
```typescript
// Tela inicial com tabs:
// 1. Pesquisar (inputs de localização + tipo)
// 2. Dashboard (após análise)
// 3. Análise (tabelas de preços)
// 4. Estratégia (precificação dinâmica)
// 5. Cálculos (projeção 12 meses)

// Fluxo:
// - Usuário preenche localização + tipo
// - Clica "Pesquisar com IA"
// - API /analyze é chamada
// - Claude retorna JSON
// - Dashboard carrega automaticamente
// - Salva no Neon
```

### `app/api/analyze/route.ts`
```typescript
// POST /api/analyze
// Recebe: { localizacao, tipo }
// Retorna: JSON com análise completa

// 1. Valida inputs
// 2. Constrói prompt para Claude Sonnet
// 3. Chama Claude API
// 4. Parse JSON da resposta
// 5. Salva no Neon (analyses table)
// 6. Retorna dados para renderizar

// Prompt Claude:
// "Você é especialista em análise imobiliária para temporada.
//  Analise e retorne APENAS JSON (sem explicações):
//  Localização: {localizacao}
//  Tipo: {tipo}
//  
//  Retorne JSON com campos:
//  - preco_minimo, preco_medio, preco_maximo
//  - alta_temporada_preco, baixa_temporada_preco
//  - ocupacao_alta, ocupacao_baixa, ocupacao_media
//  - meses_mais_rentaveis
//  - sazonalidade
//  - aluguel_tradicional
//  - comparacao_viabilidade (EXCELENTE|VIÁVEL|MARGINAL|NÃO-VIÁVEL)
//  - preco_recomendado
//  - estrategia
//  - fatores_regionais
//  - observacoes"
```

### `app/api/history/route.ts`
```typescript
// GET /api/history?user_id=XXX
// Retorna últimas 10 análises do usuário

// POST /api/history
// Salva análise (se não duplicado)
```

### `components/Nav.tsx`
```typescript
// Navegação com 5 tabs (estilo iOS)
// - Pesquisar
// - Dashboard
// - Análise
// - Estratégia
// - Cálculos

// Styling:
// - Fundo blur glass (backdrop-filter)
// - Underline animado na aba ativa
// - Transições cúbicas 300ms
// - Sem emojis
```

### `components/SearchForm.tsx`
```typescript
// Inputs:
// - Localização (ex: "Asa Norte 912, Brasília/DF")
// - Tipo (ex: "Kit 30m², mobiliada")

// Botão "Pesquisar com IA"
// - Loading spinner
// - Mensagem "Analisando mercado..."
// - Timeout ~45 segundos

// Tratamento de erro:
// - Se API falhar, mostrar mensagem
// - Botão retry
```

### `components/Dashboard.tsx`
```typescript
// 4 seções dinâmicas:

// 1. INDICADORES PRINCIPAIS
//    - ADR (Average Daily Rate)
//    - Ocupação média (%)
//    - Receita anual
//    - Breakeven (meses)
//    - Viabilidade (cor: verde/azul/amarelo)

// 2. ANÁLISE
//    - Localização + Tipo
//    - Tabela preços (min/med/máx/alta/baixa)
//    - Sazonalidade
//    - Meses mais rentáveis
//    - Aluguel tradicional (comparação)
//    - Fatores regionais

// 3. ESTRATÉGIA
//    - Preço recomendado
//    - Estrutura: Alta (🔴 vermelha) / Média (🟡 laranja) / Baixa (🟢 verde)
//    - Tabela comparativa: Temporada vs Aluguel Tradicional
//    - Pontos-chave

// 4. CÁLCULOS
//    - Tabela projeção 12 meses
//    - Coluna: Mês, Temporada, Ocupação, Diárias, Receita, Custos, Lucro
//    - Resumo anual na base
```

### `lib/db.ts`
```typescript
// Pool de conexões Neon
// - Função para salvar análise
// - Função para carregar histórico
// - Type: Analysis {
//     id: UUID
//     localizacao: string
//     tipo: string
//     data: Date
//     json_data: object
//     user_id: string
//   }
```

### `lib/claude.ts`
```typescript
// Client Anthropic
// - Função analyzeProperty(localizacao, tipo): Promise<JSON>
// - Model: claude-sonnet-4-20250514
// - Max tokens: 2000
// - Parse JSON da resposta
```

### `lib/calculations.ts`
```typescript
// Fórmulas financeiras

// calcReceita(expertData): number
// calcBreakeven(receita, custos): number
// calcProjecao12Meses(expertData): Array<{mes, ocupacao, receita, custos, lucro}>
// formatNumber(num): string (com separador de milhares)
// formatCurrency(num): string (R$ XXXX,XX)

// Sazonalidade por mês:
// { 0:'high', 1:'low', 2:'low', 3:'mid', 4:'mid', 5:'mid',
//   6:'high', 7:'high', 8:'low', 9:'low', 10:'low', 11:'high' }

// Taxa Seazone: varia 20-23% (sobre receita - taxa Airbnb)
// Custos variáveis: ~30% da receita (utilities + limpeza + checkin)
// Custos fixos: condomínio + manutenção + seguro
```

### `styles/globals.css`
```css
/* Apple Design System */

/* Cores */
:root {
  --primary: #007AFF;      /* Azul Apple */
  --success: #34C759;      /* Verde */
  --danger: #FF3B30;       /* Vermelho */
  --warning: #f59e0b;      /* Laranja */
  --text-primary: #333;
  --text-secondary: #666;
  --bg-primary: #ffffff;
  --bg-secondary: #f9f9f9;
  --border: #e5e5ea;
}

/* Tipografia */
body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
  font-size: 16px;
  line-height: 1.5;
  letter-spacing: -0.3px;
}

h1, h2, h3 {
  font-weight: 700;
  letter-spacing: -0.5px;
}

/* Animações */
@keyframes slideIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

button, a {
  transition: all 150ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

button:active {
  transform: scale(0.98);
}

/* Dark mode (futuro) */
@media (prefers-color-scheme: dark) {
  :root {
    --text-primary: #fff;
    --text-secondary: #999;
    --bg-primary: #000;
    --bg-secondary: #1a1a1a;
  }
}
```

### `package.json`
```json
{
  "name": "simulador-imobiliario",
  "version": "1.0.0",
  "description": "Análise de viabilidade para aluguel por temporada",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "pg": "^8.11.0",
    "dotenv": "^16.4.0",
    "uuid": "^9.0.1",
    "@anthropic-ai/sdk": "^0.27.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "@types/node": "^20.0.0",
    "@types/react": "^18.0.0",
    "tailwindcss": "^3.3.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0"
  }
}
```

---

## 🎯 Fluxo de Uso (Usuário Final)

1. **Usuário acessa** https://simulador-imobiliario.vercel.app
2. **Preenche** Localização (ex: "Asa Norte 912, Brasília/DF")
3. **Preenche** Tipo (ex: "Kit 30m², mobiliada")
4. **Clica** "Pesquisar com IA"
5. **Frontend chama** `POST /api/analyze`
6. **Backend:**
   - Valida inputs
   - Chama Claude API
   - Parse JSON
   - Salva em Neon
   - Retorna para frontend
7. **Dashboard carrega** com 4 abas:
   - Indicadores (ADR, ocupação, receita, breakeven)
   - Análise (preços, sazonalidade, meses rentáveis)
   - Estratégia (precificação dinâmica, comparação)
   - Cálculos (projeção 12 meses)
8. **Usuário pode** salvar PDF, compartilhar, ver histórico

---

## 🔑 Variáveis de Ambiente

### Local (`.env.local`)
```env
DATABASE_URL=postgresql://user:password@host/db
ANTHROPIC_API_KEY=sk-ant-xxxxx
```

### Vercel (Settings → Environment Variables)
```
DATABASE_URL = postgresql://...
ANTHROPIC_API_KEY = sk-ant-...
```

---

## 📦 Deploy no Vercel

```bash
# 1. Fazer push pro GitHub
git add .
git commit -m "Initial commit"
git push origin main

# 2. No Vercel Dashboard:
# - Conectar repositório simulador-imobiliario
# - Adicionar variáveis de ambiente
# - Deploy automático ao fazer push

# 3. Teste
# https://simulador-imobiliario.vercel.app
```

---

## 🗄️ Schema Neon

### Tabela `analyses`
```sql
id          UUID (PRIMARY KEY)
localizacao VARCHAR(255)
tipo        VARCHAR(255)
data        TIMESTAMP
json_data   JSONB {
              preco_minimo,
              preco_medio,
              preco_maximo,
              alta_temporada_preco,
              baixa_temporada_preco,
              ocupacao_alta,
              ocupacao_baixa,
              ocupacao_media,
              meses_mais_rentaveis,
              sazonalidade,
              aluguel_tradicional,
              comparacao_viabilidade,
              preco_recomendado,
              estrategia,
              fatores_regionais,
              observacoes
            }
user_id     VARCHAR(255) (NULLABLE)
```

---

## 🎨 UI/UX Especificações

- **Framework:** Tailwind CSS
- **Design System:** Apple iOS (SF Pro Display)
- **Paleta:**
  - Azul primário: `#007AFF`
  - Verde sucesso: `#34C759`
  - Vermelho erro: `#FF3B30`
  - Cinza fundo: `#f9f9f9`
  - Borda: `#e5e5ea`
- **Sem emojis** — Design clean
- **Animações:** Cubic-bezier(0.34, 1.56, 0.64, 1) — 150-300ms
- **Toggle switches** iOS nativos (não checkboxes)
- **Blur glass effect** na navegação

---

## 🧪 Testes (Futura Implementação)

- Jest + React Testing Library
- E2E com Playwright
- Coverage > 80%

---

## 📝 Instruções para Claude Code

### Executar no Claude Code Desktop:

```
Claude Code, crie o projeto simulador-imobiliario com:

1. Next.js 15 + TypeScript
2. Tailwind CSS (Apple Design)
3. Neon PostgreSQL (criar tabelas)
4. Anthropic Claude API
5. Estrutura de pastas conforme acima
6. Componentes React (Nav, SearchForm, Dashboard)
7. API routes (analyze, history)
8. Deploy pronto para Vercel

Seguir:
- iOS-style UI (sem emojis)
- Animações smooth
- Responsivo mobile-first
- ENV variables configuradas
```

---

## 🚨 Checklist de Implementação

- [ ] Estrutura Next.js
- [ ] Setup Tailwind CSS
- [ ] Conexão Neon (pool + schema)
- [ ] Client Anthropic
- [ ] API /analyze route
- [ ] API /history route
- [ ] Componente Nav (tabs)
- [ ] Componente SearchForm
- [ ] Componente Dashboard (4 seções)
- [ ] Fórmulas financeiras (lib/calculations.ts)
- [ ] Styling global (Apple Design)
- [ ] Tratamento de erros
- [ ] Loading states
- [ ] Deploy Vercel
- [ ] Testes básicos

---

## 📞 Suporte

**Problemas comuns:**

1. **Erro: "CORS" na chamada API**
   → Usar API route Next.js (nunca fetch direto ao Claude)

2. **DB desconectado**
   → Verificar DATABASE_URL no .env.local

3. **Claude retorna texto em vez de JSON**
   → Reforçar prompt: "Retorne APENAS JSON, nada mais"

4. **Timeout na análise**
   → Aumentar max_tokens ou reduzi-los se tiver limite

---

## 📄 Licença

MIT

---

**Criado para:** Adriano Fontenele (@adriano_fontenele)  
**Data:** Outubro 2026  
**Stack:** Next.js 15 + Neon + Vercel + Claude AI
