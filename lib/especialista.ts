import { z } from "zod";

// Contrato de dados do especialista. A IA só traz dados de mercado em NÍVEL ANUAL;
// sazonalidade mensal e todo o cálculo financeiro são feitos pelo sistema
// (lib/calculations.ts), nunca pela IA.

const num = z.number();
const numOuNull = z.number().nullable();
const pct = z.number().min(0).max(100);

export const ITENS_CUSTO = ["condominio", "iptu", "energia", "agua", "gas", "internet"] as const;

export const respostaSchema = z.object({
  localizacao_normalizada: z.string(),
  cidade: z.string(),
  uf: z.string(),
  perfil_imovel: z.object({
    area_m2: numOuNull,
    quartos: numOuNull, // 0 para studio/kitnet
    capacidade_hospedes: numOuNull,
    mobiliado: z.boolean().nullable(),
  }),
  viabilidade_do_tipo: z.object({
    status: z.enum(["compativel", "incomum", "inexistente"]),
    observacao: z.string(),
  }),
  risco_regulatorio: z.object({
    restricao_condominio: z.enum(["provavel", "possivel", "improvavel", "desconhecido"]),
    observacao: z.string(),
  }),
  temporada: z.object({
    preco_minimo: num,
    preco_medio: num,
    preco_maximo: num,
    ocupacao_anual_pct: pct,
    ocupacao_anual_min_pct: pct,
    ocupacao_anual_max_pct: pct,
    base_ocupacao: z.enum(["boletim_oficial", "relatorio_mercado", "comparaveis", "estimativa"]),
    estadia_media_noites: numOuNull,
    taxa_limpeza_cobrada_hospede: numOuNull,
    sazonalidade_resumo: z.string(),
  }),
  tradicional: z.object({
    aluguel_mensal_min: num,
    aluguel_mensal_mediano: num,
    aluguel_mensal_max: num,
    vacancia_meses_ano: numOuNull,
  }),
  custos_comuns_estimados: z.array(
    z.object({
      item: z.enum(ITENS_CUSTO),
      valor_mensal: numOuNull,
      pago_por_no_tradicional: z.enum(["inquilino", "proprietario"]),
    }),
  ),
  custos_operacionais: z.object({
    limpeza_por_estadia: numOuNull,
    lavanderia_por_estadia: numOuNull,
    consumiveis_por_noite: numOuNull,
  }),
  implantacao: z.object({
    mobilia_e_enxoval_estimado: numOuNull,
  }),
  comparaveis: z
    .array(
      z.object({
        descricao: z.string(),
        url: z.string().nullable(),
        tipo: z.enum(["airbnb", "temporada_portal", "aluguel_residencial"]),
        valor: numOuNull,
        distancia_km: numOuNull,
      }),
    )
    .max(8),
  fontes: z.array(
    z.object({
      nome: z.string(),
      url: z.string().nullable(),
      referencia: z.string(),
    }),
  ),
  confianca: z.enum(["alta", "media", "baixa"]),
  fatores_regionais: z.string(),
  estrategia_precificacao: z.string(),
  premissas: z.array(z.string()),
  alertas: z.array(z.string()),
});

export type RespostaEspecialista = z.infer<typeof respostaSchema>;

const SYSTEM = `Você é um analista sênior de mercado imobiliário brasileiro, especializado em aluguel por temporada (Airbnb) e em locação residencial tradicional.

Sua tarefa é levantar DADOS DE MERCADO, em NÍVEL ANUAL, para um imóvel. Você NÃO calcula lucro, impostos, taxas de gestão, viabilidade financeira nem curva mensal de sazonalidade: isso é feito pelo sistema.

PROCESSO
1. Interprete a localização (bairro, cidade, UF) e o tipo do imóvel (área, quartos, mobília, diferenciais).
2. Verifique se o tipo existe na região. Exemplo: casa ou sobrado em bairro só de prédios. Se for improvável ou inexistente, preencha viabilidade_do_tipo (incomum ou inexistente), explique, e use como referência o tipo mais comum da região, dizendo isso nas premissas.
3. Use a busca na web para encontrar:
   a) comparáveis de temporada na região: anúncios do Airbnb (tipo "airbnb") e anúncios de temporada em portais imobiliários (tipo "temporada_portal"), com perfil semelhante (mesmo número de quartos, padrão parecido, raio de até 2 km; amplie e registre se faltar amostra);
   b) comparáveis de aluguel residencial tradicional (tipo "aluguel_residencial"): SOMENTE anúncios de aluguel. Anúncio de venda NUNCA é comparável de aluguel;
   c) médias anuais de ocupação e diária do Airbnb para a região ou cidade.
4. Estime a diária média (ADR) e a ocupação ANUAL (central, mínima e máxima) para o imóvel. Não devolva valores mês a mês. Descreva a sazonalidade apenas em texto qualitativo (quais períodos são fortes ou fracos e por quê), sem números mensais.
5. Liste os custos recorrentes do imóvel (condomínio, IPTU, energia, água, gás, internet) com valor MENSAL quando houver base; senão valor_mensal = null. Para cada item, indique quem normalmente paga no aluguel TRADICIONAL naquela praça: "inquilino" ou "proprietario" (use os próprios anúncios de aluguel: "+ condomínio, IPTU" indica inquilino). No aluguel por temporada o proprietário paga todos.
6. Avalie o risco de o condomínio proibir ou restringir temporada (risco_regulatorio).
7. Antes de responder, revise: coerência dos números, tipos dos comparáveis, ordem mínimo <= central <= máximo.

FONTES PARA OCUPAÇÃO E DIÁRIA (ordem de preferência)
1. Boletins e indicadores OFICIAIS da região, publicados por órgãos oficiais: Observatório do Turismo do DF (observatoriodoturismo.df.gov.br) e equivalentes de outros estados e municípios, Ministério do Turismo, ANAC, Embratur, IBGE. Eles tratam de hotelaria e fluxo turístico: use-os só como INDICADOR de nível de demanda, nunca como ocupação de short stay.
2. Relatórios de mercado de short stay: Airbtics, BNBCalc, AirDNA, Hostnjoy, Seazone, InFOHB, estudos do Airbnb.
3. Comparáveis diretos de anúncios na região.
4. Seu conhecimento geral, apenas como último recurso.
- Informe em "temporada.base_ocupacao" de onde veio o número: "boletim_oficial", "relatorio_mercado", "comparaveis" ou "estimativa".
- Se NÃO encontrar boletim oficial, diga isso em "alertas". Nunca atribua um número a uma fonte que você não leu.
- Cite cada fonte em "fontes" com nome, url e referência (mês/ano ou período dos dados).
- Um dado de um único período (por exemplo, "junho") não representa o ano inteiro.
- Se as fontes divergirem muito, mostre a faixa em ocupacao_anual_min_pct e ocupacao_anual_max_pct e explique nos alertas qual você adotou e por quê.

REGRAS DE QUALIDADE
- Valores em reais (BRL), números puros, sem símbolo e sem texto dentro de campos numéricos. Percentuais de 0 a 100.
- Ocupação é a % de noites vendidas no ano. Diária é o valor da noite SEM taxa de limpeza e SEM taxas do Airbnb.
- Custos mensais são valores por MÊS.
- preco_minimo <= preco_medio <= preco_maximo; ocupacao_anual_min_pct <= ocupacao_anual_pct <= ocupacao_anual_max_pct.
- Se a diária adotada diferir mais de 30% da mediana dos comparáveis ou da fonte citada, explique nos alertas.
- Studio, kitnet ou quarto-sala: quartos = 0.
- Em cada comparável, "valor" é a diária (temporada) ou o aluguel mensal (residencial) que você LEU no anúncio. Se o preço não estiver visível, use null. Nunca estime nem arredonde o preço de um anúncio.
- Para "pago_por_no_tradicional", baseie-se no texto dos anúncios de aluguel ("+ condomínio, IPTU" indica inquilino). Se não houver evidência, use "inquilino" (prática de mercado) e avise em "alertas".
- "mobilia_e_enxoval_estimado": use null quando não houver base. Não use 0 para significar "não sei".
- Nunca invente dado. Se não houver base, use null e explique em "alertas". Não escreva percentuais ou números sem sentido nos textos.
- Seja conservador: na dúvida, prefira o cenário que reduz a receita.
- Cite no máximo 8 comparáveis, todos reais e verificáveis (com URL). Não fabrique anúncios, nomes ou links. O tipo do comparável deve corresponder à fonte real (um anúncio de portal imobiliário NÃO é "airbnb").
- "confianca": "alta" só com boletim oficial E pelo menos 5 comparáveis de temporada próximos; "media" com pelo menos 3 comparáveis de temporada, nunca "alta" sem boletim oficial; "baixa" com menos de 3 comparáveis de temporada ou dados só indiretos.
- Responda APENAS com o JSON no formato abaixo, em um único bloco de código json, sem texto antes ou depois.`;

const FORMATO = `{
  "localizacao_normalizada": "string",
  "cidade": "string",
  "uf": "string",
  "perfil_imovel": { "area_m2": number|null, "quartos": number|null, "capacidade_hospedes": number|null, "mobiliado": boolean|null },
  "viabilidade_do_tipo": { "status": "compativel"|"incomum"|"inexistente", "observacao": "string" },
  "risco_regulatorio": { "restricao_condominio": "provavel"|"possivel"|"improvavel"|"desconhecido", "observacao": "string" },
  "temporada": {
    "preco_minimo": number, "preco_medio": number, "preco_maximo": number,
    "ocupacao_anual_pct": number, "ocupacao_anual_min_pct": number, "ocupacao_anual_max_pct": number,
    "base_ocupacao": "boletim_oficial"|"relatorio_mercado"|"comparaveis"|"estimativa",
    "estadia_media_noites": number|null,
    "taxa_limpeza_cobrada_hospede": number|null,
    "sazonalidade_resumo": "string (qualitativo, sem números mensais)"
  },
  "tradicional": { "aluguel_mensal_min": number, "aluguel_mensal_mediano": number, "aluguel_mensal_max": number, "vacancia_meses_ano": number|null },
  "custos_comuns_estimados": [ { "item": "condominio"|"iptu"|"energia"|"agua"|"gas"|"internet", "valor_mensal": number|null, "pago_por_no_tradicional": "inquilino"|"proprietario" } ],
  "custos_operacionais": { "limpeza_por_estadia": number|null, "lavanderia_por_estadia": number|null, "consumiveis_por_noite": number|null },
  "implantacao": { "mobilia_e_enxoval_estimado": number|null },
  "comparaveis": [ { "descricao": "string", "url": "string"|null, "tipo": "airbnb"|"temporada_portal"|"aluguel_residencial", "valor": number|null, "distancia_km": number|null } ],
  "fontes": [ { "nome": "string", "url": "string"|null, "referencia": "string" } ],
  "confianca": "alta"|"media"|"baixa",
  "fatores_regionais": "string",
  "estrategia_precificacao": "string",
  "premissas": ["string"],
  "alertas": ["string"]
}`;

export function montarPrompt(localizacao: string, tipo: string, hoje = new Date()): string {
  const data = hoje.toLocaleDateString("pt-BR");
  return `${SYSTEM}

FORMATO DE SAÍDA (exatamente estas chaves, incluindo um item em custos_comuns_estimados para cada um dos 6 itens):
${FORMATO}

Localização: ${localizacao.trim()}
Tipo do imóvel: ${tipo.trim()}
Data de hoje: ${data}

Levante os dados de mercado conforme o formato.`;
}

const mediana = (v: number[]) => {
  const s = [...v].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

// Extrai o JSON de uma resposta colada (com ou sem cercas ```json).
export function lerResposta(texto: string):
  | { ok: true; dados: RespostaEspecialista; avisos: string[] }
  | { ok: false; erros: string[] } {
  const limpo = texto.replace(/```json\s*/gi, "").replace(/```/g, "").trim();
  const inicio = limpo.indexOf("{");
  const fim = limpo.lastIndexOf("}");
  if (inicio === -1 || fim <= inicio) {
    return { ok: false, erros: ["Nenhum JSON encontrado no texto colado."] };
  }
  let bruto: unknown;
  try {
    bruto = JSON.parse(limpo.slice(inicio, fim + 1));
  } catch (e) {
    return { ok: false, erros: [`JSON inválido: ${(e as Error).message}`] };
  }
  const r = respostaSchema.safeParse(bruto);
  if (!r.success) {
    return {
      ok: false,
      erros: r.error.issues.map((i) => `${i.path.join(".") || "(raiz)"}: ${i.message}`),
    };
  }
  const d = r.data;
  const t = d.temporada;
  const avisos: string[] = [];

  if (!(t.preco_minimo <= t.preco_medio && t.preco_medio <= t.preco_maximo)) {
    avisos.push("Diárias fora de ordem (mínimo <= médio <= máximo).");
  }
  if (!(t.ocupacao_anual_min_pct <= t.ocupacao_anual_pct && t.ocupacao_anual_pct <= t.ocupacao_anual_max_pct)) {
    avisos.push("Ocupação fora de ordem (mínima <= central <= máxima).");
  }
  if (d.viabilidade_do_tipo.status !== "compativel") {
    avisos.push(`Tipo de imóvel ${d.viabilidade_do_tipo.status} na região: ${d.viabilidade_do_tipo.observacao}`);
  }
  if (d.risco_regulatorio.restricao_condominio === "provavel" || d.risco_regulatorio.restricao_condominio === "possivel") {
    avisos.push("Risco de o condomínio restringir aluguel por temporada: confira a convenção.");
  }
  if (t.base_ocupacao === "estimativa") {
    avisos.push("Ocupação baseada em estimativa, sem boletim, relatório ou comparáveis.");
  }

  const temporada = d.comparaveis.filter((c) => c.tipo !== "aluguel_residencial");
  const comPreco = temporada.filter((c): c is typeof c & { valor: number } => c.valor !== null);
  if (comPreco.length < 3) {
    avisos.push(
      `Apenas ${comPreco.length} comparável(is) de temporada com preço visível (de ${temporada.length}): amostra insuficiente para a diária.`,
    );
  }
  if (comPreco.length >= 1) {
    const med = mediana(comPreco.map((c) => c.valor));
    if (Math.abs(t.preco_medio - med) / med > 0.3) {
      avisos.push(
        `Diária média (${t.preco_medio}) difere mais de 30% da mediana dos comparáveis de temporada com preço (${med.toFixed(0)}, ${comPreco.length} anúncio(s)).`,
      );
    }
  }
  if (d.confianca !== "baixa" && comPreco.length < 3) {
    avisos.push(`Confiança '${d.confianca}' com menos de 3 comparáveis de temporada com preço: o prompt exige 'baixa'.`);
  }
  if (d.comparaveis.some((c) => !c.url)) {
    avisos.push("Há comparáveis sem URL: não dá para verificar.");
  }
  if (d.comparaveis.some((c) => c.tipo === "aluguel_residencial" && /\/venda|-venda-/i.test(c.url ?? ""))) {
    avisos.push("Um comparável de aluguel tem 'venda' na URL: pode ser anúncio de venda.");
  }
  if (d.confianca === "alta" && t.base_ocupacao !== "boletim_oficial") {
    avisos.push("Confiança 'alta' sem boletim oficial: inconsistente com as regras do prompt.");
  }
  const faltando = ITENS_CUSTO.filter((i) => d.custos_comuns_estimados.find((c) => c.item === i)?.valor_mensal == null);
  if (faltando.length > 0) {
    avisos.push(`Custos sem valor (preencher manualmente): ${faltando.join(", ")}.`);
  }
  return { ok: true, dados: d, avisos };
}
