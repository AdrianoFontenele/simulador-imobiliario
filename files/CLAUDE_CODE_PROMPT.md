# 🤖 Prompt para Claude Code

## Cole isto no Claude Code Desktop

```
Crie o projeto COMPLETO "simulador-imobiliario" com a seguinte especificação:

## 🎯 OBJETIVO
Aplicativo Next.js 15 para análise de viabilidade de imóveis em aluguel por temporada.
Stack: Next.js 15 + React 19 + TypeScript + Tailwind + Neon (PostgreSQL) + Claude API

## 📦 SETUP INICIAL

1. Criar estrutura Next.js:
   - npx create-next-app@latest simulador-imobiliario --typescript --tailwind --app --no-git
   - npm install pg dotenv uuid @anthropic-ai/sdk @types/pg

2. Criar .env.local (vazio para referência):
   - DATABASE_URL=postgresql://...
   - ANTHROPIC_API_KEY=sk-ant-...

## 📁 ARQUIVOS OBRIGATÓRIOS

### app/layout.tsx
- Importar fonte sistema Apple (-apple-system, BlinkMacSystemFont)
- Tailwind CSS com cores: #007AFF (azul), #34C759 (verde), #FF3B30 (vermelho)
- Navbar sticky com blur glass effect
- Sem emojis em lugar nenhum

### app/page.tsx
- 5 TABS via estilo iOS:
  1. Pesquisar (inputs + botão)
  2. Dashboard (após análise)
  3. Análise (tabelas)
  4. Estratégia (precificação)
  5. Cálculos (projeção 12 meses)

- TAB 1 - PESQUISAR:
  - Input: Localização (placeholder: "Asa Norte 912, Brasília/DF")
  - Input: Tipo (placeholder: "Kit 30m², mobiliada")
  - Botão "Pesquisar com IA" → POST /api/analyze
  - Loading spinner (300ms animação cubic-bezier)
  - Erro card se API falhar

- TAB 2 - DASHBOARD (carrega após análise):
  - 4 stat boxes: ADR, Ocupação %, Receita Anual, Breakeven (meses)
  - Indicador viabilidade (cor: verde/azul/amarelo/vermelho)
  - Card sazonalidade (Alta/Média/Baixa com preços)

- TAB 3 - ANÁLISE:
  - Card: Localização + Tipo
  - Tabela preços: Cenário | Preço/dia | Ocupação
  - Meses mais rentáveis
  - Comparação: Aluguel Temporada vs Aluguel Tradicional
  - Fatores regionais

- TAB 4 - ESTRATÉGIA:
  - Preço recomendado
  - Estrutura dinâmica (3 cards):
    * Alta Temporada (vermelha #FF3B30)
    * Média Temporada (laranja #f59e0b)
    * Baixa Temporada (verde #34C759)
  - Tabela comparativa: Temporada vs Tradicional

- TAB 5 - CÁLCULOS:
  - Tabela 12 meses: Mês | Temporada | Ocupação % | Diárias | Receita | Custos | Lucro
  - Resumo anual na base

### app/api/analyze/route.ts (POST)

Lógica:
1. Receber JSON: { localizacao, tipo }
2. Validar inputs (obrigatórios, >3 caracteres)
3. Construir prompt Claude:
   ```
   "Você é um especialista em análise imobiliária para aluguel por temporada.
    Analise este imóvel e retorne APENAS um JSON válido (sem explicações):
    
    Localização: {localizacao}
    Tipo: {tipo}
    
    Retorne exatamente este JSON:
    {
      "localizacao": string,
      "tipo": string,
      "preco_minimo": number,
      "preco_medio": number,
      "preco_maximo": number,
      "alta_temporada_preco": number,
      "baixa_temporada_preco": number,
      "ocupacao_alta": number,
      "ocupacao_baixa": number,
      "ocupacao_media": number,
      "meses_mais_rentaveis": "string (jan,dez,jul,ago)",
      "sazonalidade": "string descrição",
      "aluguel_tradicional": number,
      "comparacao_viabilidade": "EXCELENTE|VIÁVEL|MARGINAL|NÃO-VIÁVEL",
      "preco_recomendado": number,
      "estrategia": "string recomendações",
      "fatores_regionais": "string infraestrutura",
      "observacoes": "string custos e margem"
    }
    
    Retorne SOMENTE o JSON, nada mais."
   ```

4. Chamar Claude Sonnet (claude-sonnet-4-20250514, max_tokens: 2000)
5. Parse JSON (remover ```json, ```):
   ```typescript
   let clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
   const match = clean.match(/\{[\s\S]*\}/);
   if (match) clean = match[0];
   const data = JSON.parse(clean);
   ```
6. Salvar em Neon (table: analyses)
7. Retornar JSON ao frontend

### app/api/history/route.ts (GET/POST)
- GET ?user_id=XXX → últimas 10 análises
- POST → salvar nova análise
- Usar pool Neon com type checking

### lib/db.ts
- Criar pool: `new Pool({ connectionString: process.env.DATABASE_URL })`
- Funciones:
  * saveAnalysis(data: Analysis): Promise<UUID>
  * getHistory(userId): Promise<Analysis[]>

### lib/claude.ts
- Criar client Anthropic
- Função: analyzeProperty(localizacao, tipo): Promise<JSON>

### lib/calculations.ts
Funções:
- calcReceita(expertData): Receita anual baseada em sazonalidade
- calcBreakeven(receita, custos): Meses para recuperar investimento
- calcProjecao12Meses(expertData): Array com projeção mês a mês
- formatNumber(num): Separador de milhares (1000 → "1.000")
- formatCurrency(num): R$ formatado

Sazonalidade meses:
```javascript
const monthSeasons = {
  0: 'high',   // jan
  1: 'low',    // fev
  2: 'low',    // mar
  3: 'mid',    // abr
  4: 'mid',    // mai
  5: 'mid',    // jun
  6: 'high',   // jul
  7: 'high',   // ago
  8: 'low',    // set
  9: 'low',    // out
  10: 'low',   // nov
  11: 'high'   // dez
};
```

### styles/globals.css
- Tipografia Apple (SF Pro Display via -apple-system)
- Cores CSS variables
- Animação slideIn 300ms cubic-bezier(0.34, 1.56, 0.64, 1)
- Transições suaves em buttons/inputs
- Responsivo mobile-first
- Sem dark mode (for now)

## 🎨 DESIGN OBRIGATÓRIO

✅ Apple iOS style:
  - Sem emojis
  - Blur glass navbar
  - Toggle switches (não checkboxes)
  - Animações cúbicas
  - Spacing 0.5rem base
  - Input com foco: border azul + box-shadow
  - Botões com active state (scale 0.98)

❌ Evitar:
  - Bootstrap/Material Design
  - Emojis
  - Fontes custom (usar sistema)
  - Cores vibrantes (usar Apple palette)

## 🗄️ DATABASE SCHEMA

Tabela: analyses
- id: UUID PRIMARY KEY
- localizacao: VARCHAR(255)
- tipo: VARCHAR(255)
- data: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
- json_data: JSONB (armazenar resposta completa Claude)
- user_id: VARCHAR(255) NULLABLE

SQL:
CREATE TABLE analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  localizacao VARCHAR(255) NOT NULL,
  tipo VARCHAR(255) NOT NULL,
  data TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  json_data JSONB NOT NULL,
  user_id VARCHAR(255),
  CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

## ✅ CHECKLIST FINAL

- [ ] Next.js 15 com TypeScript
- [ ] Tailwind CSS (Apple colors)
- [ ] Pool Neon (conexão OK)
- [ ] API /analyze (Claude integration)
- [ ] API /history (CRUD)
- [ ] 5 tabs funcionando
- [ ] Animações suaves
- [ ] Erro handling
- [ ] Loading states
- [ ] Sem emojis
- [ ] Responsivo mobile
- [ ] .env.local template
- [ ] package.json atualizado

## 🚀 DEPOIS DE PRONTO

1. Commit & push para GitHub
2. Setup Vercel (variáveis de ambiente)
3. Deploy automático ao fazer push

## 📌 IMPORTANTE

- Sempre use async/await (não .then())
- Valide dados no backend (nunca confie no frontend)
- Parse JSON com try/catch
- Use process.env para secrets (nunca hardcode)
- Type tudo com TypeScript
- Comente código complexo
```

---

## Executar no Claude Code:

1. Abrir Claude Code Desktop
2. Colar o prompt acima
3. Deixar implementar
4. Revisar package.json
5. Rodar `npm run dev`
6. Testar fluxo: Pesquisar → Dashboard carrega

---

**Boa implementação! 🎉**
