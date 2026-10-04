# Especialista de mercado: contrato de dados

O prompt e o schema vivem em `lib/especialista.ts` (fonte da verdade). Este documento
explica as decisões.

## Princípios
- A IA traz só dados de mercado em **nível anual**. Nenhum cálculo financeiro.
- A **sazonalidade mensal não vem da IA**: três testes (Asa Norte, Águas Claras, Asa Sul)
  mostraram curvas inconsistentes entre consultas. A IA descreve a sazonalidade só em
  texto qualitativo. A curva mensal virá de uma tabela do projeto (índice por mês),
  alimentada por fontes publicadas, em PR futuro.
- A classificação alta/média/baixa será calculada pelo app, não pela IA.
- Custos sem base vêm `null` e o app os pede ao usuário. O especialista nunca inventa.
- Consulta manual: o app copia o prompt e o usuário cola no claude.ai (sem API, sem banco).

## Campos
| Campo | Uso |
|---|---|
| `perfil_imovel` (`quartos` = 0 para studio, `mobiliado`) | exibição, custo de implantação |
| `viabilidade_do_tipo` (compativel / incomum / inexistente) | aviso quando o tipo não existe na região (ex.: sobrado em Águas Claras) |
| `risco_regulatorio.restricao_condominio` | aviso sobre convenção do condomínio |
| `temporada.preco_minimo / medio / maximo` | diária (sem limpeza e sem taxas) |
| `temporada.ocupacao_anual_pct / min / max` | ocupação anual central e faixa |
| `temporada.base_ocupacao` | boletim_oficial, relatorio_mercado, comparaveis, estimativa |
| `temporada.estadia_media_noites`, `taxa_limpeza_cobrada_hospede` | custo de limpeza por noite, receita extra |
| `tradicional.aluguel_mensal_*`, `vacancia_meses_ano` | líquido tradicional |
| `custos_comuns_estimados[]` (`item`, `valor_mensal`, `pago_por_no_tradicional`) | campo único de custos comuns; itens do inquilino saem do tradicional |
| `custos_operacionais`, `implantacao` | custos variáveis e únicos da temporada |
| `comparaveis[]` (`airbnb`, `temporada_portal`, `aluguel_residencial`) | auditoria; aluguel nunca de anúncio de venda |
| `fontes[]`, `confianca`, `premissas[]`, `alertas[]` | transparência |

## Validação no app (`lerResposta`)
Avisos: faixas fora de ordem, tipo incompatível, risco de condomínio, ocupação por
estimativa, menos de 3 comparáveis de temporada, diária 30% fora da mediana dos
comparáveis, comparável sem URL ou com "venda" na URL, confiança "alta" sem boletim
oficial, custos sem valor.

## Fontes pesquisadas
- Observatório do Turismo do DF (oficial, Setur-DF): https://observatoriodoturismo.df.gov.br
  Indicadores de hospedagem (hotelaria). Os dados mensais ficam em painel/publicações,
  que precisam ser acessados manualmente. Contato: observatorio@setur.df.gov.br.
  Serve como indicador de demanda, não como ocupação de short stay.
- Ministério do Turismo: Boletim de Inteligência em Investimentos Turísticos (semestral)
  e regras de hospedagem que não cobrem imóveis residenciais em plataformas.
- InFOHB (mensal, setor hoteleiro): https://fohb.com.br
- Short stay (comerciais, não oficiais): Airbtics, BNBCalc, AirDNA, Hostnjoy, Seazone.
  Para Brasília divergem: ocupação de 45% a 63%, diária de R$ 214 a R$ 362.
- Não foi encontrado boletim oficial mensal de ocupação de **aluguel por temporada**.
