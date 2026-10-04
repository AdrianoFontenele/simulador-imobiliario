// Taxas e planos usados nos cálculos. Valores editáveis na tela; aqui ficam os padrões.

export type PlanoId = "autogestao" | "essencial" | "plus" | "safe" | "premium";

export type Plano = {
  nome: string;
  /** Taxa Seazone (%) sobre as reservas já descontada a taxa da plataforma. */
  taxa_pct: number;
  /** Taxa de adesão (R$), cobrada uma única vez. */
  adesao: number;
  gestao_contas: boolean;
  seguro: boolean;
  /** Limpeza, lavanderia e consumíveis já estão incluídos na taxa do plano (não são custo à parte). */
  operacao_incluida: boolean;
};

// Fonte: proposta comercial Seazone (valores cheios, sem promoção) e minuta de contrato
// (cláusula 3.3: taxa sobre reservas já descontadas as taxas das plataformas).
// Gestão de contas e seguro EasyCover estão embutidos na taxa quando incluídos no plano
// (cláusulas 3.5 e 3.6). O valor das contas em si continua sendo do proprietário.
// Limpeza, lavanderia e consumíveis estão incluídos na taxa de todos os planos Seazone (informado pelo dono).
export const PLANOS: Record<PlanoId, Plano> = {
  autogestao: { nome: "Autogestão (sem Seazone)", taxa_pct: 0, adesao: 0, gestao_contas: false, seguro: false, operacao_incluida: false },
  essencial: { nome: "Essencial", taxa_pct: 25, adesao: 1499, gestao_contas: false, seguro: false, operacao_incluida: true },
  plus: { nome: "Plus", taxa_pct: 27, adesao: 1499, gestao_contas: true, seguro: false, operacao_incluida: true },
  safe: { nome: "Safe", taxa_pct: 27, adesao: 1499, gestao_contas: false, seguro: true, operacao_incluida: true },
  premium: { nome: "Premium", taxa_pct: 28, adesao: 1499, gestao_contas: true, seguro: true, operacao_incluida: true },
};

export const PLANO_IDS = Object.keys(PLANOS) as PlanoId[];

// Airbnb Brasil, taxa única de 16% paga pelo anfitrião, sobre diária + taxas extras
// (limpeza, pet etc.). Fonte: central de ajuda do Airbnb. Impostos sobre a taxa: 0 por padrão.
export const AIRBNB_TAXA_PCT = 16;

// Aluguel tradicional.
export const ADMINISTRACAO_IMOBILIARIA_PCT = 8; // padrão; 0 se locação direta
export const VACANCIA_MESES_PADRAO = 1;
