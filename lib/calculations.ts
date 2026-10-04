import { PLANOS, PLANO_IDS, type PlanoId } from "./config";

// Cálculo do líquido anual: temporada (Airbnb + gestão Seazone) versus aluguel tradicional.
// Funções puras, sem dependência da IA. Valores monetários em R$, percentuais de 0 a 100.

export type ItemCusto = {
  item: string;
  valor_mensal: number;
  /** Quem paga no aluguel tradicional. Na temporada o proprietário paga todos. */
  pago_por_no_tradicional: "inquilino" | "proprietario";
};

export type Entradas = {
  temporada: {
    diaria_media: number;
    ocupacao_pct: number;
    estadia_media_noites: number;
    /** Taxa de limpeza cobrada do hóspede, por estadia. */
    taxa_limpeza_hospede: number;
    /** Custo de limpeza pago pelo proprietário, por estadia. */
    limpeza_por_estadia: number;
    lavanderia_por_estadia: number;
    consumiveis_por_noite: number;
    taxa_airbnb_pct: number;
    plano: PlanoId;
    /** Taxa Seazone (%) efetiva; padrão é a do plano. */
    taxa_gestao_pct: number;
  };
  tradicional: {
    aluguel_mensal: number;
    vacancia_meses_ano: number;
    administracao_pct: number;
  };
  /** Custos comuns às duas modalidades (campo único de custos do imóvel). */
  custos_comuns: ItemCusto[];
  implantacao: {
    adesao: number;
    enxoval_e_itens: number;
    outros: number; // chaves, 1ª limpeza etc.
  };
  /** Alíquota simplificada aplicada ao líquido positivo das duas modalidades. 0 = ignorar. */
  aliquota_ir_pct: number;
};

export type ResultadoTemporada = {
  noites_ocupadas: number;
  estadias: number;
  receita_diarias: number;
  receita_limpeza: number;
  receita_bruta: number;
  taxa_airbnb: number;
  base_gestao: number;
  taxa_gestao: number;
  custo_limpeza: number;
  custo_lavanderia: number;
  custo_consumiveis: number;
  custos_comuns: number;
  liquido_antes_ir: number;
  imposto: number;
  liquido_anos_seguintes: number;
  implantacao: number;
  liquido_primeiro_ano: number;
};

export type ResultadoTradicional = {
  meses_ocupados: number;
  aluguel_bruto: number;
  administracao: number;
  custos_comuns_proprietario: number;
  liquido_antes_ir: number;
  imposto: number;
  liquido_anual: number;
};

export type Viabilidade = "EXCELENTE" | "VIÁVEL" | "MARGINAL" | "NÃO-VIÁVEL";

export type Comparativo = {
  diferenca_anual: number;
  /** Diferença relativa ao líquido tradicional, em %. null quando o tradicional é <= 0. */
  diferenca_pct: number | null;
  viabilidade: Viabilidade;
  /** Meses para recuperar a implantação com a vantagem da temporada. null = não se paga. */
  breakeven_meses: number | null;
};

const soma = (v: number[]) => v.reduce((s, x) => s + x, 0);
const pct = (v: number) => v / 100;
const ir = (base: number, aliquota: number) => (base > 0 ? base * pct(aliquota) : 0);

export function calcTemporada(e: Entradas): ResultadoTemporada {
  const t = e.temporada;
  const noites = 365 * pct(t.ocupacao_pct);
  const estadias = t.estadia_media_noites > 0 ? noites / t.estadia_media_noites : 0;

  const receita_diarias = noites * t.diaria_media;
  const receita_limpeza = estadias * t.taxa_limpeza_hospede;
  const receita_bruta = receita_diarias + receita_limpeza;

  // A taxa do Airbnb incide sobre diária + taxas extras; a Seazone cobra sobre o que resta.
  const taxa_airbnb = receita_bruta * pct(t.taxa_airbnb_pct);
  const base_gestao = receita_bruta - taxa_airbnb;
  const taxa_gestao = base_gestao * pct(t.taxa_gestao_pct);

  // Nos planos Seazone, limpeza e lavanderia já estão dentro da taxa de gestão.
  const incluidas = PLANOS[t.plano].limpeza_lavanderia_incluidas;
  const custo_limpeza = incluidas ? 0 : estadias * t.limpeza_por_estadia;
  const custo_lavanderia = incluidas ? 0 : estadias * t.lavanderia_por_estadia;
  const custo_consumiveis = noites * t.consumiveis_por_noite;
  const custos_comuns = 12 * soma(e.custos_comuns.map((c) => c.valor_mensal));

  const liquido_antes_ir =
    base_gestao - taxa_gestao - custo_limpeza - custo_lavanderia - custo_consumiveis - custos_comuns;
  const imposto = ir(liquido_antes_ir, e.aliquota_ir_pct);
  const liquido_anos_seguintes = liquido_antes_ir - imposto;
  const implantacao = e.implantacao.adesao + e.implantacao.enxoval_e_itens + e.implantacao.outros;

  return {
    noites_ocupadas: noites,
    estadias,
    receita_diarias,
    receita_limpeza,
    receita_bruta,
    taxa_airbnb,
    base_gestao,
    taxa_gestao,
    custo_limpeza,
    custo_lavanderia,
    custo_consumiveis,
    custos_comuns,
    liquido_antes_ir,
    imposto,
    liquido_anos_seguintes,
    implantacao,
    liquido_primeiro_ano: liquido_anos_seguintes - implantacao,
  };
}

export function calcTradicional(e: Entradas): ResultadoTradicional {
  const t = e.tradicional;
  const vacancia = Math.min(Math.max(t.vacancia_meses_ano, 0), 12);
  const meses_ocupados = 12 - vacancia;

  const aluguel_bruto = t.aluguel_mensal * meses_ocupados;
  const administracao = aluguel_bruto * pct(t.administracao_pct);

  // Com inquilino, o proprietário paga só os itens que cabem a ele. Nos meses de
  // vacância, todos os custos do imóvel voltam para o proprietário.
  const doProprietario = soma(
    e.custos_comuns.filter((c) => c.pago_por_no_tradicional === "proprietario").map((c) => c.valor_mensal),
  );
  const todos = soma(e.custos_comuns.map((c) => c.valor_mensal));
  const custos_comuns_proprietario = meses_ocupados * doProprietario + vacancia * todos;

  const liquido_antes_ir = aluguel_bruto - administracao - custos_comuns_proprietario;
  const imposto = ir(liquido_antes_ir, e.aliquota_ir_pct);

  return {
    meses_ocupados,
    aluguel_bruto,
    administracao,
    custos_comuns_proprietario,
    liquido_antes_ir,
    imposto,
    liquido_anual: liquido_antes_ir - imposto,
  };
}

export function classificar(temporada: number, tradicional: number): Viabilidade {
  const diferenca = temporada - tradicional;
  if (tradicional <= 0) return diferenca > 0 ? "EXCELENTE" : "NÃO-VIÁVEL";
  const percentual = (diferenca / tradicional) * 100;
  if (percentual >= 200) return "EXCELENTE";
  if (percentual >= 50) return "VIÁVEL";
  if (percentual >= 0) return "MARGINAL";
  return "NÃO-VIÁVEL";
}

export function comparar(t: ResultadoTemporada, d: ResultadoTradicional): Comparativo {
  const diferenca_anual = t.liquido_anos_seguintes - d.liquido_anual;
  const diferenca_pct = d.liquido_anual > 0 ? (diferenca_anual / d.liquido_anual) * 100 : null;
  const breakeven_meses = diferenca_anual > 0 ? t.implantacao / (diferenca_anual / 12) : null;
  return {
    diferenca_anual,
    diferenca_pct,
    viabilidade: classificar(t.liquido_anos_seguintes, d.liquido_anual),
    breakeven_meses,
  };
}

/** Líquido anual da temporada em cada plano (e na autogestão), para comparar modalidades. */
export function compararPlanos(e: Entradas): { plano: PlanoId; nome: string; liquido: number; implantacao: number }[] {
  return PLANO_IDS.map((id) => {
    const p = PLANOS[id];
    const r = calcTemporada({
      ...e,
      temporada: { ...e.temporada, plano: id, taxa_gestao_pct: p.taxa_pct },
      implantacao: { ...e.implantacao, adesao: p.adesao },
    });
    return { plano: id, nome: p.nome, liquido: r.liquido_anos_seguintes, implantacao: r.implantacao };
  });
}

export function formatNumber(n: number): string {
  return n.toLocaleString("pt-BR", { maximumFractionDigits: 0 });
}

export function formatCurrency(n: number): string {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
