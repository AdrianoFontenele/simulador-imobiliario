import { test } from "node:test";
import assert from "node:assert/strict";
import {
  calcTemporada,
  calcTradicional,
  classificar,
  comparar,
  calcCenarios,
  compararPlanos,
  type Entradas,
} from "../lib/calculations";

const perto = (a: number, b: number) => assert.ok(Math.abs(a - b) < 0.01, `${a} != ${b}`);

const base: Entradas = {
  temporada: {
    diaria_media: 100,
    ocupacao_pct: 50,
    estadia_media_noites: 5,
    taxa_limpeza_hospede: 100,
    limpeza_por_estadia: 100,
    lavanderia_por_estadia: 0,
    consumiveis_por_noite: 2,
    taxa_airbnb_pct: 16,
    plano: "essencial",
    taxa_gestao_pct: 25,
  },
  tradicional: { aluguel_mensal: 1800, vacancia_meses_ano: 1, administracao_pct: 8 },
  custos_comuns: [
    { item: "condominio", valor_mensal: 500, pago_por_no_tradicional: "inquilino" },
    { item: "iptu", valor_mensal: 100, pago_por_no_tradicional: "proprietario" },
  ],
  implantacao: { adesao: 1499, enxoval_e_itens: 2000, outros: 300 },
  aliquota_ir_pct: 0,
};

test("temporada: cadeia de taxas e líquido (cálculo manual)", () => {
  const r = calcTemporada(base);
  perto(r.noites_ocupadas, 182.5);
  perto(r.estadias, 36.5);
  perto(r.receita_diarias, 18250);
  perto(r.receita_limpeza, 3650);
  perto(r.receita_bruta, 21900);
  perto(r.taxa_airbnb, 3504); // 16% sobre diária + limpeza
  perto(r.base_gestao, 18396);
  perto(r.taxa_gestao, 4599); // 25% sobre o que resta após o Airbnb
  perto(r.custos_comuns, 7200); // (500 + 100) x 12, proprietário paga tudo
  perto(r.custo_limpeza, 0); // plano Seazone inclui limpeza e lavanderia
  perto(r.liquido_anos_seguintes, 6232); // 18396 - 4599 - 365 - 7200
  perto(r.implantacao, 3799);
  perto(r.liquido_primeiro_ano, 6232 - 3799);
});

test("autogestão: limpeza e lavanderia são custo do proprietário", () => {
  const r = calcTemporada({
    ...base,
    temporada: { ...base.temporada, plano: "autogestao", taxa_gestao_pct: 0, lavanderia_por_estadia: 10 },
  });
  perto(r.custo_limpeza, 3650); // 36,5 estadias x 100
  perto(r.custo_lavanderia, 365); // 36,5 estadias x 10
  perto(r.taxa_gestao, 0);
  perto(r.liquido_anos_seguintes, 18396 - 3650 - 365 - 365 - 7200); // 6816
});

test("tradicional: inquilino paga condomínio; vacância volta todos os custos ao proprietário", () => {
  const r = calcTradicional(base);
  perto(r.meses_ocupados, 11);
  perto(r.aluguel_bruto, 19800);
  perto(r.administracao, 1584);
  perto(r.custos_comuns_proprietario, 11 * 100 + 1 * 600);
  perto(r.liquido_anual, 16516);
});

test("imposto simplificado só incide sobre líquido positivo", () => {
  const com = calcTradicional({ ...base, aliquota_ir_pct: 10 });
  perto(com.imposto, 1651.6);
  const negativo = calcTemporada({ ...base, aliquota_ir_pct: 10, custos_comuns: [{ item: "x", valor_mensal: 5000, pago_por_no_tradicional: "proprietario" }] });
  perto(negativo.imposto, 0);
});

test("comparativo e breakeven", () => {
  const t = calcTemporada(base);
  const d = calcTradicional(base);
  const c = comparar(t, d);
  perto(c.diferenca_anual, 6232 - 16516);
  assert.equal(c.viabilidade, "NÃO-VIÁVEL");
  assert.equal(c.breakeven_meses, null);

  const forte = comparar(
    { ...t, liquido_anos_seguintes: 20000, implantacao: 3000 },
    { ...d, liquido_anual: 10000 },
  );
  perto(forte.breakeven_meses!, 3.6); // 3000 / (10000 / 12)
  assert.equal(forte.viabilidade, "VIÁVEL"); // +100%
});

test("classificação por faixas e tradicional <= 0", () => {
  assert.equal(classificar(300, 100), "EXCELENTE");
  assert.equal(classificar(150, 100), "VIÁVEL");
  assert.equal(classificar(100, 100), "MARGINAL");
  assert.equal(classificar(50, 100), "NÃO-VIÁVEL");
  assert.equal(classificar(10, 0), "EXCELENTE");
  assert.equal(classificar(-5, -2), "NÃO-VIÁVEL");
});

test("comparação de planos: autogestão > essencial > premium", () => {
  const r = compararPlanos(base);
  const get = (id: string) => r.find((x) => x.plano === id)!;
  assert.ok(get("autogestao").liquido > get("essencial").liquido);
  assert.ok(get("essencial").liquido > get("premium").liquido);
  perto(get("essencial").implantacao, 3799);
  perto(get("autogestao").implantacao, 2300); // sem adesão
});

test("cenários: conservador, central e otimista (cálculo manual)", () => {
  const faixa = { diaria_min: 80, diaria_max: 120, ocupacao_min_pct: 40, ocupacao_max_pct: 60 };
  const [cons, cen, oti] = calcCenarios(base, faixa);
  perto(cons.temporada.liquido_anos_seguintes, 1706); // 80 x 40%: 12264 - 3066 - 292 - 7200
  perto(cen.temporada.liquido_anos_seguintes, 6232); // 100 x 50%, os valores informados
  perto(oti.temporada.liquido_anos_seguintes, 11677.8); // 120 x 60%: 25754,4 - 6438,6 - 438 - 7200
  perto(cons.tradicional.liquido_anual, 16516); // o tradicional é o mesmo nos três
  assert.equal(oti.comparativo.viabilidade, "NÃO-VIÁVEL");
});

test("cenários: a faixa nunca cruza o valor central editado", () => {
  // usuário subiu a diária para 300, acima do máximo informado (120)
  const e = { ...base, temporada: { ...base.temporada, diaria_media: 300 } };
  const [cons, cen, oti] = calcCenarios(e, { diaria_min: 80, diaria_max: 120, ocupacao_min_pct: 40, ocupacao_max_pct: 60 });
  assert.equal(cen.diaria, 300);
  assert.equal(oti.diaria, 300);
  assert.equal(cons.diaria, 80);
  assert.ok(cons.temporada.liquido_anos_seguintes <= cen.temporada.liquido_anos_seguintes);
  assert.ok(cen.temporada.liquido_anos_seguintes <= oti.temporada.liquido_anos_seguintes);
});
