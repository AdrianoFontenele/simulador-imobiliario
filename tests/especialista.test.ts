import { test } from "node:test";
import assert from "node:assert/strict";
import { lerResposta, montarPrompt } from "../lib/especialista";

// Resposta real (resumida) do especialista: anúncios do Airbnb sem preço visível vêm com valor null.
const resposta = {
  localizacao_normalizada: "Masterplace, SGAN 912, Asa Norte, Brasília, DF",
  cidade: "Brasília",
  uf: "DF",
  perfil_imovel: { area_m2: 30, quartos: 0, capacidade_hospedes: 2, mobiliado: true },
  viabilidade_do_tipo: { status: "compativel", observacao: "ok" },
  risco_regulatorio: { restricao_condominio: "possivel", observacao: "confirmar" },
  temporada: {
    preco_minimo: 220,
    preco_medio: 280,
    preco_maximo: 350,
    ocupacao_anual_pct: 45,
    ocupacao_anual_min_pct: 35,
    ocupacao_anual_max_pct: 55,
    base_ocupacao: "relatorio_mercado",
    estadia_media_noites: 3,
    taxa_limpeza_cobrada_hospede: 80,
    sazonalidade_resumo: "texto",
  },
  tradicional: { aluguel_mensal_min: 1550, aluguel_mensal_mediano: 1700, aluguel_mensal_max: 1800, vacancia_meses_ano: null },
  custos_comuns_estimados: [
    { item: "condominio", valor_mensal: 370, pago_por_no_tradicional: "proprietario" },
    { item: "iptu", valor_mensal: 87, pago_por_no_tradicional: "proprietario" },
    { item: "energia", valor_mensal: null, pago_por_no_tradicional: "inquilino" },
    { item: "agua", valor_mensal: 0, pago_por_no_tradicional: "proprietario" },
    { item: "gas", valor_mensal: 0, pago_por_no_tradicional: "proprietario" },
    { item: "internet", valor_mensal: null, pago_por_no_tradicional: "inquilino" },
  ],
  custos_operacionais: { limpeza_por_estadia: 80, lavanderia_por_estadia: null, consumiveis_por_noite: 15 },
  implantacao: { mobilia_e_enxoval_estimado: 0 },
  comparaveis: [
    { descricao: "Kit A", url: "https://www.airbnb.com/rooms/1", tipo: "airbnb", valor: null, distancia_km: 0.3 },
    { descricao: "Kit B", url: "https://es.airbnb.com/rooms/2", tipo: "airbnb", valor: null, distancia_km: 0.5 },
    { descricao: "Kit C", url: "https://www.dfimoveis.com.br/imovel?id=1", tipo: "temporada_portal", valor: 167, distancia_km: 1.2 },
    { descricao: "Kit D", url: "https://www.dfimoveis.com.br/imovel/aluguel-1", tipo: "aluguel_residencial", valor: 1750, distancia_km: 0 },
  ],
  fontes: [],
  confianca: "media",
  fatores_regionais: "f",
  estrategia_precificacao: "e",
  premissas: [],
  alertas: [],
};

test("aceita comparáveis sem preço visível (valor null)", () => {
  const r = lerResposta("```json\n" + JSON.stringify(resposta) + "\n```");
  assert.equal(r.ok, true);
});

test("avisa amostra pequena, diária fora da mediana e confiança incompatível", () => {
  const r = lerResposta(JSON.stringify(resposta));
  assert.ok(r.ok);
  const avisos = r.avisos.join("\n");
  assert.match(avisos, /Apenas 1 comparável.*com preço visível \(de 3\)/);
  assert.match(avisos, /difere mais de 30%/); // 280 contra 167
  assert.match(avisos, /Confiança 'media' com menos de 3/);
});

test("com 3 comparáveis de temporada com preço próximo da média, não há aviso de amostra", () => {
  const ok = {
    ...resposta,
    confianca: "baixa",
    comparaveis: [
      { descricao: "a", url: "https://x/1", tipo: "airbnb", valor: 270, distancia_km: 0 },
      { descricao: "b", url: "https://x/2", tipo: "airbnb", valor: 285, distancia_km: 0 },
      { descricao: "c", url: "https://x/3", tipo: "temporada_portal", valor: 290, distancia_km: 0 },
    ],
  };
  const r = lerResposta(JSON.stringify(ok));
  assert.ok(r.ok);
  assert.doesNotMatch(r.avisos.join("\n"), /Apenas|difere mais de 30%|Confiança 'media'/);
});

test("o prompt orienta valor null quando o preço não é visível", () => {
  assert.match(montarPrompt("Asa Norte 912, Brasília/DF", "Kit 30m2 mobiliada"), /use null\. Nunca estime/);
});
