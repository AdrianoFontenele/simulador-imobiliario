# 📋 Dados de Exemplo para Testes

## Exemplo 1: Master Place 912 (Asa Norte, Brasília)

**Input:**
```json
{
  "localizacao": "Asa Norte 912, Brasília/DF",
  "tipo": "Kit 30m², mobiliada, 1 quarto, sala, cozinha, banheiro"
}
```

**Output Esperado (JSON da IA):**
```json
{
  "localizacao": "Asa Norte 912, Brasília/DF",
  "tipo": "Kit 30m², mobiliada",
  "preco_minimo": 150,
  "preco_medio": 280,
  "preco_maximo": 450,
  "alta_temporada_preco": 380,
  "baixa_temporada_preco": 200,
  "ocupacao_alta": 70,
  "ocupacao_baixa": 45,
  "ocupacao_media": 60,
  "meses_mais_rentaveis": "dez,jan,jul,ago",
  "sazonalidade": "Padrão típico de Brasília: picos em férias escolares (julho, dezembro-janeiro) e feriados prolongados. Demanda moderada em agosto e menores em setembro-novembro.",
  "aluguel_tradicional": 1500,
  "comparacao_viabilidade": "EXCELENTE",
  "preco_recomendado": 320,
  "estrategia": "Precificar 15-20% acima durante alta temporada. Ofertar pacotes semanais com 10% desconto. Publicar em múltiplas plataformas (Airbnb + Seazone + VRBO).",
  "fatores_regionais": "Localização premium em Asa Norte, próximo a comércios, restaurantes, shopping. Infraestrutura de qualidade. Demanda de executivos em viagem de negócios.",
  "observacoes": "Rentabilidade anual estimada em R$ 66.500 (com custos 30%). Breakeven em 7-8 meses. Margem de 65-70% após todos os custos. Requer gestão ativa (check-in, limpeza, manutenção)."
}
```

**Cálculo Esperado no Dashboard:**

| Indicador | Valor |
|-----------|-------|
| ADR | R$ 280 |
| Ocupação Média | 60% |
| Receita Anual | R$ 95.760 |
| Breakeven | 8 meses |
| Viabilidade | EXCELENTE (verde) |

**Projeção 12 Meses:**

| Mês | Temporada | Ocupação | Diárias | Receita | Custos | Lucro |
|-----|-----------|----------|---------|---------|--------|-------|
| Jan | Alta | 70% | 21 | R$ 7.980 | R$ 2.394 | R$ 5.586 |
| Fev | Baixa | 45% | 12 | R$ 2.400 | R$ 720 | R$ 1.680 |
| Mar | Baixa | 45% | 13 | R$ 2.600 | R$ 780 | R$ 1.820 |
| Abr | Média | 60% | 18 | R$ 5.040 | R$ 1.512 | R$ 3.528 |
| Mai | Média | 60% | 18 | R$ 5.040 | R$ 1.512 | R$ 3.528 |
| Jun | Média | 60% | 18 | R$ 5.040 | R$ 1.512 | R$ 3.528 |
| Jul | Alta | 70% | 21 | R$ 7.980 | R$ 2.394 | R$ 5.586 |
| Ago | Alta | 70% | 21 | R$ 7.980 | R$ 2.394 | R$ 5.586 |
| Set | Baixa | 45% | 13 | R$ 2.600 | R$ 780 | R$ 1.820 |
| Out | Baixa | 45% | 13 | R$ 2.600 | R$ 780 | R$ 1.820 |
| Nov | Baixa | 45% | 13 | R$ 2.600 | R$ 780 | R$ 1.820 |
| Dez | Alta | 70% | 21 | R$ 7.980 | R$ 2.394 | R$ 5.586 |

**TOTAL ANUAL:** R$ 66.500 lucro

---

## Exemplo 2: Sobrado em Águas Claras

**Input:**
```json
{
  "localizacao": "Águas Claras, Brasília/DF",
  "tipo": "Sobrado 3 quartos, 100m², ar condicionado, piscina"
}
```

**Output Esperado:**
```json
{
  "localizacao": "Águas Claras, Brasília/DF",
  "tipo": "Sobrado 3 quartos, 100m²",
  "preco_minimo": 250,
  "preco_medio": 420,
  "preco_maximo": 650,
  "alta_temporada_preco": 550,
  "baixa_temporada_preco": 300,
  "ocupacao_alta": 75,
  "ocupacao_baixa": 50,
  "ocupacao_media": 65,
  "meses_mais_rentaveis": "dez,jan,jul",
  "sazonalidade": "Muito procurado por famílias em férias. Piscina é diferencial importante. Demanda consistente ao longo do ano.",
  "aluguel_tradicional": 2500,
  "comparacao_viabilidade": "EXCELENTE",
  "preco_recomendado": 450,
  "estrategia": "Posicionar como opção familiar premium. Diferenciar com fotos de piscina e espaço. Ofertar pacotes de 7+ dias com desconto.",
  "fatores_regionais": "Águas Claras é condomínio com segurança 24h. Infraestrutura de qualidade. Piscina é grande diferencial. Proximidade com shopping.",
  "observacoes": "Rentabilidade anual estimada em R$ 152.000. Breakeven em 6 meses. Custos maiores (mais utilidades, limpeza de piscina) mas receita compensa."
}
```

---

## Exemplo 3: Studio em Asa Sul (Marginal)

**Input:**
```json
{
  "localizacao": "Asa Sul, Brasília/DF",
  "tipo": "Studio 20m², não mobiliada"
}
```

**Output Esperado:**
```json
{
  "localizacao": "Asa Sul, Brasília/DF",
  "tipo": "Studio 20m²",
  "preco_minimo": 80,
  "preco_medio": 150,
  "preco_maximo": 250,
  "alta_temporada_preco": 200,
  "baixa_temporada_preco": 120,
  "ocupacao_alta": 55,
  "ocupacao_baixa": 35,
  "ocupacao_media": 45,
  "meses_mais_rentaveis": "jan,dez",
  "sazonalidade": "Demanda baixa. Mercado saturado de studios. Sazonalidade fraca.",
  "aluguel_tradicional": 800,
  "comparacao_viabilidade": "MARGINAL",
  "preco_recomendado": 170,
  "estrategia": "Não recomendado para temporada. Melhor alugar como imóvel residencial (aluguel tradicional).",
  "fatores_regionais": "Studio não mobiliada tem pouco apelo turístico. Mercado muito competitivo. Não diferencia.",
  "observacoes": "Rentabilidade anual ~R$ 18.000. Margem após custos ~30%. Não vale a pena complexidade operacional."
}
```

---

## Teste de Fluxo Completo

### Passo 1: Pesquisar
```
Localização: Asa Norte 912, Brasília/DF
Tipo: Kit 30m², mobiliada
```

### Passo 2: API /analyze
```
POST /api/analyze
{
  "localizacao": "Asa Norte 912, Brasília/DF",
  "tipo": "Kit 30m², mobiliada"
}
```

**Resposta esperada (200 OK):**
```json
{
  "localizacao": "Asa Norte 912, Brasília/DF",
  "tipo": "Kit 30m², mobiliada",
  "preco_minimo": 150,
  "preco_medio": 280,
  ...
}
```

### Passo 3: Dashboard Carrega
- TAB 2: Indicadores aparecem
- TAB 3: Tabelas populadas
- TAB 4: Estratégia com preços
- TAB 5: Projeção 12 meses

---

## Valores Padrão para Cálculos

```javascript
// Custos variáveis (% da receita)
const CUSTOS_VARIAVEL = 0.30; // 30%

// Sazonalidade por mês
const monthSeasons = {
  0: 'high',   // janeiro
  1: 'low',    // fevereiro
  2: 'low',    // março
  3: 'mid',    // abril
  4: 'mid',    // maio
  5: 'mid',    // junho
  6: 'high',   // julho
  7: 'high',   // agosto
  8: 'low',    // setembro
  9: 'low',    // outubro
  10: 'low',   // novembro
  11: 'high'   // dezembro
};

// Ocupação por tipo de temporada
const ocupacaoPorTemporada = {
  high: 0.70,  // 70% alta temporada
  mid: 0.60,   // 60% média temporada
  low: 0.45    // 45% baixa temporada
};

// Preço médio para cálculo de receita
const precoMedioPorTemporada = {
  high: 'alta_temporada_preco',
  mid: 'preco_medio',
  low: 'baixa_temporada_preco'
};
```

---

## Validação de Inputs

```javascript
// Localização
- Mínimo 10 caracteres
- Máximo 255 caracteres
- Deve incluir cidade/estado

// Tipo
- Mínimo 15 caracteres
- Máximo 255 caracteres
- Exemplos: "Kit 30m²", "Sobrado 3 quartos", "Apartamento 2 quartos"
```

---

## Critérios de Viabilidade

```javascript
const viability = (lucroTemp, lucroTrad) => {
  const diferenca = lucroTemp - lucroTrad;
  const percentual = (diferenca / lucroTrad) * 100;
  
  if (percentual >= 200) return "EXCELENTE";      // +200%
  if (percentual >= 50)  return "VIÁVEL";         // +50%
  if (percentual >= 0)   return "MARGINAL";       // 0-50%
  return "NÃO-VIÁVEL";                            // negativo
};
```

---

## Teste Manual no Postman/cURL

```bash
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "localizacao": "Asa Norte 912, Brasília/DF",
    "tipo": "Kit 30m², mobiliada"
  }'
```

**Resposta esperada:** 200 com JSON da análise completa

---

**Use estes exemplos para validar o fluxo completo! ✅**
