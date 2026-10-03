import { z } from "zod";

// Contrato de dados do especialista. A IA só traz dados de mercado; todo o
// cálculo financeiro é feito em lib/calculations.ts.

const num = z.number();
const numOuNull = z.number().nullable();

export const respostaSchema = z.object({
  localizacao_normalizada: z.string(),
  cidade: z.string(),
  uf: z.string(),
  perfil_imovel: z.object({
    area_m2: numOuNull,
    quartos: numOuNull,
    capacidade_hospedes: numOuNull,
  }),
  temporada: z.object({
    preco_minimo: num,
    preco_medio: num,
    preco_maximo: num,
    meses: z
      .array(
        z.object({
          mes: z.number().int().min(1).max(12),
          diaria: num,
          ocupacao_pct: z.number().min(0).max(100),
          classificacao: z.enum(["alta", "media", "baixa"]),
          fonte_periodo: z.string().nullable(),
        }),
      )
      .length(12),
    estadia_media_noites: numOuNull,
    taxa_limpeza_cobrada_hospede: numOuNull,
    base_ocupacao: z.enum([
      "boletim_oficial",
      "relatorio_mercado",
      "comparaveis",
      "estimativa",
    ]),
    sazonalidade_resumo: z.string(),
  }),
  tradicional: z.object({
    aluguel_mensal_min: num,
    aluguel_mensal_mediano: num,
    aluguel_mensal_max: num,
    vacancia_meses_ano: numOuNull,
  }),
  custos_comuns_estimados: z.object({
    condominio: numOuNull,
    iptu: numOuNull,
    energia: numOuNull,
    agua: numOuNull,
    internet: numOuNull,
    pagos_pelo_inquilino_no_tradicional: z.array(z.string()),
  }),
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
        tipo: z.enum(["airbnb", "residencial"]),
        valor: num,
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

Sua tarefa é levantar DADOS DE MERCADO para um imóvel. Você NÃO calcula lucro, impostos, taxas de gestão ou viabilidade: isso é feito pelo sistema.

PROCESSO
1. Interprete a localização (bairro, cidade, UF) e o tipo do imóvel (área, quartos, mobília, diferenciais como piscina ou vista).
2. Use a busca na web para encontrar comparáveis reais: anúncios ativos no Airbnb na mesma região com perfil semelhante (mesmo número de quartos, padrão parecido, raio de até 2 km; amplie e registre se faltar amostra) e anúncios de aluguel residencial equivalentes (QuintoAndar, ZAP, VivaReal, OLX).
3. Estime a diária média (ADR) e a ocupação MÊS A MÊS (jan a dez) para ESTA cidade. Considere feriados, férias escolares, eventos, clima e perfil do hóspede local (turismo, negócios, eventos, saúde). Não use um padrão genérico de praia para uma cidade que não é de praia.
4. Estime os custos recorrentes do imóvel (condomínio, IPTU, energia, água, internet) quando houver base para isso. Se não houver, devolva null.
5. Indique quais custos comuns normalmente são pagos pelo INQUILINO no aluguel tradicional naquela praça.

FONTES PARA OCUPAÇÃO E DIÁRIA (ordem de preferência)
1. BOLETINS OFICIAIS MENSAIS da região do imóvel, publicados por órgãos oficiais: Ministério do Turismo, secretarias e observatórios de turismo estaduais e municipais, ANAC (fluxo aéreo mensal como indicador de demanda), Embratur e IBGE, quando houver. Para cada mês de jan a dez, busque o boletim mais recente que traga ocupação por período e use o mesmo mês de anos anteriores para compor a sazonalidade. Complementos do setor: InFOHB (fohb.com.br) e relatórios da Seazone.
2. Agregadores de dados do Airbnb (AirDNA, Airbtics, Hostnjoy) e comparáveis diretos de anúncios na região, para calibrar o nível de ocupação do short stay.
3. Seu conhecimento geral, apenas como último recurso.
- Ocupação hoteleira NÃO é ocupação de short stay: use-a só como indicador de SAZONALIDADE (qual mês é mais forte ou fraco) e ajuste o nível pelo que o Airbnb local mostra.
- Se NÃO encontrar boletim oficial para a região, diga isso explicitamente em "alertas" e use base_ocupacao = "estimativa" ou "comparaveis". Nunca atribua um número a um boletim que você não leu.
- Para cada mês, preencha "fonte_periodo" com o nome do boletim e o período de referência (ex.: "Boletim X, jul/2026"), ou null se não houver.
- Informe em "temporada.base_ocupacao" de onde veio o número: "boletim_oficial", "relatorio_mercado", "comparaveis" ou "estimativa". Cite cada fonte em "fontes" com nome, url e referência (mês/ano).

REGRAS DE QUALIDADE
- Valores em reais (BRL), números puros, sem símbolo e sem texto dentro de campos numéricos. Percentuais de 0 a 100. Ocupação é a % de noites vendidas no mês.
- Diária é o valor da noite SEM taxa de limpeza e SEM taxas do Airbnb.
- Custos mensais (condomínio, IPTU, energia, água, internet) são valores por MÊS.
- Cada valor deve ser coerente: preco_minimo <= preco_medio <= preco_maximo; a média das diárias mensais deve ficar próxima de preco_medio.
- Nunca invente dado. Se não houver base, use null e explique em "alertas".
- Seja conservador: na dúvida, prefira o cenário que reduz a receita.
- Cite no máximo 8 comparáveis, todos reais e verificáveis (com URL). Não fabrique anúncios, nomes ou links.
- "confianca" reflete a qualidade da amostra: alta (>= 8 comparáveis próximos e boletim oficial), media (4 a 7), baixa (< 4 ou dados indiretos).
- "meses" deve ter exatamente 12 itens, mes de 1 a 12.
- Responda APENAS com o JSON no formato abaixo, em um único bloco de código json, sem texto antes ou depois.`;

const FORMATO = `{
  "localizacao_normalizada": "string",
  "cidade": "string",
  "uf": "string",
  "perfil_imovel": { "area_m2": number|null, "quartos": number|null, "capacidade_hospedes": number|null },
  "temporada": {
    "preco_minimo": number, "preco_medio": number, "preco_maximo": number,
    "meses": [ { "mes": 1, "diaria": number, "ocupacao_pct": number, "classificacao": "alta"|"media"|"baixa", "fonte_periodo": "string"|null } ],
    "estadia_media_noites": number|null,
    "taxa_limpeza_cobrada_hospede": number|null,
    "base_ocupacao": "boletim_oficial"|"relatorio_mercado"|"comparaveis"|"estimativa",
    "sazonalidade_resumo": "string"
  },
  "tradicional": { "aluguel_mensal_min": number, "aluguel_mensal_mediano": number, "aluguel_mensal_max": number, "vacancia_meses_ano": number|null },
  "custos_comuns_estimados": { "condominio": number|null, "iptu": number|null, "energia": number|null, "agua": number|null, "internet": number|null, "pagos_pelo_inquilino_no_tradicional": ["string"] },
  "custos_operacionais": { "limpeza_por_estadia": number|null, "lavanderia_por_estadia": number|null, "consumiveis_por_noite": number|null },
  "implantacao": { "mobilia_e_enxoval_estimado": number|null },
  "comparaveis": [ { "descricao": "string", "url": "string"|null, "tipo": "airbnb"|"residencial", "valor": number, "distancia_km": number|null } ],
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

FORMATO DE SAÍDA (exatamente estas chaves):
${FORMATO}

Localização: ${localizacao.trim()}
Tipo do imóvel: ${tipo.trim()}
Data de hoje: ${data}

Levante os dados de mercado conforme o formato.`;
}

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
  const avisos: string[] = [];
  const t = d.temporada;
  if (!(t.preco_minimo <= t.preco_medio && t.preco_medio <= t.preco_maximo)) {
    avisos.push("Preços fora de ordem (mínimo <= médio <= máximo).");
  }
  const meses = new Set(t.meses.map((m) => m.mes));
  if (meses.size !== 12) avisos.push("Os meses não cobrem 1 a 12 sem repetição.");
  const mediaDiaria = t.meses.reduce((s, m) => s + m.diaria, 0) / 12;
  if (Math.abs(mediaDiaria - t.preco_medio) / t.preco_medio > 0.25) {
    avisos.push(
      `A média das diárias mensais (${mediaDiaria.toFixed(0)}) difere mais de 25% do preço médio informado.`,
    );
  }
  if (t.base_ocupacao === "estimativa") {
    avisos.push("Ocupação baseada em estimativa, sem boletim ou comparáveis.");
  }
  if (d.comparaveis.some((c) => !c.url)) {
    avisos.push("Há comparáveis sem URL: não dá para verificar.");
  }
  return { ok: true, dados: d, avisos };
}
