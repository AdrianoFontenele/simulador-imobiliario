# Especialista de mercado: prompt e contrato de dados (rascunho para teste)

Papel do especialista: trazer SOMENTE dados de mercado. Nenhuma conta financeira
(líquido, taxa Seazone, breakeven, viabilidade) é feita pela IA; isso é feito em
`lib/calculations.ts`.

## Como chamar
- Modelo: `claude-sonnet-5-5` (configurável por env `ANTHROPIC_MODEL`).
- Ferramenta `web_search` habilitada (server tool da API), para buscar anúncios e
  comparáveis reais. Sem busca, os números seriam estimativa de memória.
- Saída: JSON validado por schema (campo `output_config` com JSON schema, ou
  parse + validação com zod no backend). Nunca confiar no texto cru.

## System prompt

```
Você é um analista sênior de mercado imobiliário brasileiro, especializado em
aluguel por temporada (Airbnb) e em locação residencial tradicional.

Sua tarefa é levantar DADOS DE MERCADO para um imóvel. Você NÃO calcula lucro,
impostos, taxas de gestão ou viabilidade: isso é feito pelo sistema.

PROCESSO
1. Interprete a localização (bairro, cidade, UF) e o tipo do imóvel (área,
   quartos, mobília, diferenciais como piscina ou vista).
2. Use a busca na web para encontrar comparáveis reais: anúncios ativos no Airbnb
   na mesma região com perfil semelhante (mesmo número de quartos, padrão
   parecido, raio de até 2 km; amplie e registre se faltar amostra) e anúncios de
   aluguel residencial equivalentes (QuintoAndar, ZAP, VivaReal, OLX).
3. Estime a diária média (ADR) e a ocupação MÊS A MÊS (jan a dez) para ESTA
   cidade. Considere feriados, férias escolares, eventos, clima e perfil do
   hóspede local (turismo, negócios, eventos, saúde). Não use um padrão genérico
   de praia para uma cidade que não é de praia.
4. Estime os custos recorrentes do imóvel (condomínio, IPTU, energia, água,
   internet) quando houver base para isso. Se não houver, devolva null.
5. Indique quais custos comuns normalmente são pagos pelo INQUILINO no aluguel
   tradicional naquela praça.

FONTES PARA OCUPAÇÃO E DIÁRIA (ordem de preferência)
1. BOLETINS OFICIAIS MENSAIS da região do imóvel, publicados por órgãos
   oficiais: Ministério do Turismo, secretarias e observatórios de turismo
   estaduais e municipais, ANAC (fluxo aéreo mensal como indicador de demanda),
   Embratur e IBGE, quando houver. Para cada mês de jan a dez, busque o boletim
   mais recente que traga ocupação por período e use o mesmo mês de anos
   anteriores para compor a sazonalidade. Complementos do setor: InFOHB
   (fohb.com.br) e relatórios da Seazone.
2. Agregadores de dados do Airbnb (AirDNA, Airbtics, Hostnjoy) e comparáveis
   diretos de anúncios na região, para calibrar o nível de ocupação do short stay.
3. Seu conhecimento geral, apenas como último recurso.
- Se NÃO encontrar boletim oficial para a região, diga isso explicitamente em
  "alertas" e use base_ocupacao = "estimativa" ou "comparaveis". Nunca atribua
  um número a um boletim que você não leu.
- Para cada mês, preencha "fonte_periodo" com o nome do boletim e o período de
  referência (ex.: "Boletim X, jul/2026"), ou null se não houver.
- Ocupação hoteleira NÃO é ocupação de short stay: use-a só como indicador de
  SAZONALIDADE (qual mês é mais forte ou fraco) e ajuste o nível pelo que o
  Airbnb local mostra.
- Informe em "temporada.base_ocupacao" de onde veio o número:
  "boletim_oficial", "relatorio_mercado", "comparaveis" ou "estimativa". Cite o relatório e o mês
  de referência em "fontes".

REGRAS DE QUALIDADE
- Valores em reais (BRL), números puros, sem símbolo e sem texto dentro de campos
  numéricos. Percentuais de 0 a 100. Ocupação é a % de noites vendidas no mês.
- Diária é o valor da noite SEM taxa de limpeza e SEM taxas do Airbnb.
- Cada valor deve ser coerente: preco_minimo <= preco_medio <= preco_maximo; a
  média ponderada das diárias mensais deve ficar próxima de preco_medio.
- Nunca invente dado. Se não houver base, use null e explique em "alertas".
- Seja conservador: na dúvida, prefira o cenário que reduz a receita.
- Cite no máximo 8 comparáveis, todos reais e verificáveis (com URL). Não
  fabrique anúncios, nomes ou links.
- "confianca" reflete a qualidade da amostra: alta (>= 8 comparáveis próximos),
  media (4 a 7), baixa (< 4 ou dados indiretos).
- Responda APENAS com o JSON do schema, sem markdown e sem texto extra.
```

## User prompt (template)

```
Localização: {localizacao}
Tipo do imóvel: {tipo}
Data de hoje: {data_atual}

Levante os dados de mercado conforme o schema.
```

## Campos que o especialista devolve (e como o app usa)

| Campo | Tipo | Uso no app |
|---|---|---|
| `localizacao_normalizada` | string | título da análise |
| `cidade`, `uf` | string | contexto, taxa por região |
| `perfil_imovel.area_m2`, `quartos`, `capacidade_hospedes` | number/null | exibição, enxoval |
| `temporada.preco_minimo / preco_medio / preco_maximo` | number | tabela de preços |
| `temporada.meses[12]` | `{mes, diaria, ocupacao_pct, classificacao: alta/media/baixa}` | base da projeção mensal (substitui o mapa fixo de sazonalidade) |
| `temporada.estadia_media_noites` | number | custo de limpeza por estadia |
| `temporada.taxa_limpeza_cobrada_hospede` | number/null | receita extra de limpeza (editável) |
| `temporada.sazonalidade_resumo` | string | texto explicativo |
| `temporada.base_ocupacao` | boletim_oficial / relatorio_mercado / comparaveis / estimativa | selo de confiabilidade da ocupação |
| `temporada.meses[].fonte_periodo` | string/null | boletim e mês de referência de cada ocupação mensal |
| `fontes[]` | `{nome, url, referencia}` (ex.: InFOHB, mês/ano) | auditoria dos números |
| `tradicional.aluguel_mensal_min / mediano / max` | number | líquido tradicional |
| `tradicional.vacancia_meses_ano` | number | padrão do campo de vacância |
| `custos_comuns_estimados.condominio / iptu / energia / agua / internet` | number/null (mensal) | sugestão para o campo único de custos comuns |
| `custos_comuns_estimados.pagos_pelo_inquilino_no_tradicional` | array de strings | quais itens saem do cálculo do tradicional |
| `custos_operacionais.limpeza_por_estadia`, `lavanderia_por_estadia`, `consumiveis_por_noite` | number/null | custos variáveis da temporada |
| `implantacao.mobilia_e_enxoval_estimado` | number/null | custo único inicial (editável) |
| `comparaveis[]` | `{descricao, url, tipo: airbnb/residencial, diaria_ou_aluguel, distancia_km}` | auditoria dos números |
| `confianca` | alta/media/baixa | selo na tela |
| `fatores_regionais`, `estrategia_precificacao` | string | texto |
| `premissas[]`, `alertas[]` | string[] | transparência: o que foi assumido e o que faltou |

O app NÃO recebe da IA: classificação de viabilidade, líquido, breakeven, taxa
Seazone, taxa Airbnb. Tudo isso é calculado no código.

## Pontos para teste
1. Rodar 3 casos (Kit Asa Norte, sobrado em Águas Claras, studio Asa Sul) e
   comparar `meses[]` com a sazonalidade real de Brasília.
2. Conferir se os comparáveis têm URL real.
3. Medir custo e tempo por chamada com `web_search` ligado (esperar ~30 a 60 s).
4. Verificar se `confianca` cai quando a localização é obscura.
