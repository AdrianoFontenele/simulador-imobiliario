"use client";

import { useMemo, useState } from "react";
import {
  calcCenarios,
  calcTemporada,
  calcTradicional,
  comparar,
  compararPlanos,
  formatCurrency as brl,
  type Entradas,
  type ItemCusto,
  type Viabilidade,
} from "@/lib/calculations";
import {
  ADMINISTRACAO_IMOBILIARIA_PCT,
  AIRBNB_TAXA_PCT,
  PLANOS,
  PLANO_IDS,
  VACANCIA_MESES_PADRAO,
  type PlanoId,
} from "@/lib/config";
import type { RespostaEspecialista } from "@/lib/especialista";

const ROTULO_ITEM: Record<string, string> = {
  condominio: "Condomínio",
  iptu: "IPTU",
  energia: "Energia",
  agua: "Água",
  gas: "Gás",
  internet: "Internet",
};

const COR: Record<Viabilidade, string> = {
  EXCELENTE: "#34C759",
  "VIÁVEL": "#007AFF",
  MARGINAL: "#f59e0b",
  "NÃO-VIÁVEL": "#FF3B30",
};

function Campo(props: {
  label: string;
  valor: number;
  onChange: (v: number) => void;
  sufixo?: string;
  preencher?: boolean;
  step?: number;
  desativado?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-zinc-600">
        {props.label}
        {!props.desativado && props.preencher && props.valor === 0 && (
          <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-800">preencher</span>
        )}
      </span>
      <div className="flex items-center gap-2">
        <input
          type="number"
          inputMode="decimal"
          min={0}
          disabled={props.desativado}
          step={props.step ?? 1}
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 outline-none disabled:bg-zinc-100 disabled:text-zinc-400 transition focus:border-[#007AFF] focus:ring-4 focus:ring-[#007AFF]/15"
          value={Number.isFinite(props.valor) ? props.valor : 0}
          onChange={(e) => props.onChange(e.target.value === "" ? 0 : Number(e.target.value))}
        />
        {props.sufixo && <span className="text-zinc-500">{props.sufixo}</span>}
      </div>
    </label>
  );
}

function Linha({ rotulo, valor, negativo, forte }: { rotulo: string; valor: number; negativo?: boolean; forte?: boolean }) {
  return (
    <div className={`flex justify-between gap-4 py-1 ${forte ? "border-t border-zinc-200 pt-2 font-semibold" : ""}`}>
      <span className="text-zinc-600">{rotulo}</span>
      <span className={negativo ? "text-[#FF3B30]" : ""}>
        {negativo ? "- " : ""}
        {brl(Math.abs(valor) < 0.005 ? 0 : negativo ? Math.abs(valor) : valor)}
      </span>
    </div>
  );
}

export default function Simulacao({ dados }: { dados: RespostaEspecialista }) {
  const t0 = dados.temporada;
  const op = dados.custos_operacionais;

  const [diaria, setDiaria] = useState(t0.preco_medio);
  const [ocupacao, setOcupacao] = useState(t0.ocupacao_anual_pct);
  const [estadia, setEstadia] = useState(t0.estadia_media_noites ?? 3);
  const [taxaLimpezaHospede, setTaxaLimpezaHospede] = useState(t0.taxa_limpeza_cobrada_hospede ?? 0);
  const [limpeza, setLimpeza] = useState(op.limpeza_por_estadia ?? 0);
  const [lavanderia, setLavanderia] = useState(op.lavanderia_por_estadia ?? 0);
  const [consumiveis, setConsumiveis] = useState(op.consumiveis_por_noite ?? 0);
  const [taxaAirbnb, setTaxaAirbnb] = useState(AIRBNB_TAXA_PCT);

  const [plano, setPlano] = useState<PlanoId>("essencial");
  const [taxaGestao, setTaxaGestao] = useState(PLANOS.essencial.taxa_pct);
  const [adesao, setAdesao] = useState(PLANOS.essencial.adesao);

  const [aluguel, setAluguel] = useState(dados.tradicional.aluguel_mensal_mediano);
  const [vacancia, setVacancia] = useState(dados.tradicional.vacancia_meses_ano ?? VACANCIA_MESES_PADRAO);
  const [administracao, setAdministracao] = useState(ADMINISTRACAO_IMOBILIARIA_PCT);

  const [itens, setItens] = useState<ItemCusto[]>(
    dados.custos_comuns_estimados.map((c) => ({
      item: c.item,
      valor_mensal: c.valor_mensal ?? 0,
      pago_por_no_tradicional: c.pago_por_no_tradicional,
    })),
  );
  const nulos = useMemo(
    () => new Set<string>(dados.custos_comuns_estimados.filter((c) => c.valor_mensal === null).map((c) => c.item)),
    [dados],
  );

  const [enxoval, setEnxoval] = useState(dados.implantacao.mobilia_e_enxoval_estimado ?? 0);
  const [outros, setOutros] = useState(0);
  const [aliquotaIr, setAliquotaIr] = useState(0);

  const entradas: Entradas = {
    temporada: {
      diaria_media: diaria,
      ocupacao_pct: ocupacao,
      estadia_media_noites: estadia,
      taxa_limpeza_hospede: taxaLimpezaHospede,
      limpeza_por_estadia: limpeza,
      lavanderia_por_estadia: lavanderia,
      consumiveis_por_noite: consumiveis,
      taxa_airbnb_pct: taxaAirbnb,
      plano,
      taxa_gestao_pct: taxaGestao,
    },
    tradicional: { aluguel_mensal: aluguel, vacancia_meses_ano: vacancia, administracao_pct: administracao },
    custos_comuns: itens,
    implantacao: { adesao, enxoval_e_itens: enxoval, outros },
    aliquota_ir_pct: aliquotaIr,
  };

  const temp = calcTemporada(entradas);
  const trad = calcTradicional(entradas);
  const comp = comparar(temp, trad);
  const planos = compararPlanos(entradas);
  const cenarios = calcCenarios(entradas, {
    diaria_min: t0.preco_minimo,
    diaria_max: t0.preco_maximo,
    ocupacao_min_pct: t0.ocupacao_anual_min_pct,
    ocupacao_max_pct: t0.ocupacao_anual_max_pct,
  });

  function escolherPlano(id: PlanoId) {
    setPlano(id);
    setTaxaGestao(PLANOS[id].taxa_pct);
    setAdesao(PLANOS[id].adesao);
  }

  function atualizarItem(i: number, parcial: Partial<ItemCusto>) {
    setItens((atual) => atual.map((it, idx) => (idx === i ? { ...it, ...parcial } : it)));
  }

  const card = "rounded-xl border border-zinc-200 bg-white p-4 text-sm";
  const grade = "grid grid-cols-1 gap-3 sm:grid-cols-2";
  const p = PLANOS[plano];
  const limpezaIncluida = p.limpeza_lavanderia_incluidas;

  return (
    <section className="flex flex-col gap-6">
      <h2 className="text-lg font-semibold">4. Simulação do líquido anual</h2>
      <p className="text-sm text-zinc-600">
        Os campos vêm preenchidos com os dados do especialista e podem ser editados. Tudo é recalculado na hora, sem
        nova consulta.
      </p>

      <div className={card}>
        <p className="mb-3 font-medium">Temporada (Airbnb)</p>
        <div className={grade}>
          <Campo label="Diária média (R$)" valor={diaria} onChange={setDiaria} />
          <Campo label="Ocupação anual" valor={ocupacao} onChange={setOcupacao} sufixo="%" />
          <Campo label="Estadia média" valor={estadia} onChange={setEstadia} sufixo="noites" step={0.1} />
          <Campo label="Taxa de limpeza cobrada do hóspede (por estadia)" valor={taxaLimpezaHospede} onChange={setTaxaLimpezaHospede} />
          <Campo label="Custo de limpeza pago por você (por estadia)" valor={limpeza} onChange={setLimpeza} preencher={op.limpeza_por_estadia === null} desativado={limpezaIncluida} />
          <Campo label="Lavanderia (por estadia)" valor={lavanderia} onChange={setLavanderia} preencher={op.lavanderia_por_estadia === null} desativado={limpezaIncluida} />
          <Campo label="Consumíveis (por noite)" valor={consumiveis} onChange={setConsumiveis} preencher={op.consumiveis_por_noite === null} step={0.5} />
          <Campo label="Taxa do Airbnb" valor={taxaAirbnb} onChange={setTaxaAirbnb} sufixo="%" step={0.5} />
        </div>
        {limpezaIncluida && (
          <p className="mt-3 text-zinc-600">
            Limpeza e lavanderia estão incluídas na taxa do plano Seazone escolhido, então esses dois custos ficam zerados no cálculo. A taxa de limpeza que o hóspede paga continua como receita. Escolha Autogestão para informar esses custos.
          </p>
        )}
      </div>

      <div className={card}>
        <p className="mb-3 font-medium">Gestão</p>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-600">Modalidade</span>
          <select
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2"
            value={plano}
            onChange={(e) => escolherPlano(e.target.value as PlanoId)}
          >
            {PLANO_IDS.map((id) => (
              <option key={id} value={id}>
                {PLANOS[id].nome}
                {id !== "autogestao" ? ` - ${PLANOS[id].taxa_pct}%` : ""}
              </option>
            ))}
          </select>
        </label>
        <div className={`${grade} mt-3`}>
          <Campo label="Taxa Seazone" valor={taxaGestao} onChange={setTaxaGestao} sufixo="%" step={0.5} />
          <Campo label="Adesão (única)" valor={adesao} onChange={setAdesao} />
        </div>
        <p className="mt-3 text-zinc-600">
          A taxa Seazone incide sobre as reservas já descontada a taxa do Airbnb.
          {p.gestao_contas && " Inclui a gestão de contas: a Seazone paga as contas do imóvel, mas o valor delas continua sendo seu."}
          {p.seguro && " Inclui o seguro EasyCover."}
          {plano === "autogestao" && " Sem Seazone: você assume a operação, e não há taxa nem adesão."}
        </p>
      </div>

      <div className={card}>
        <p className="mb-3 font-medium">Aluguel tradicional</p>
        <div className={grade}>
          <Campo label="Aluguel mensal (R$)" valor={aluguel} onChange={setAluguel} />
          <Campo label="Vacância" valor={vacancia} onChange={setVacancia} sufixo="meses/ano" step={0.5} />
          <Campo label="Administração imobiliária" valor={administracao} onChange={setAdministracao} sufixo="%" step={0.5} />
        </div>
      </div>

      <div className={card}>
        <p className="mb-1 font-medium">Custos do imóvel (comuns às duas modalidades)</p>
        <p className="mb-3 text-zinc-600">
          Valores mensais, num campo único. Na temporada você paga todos. No aluguel tradicional, o que fica com o
          inquilino não entra no seu cálculo, a não ser nos meses de vacância, quando todos os custos voltam para você.
        </p>
        <div className="flex flex-col gap-3">
          {itens.map((it, i) => (
            <div key={it.item} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Campo
                label={`${ROTULO_ITEM[it.item] ?? it.item} (R$ por mês)`}
                valor={it.valor_mensal}
                onChange={(v) => atualizarItem(i, { valor_mensal: v })}
                preencher={nulos.has(it.item)}
              />
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-zinc-600">Quem paga no tradicional</span>
                <select
                  className="rounded-lg border border-zinc-300 bg-white px-3 py-2"
                  value={it.pago_por_no_tradicional}
                  onChange={(e) =>
                    atualizarItem(i, { pago_por_no_tradicional: e.target.value as ItemCusto["pago_por_no_tradicional"] })
                  }
                >
                  <option value="inquilino">Inquilino</option>
                  <option value="proprietario">Proprietário</option>
                </select>
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className={card}>
        <p className="mb-3 font-medium">Implantação (custos únicos da temporada) e imposto</p>
        <div className={grade}>
          <Campo label="Enxoval, mobília e itens mínimos" valor={enxoval} onChange={setEnxoval} preencher={dados.implantacao.mobilia_e_enxoval_estimado === null} />
          <Campo label="Outros (cópias de chave, 1ª limpeza)" valor={outros} onChange={setOutros} />
          <Campo label="Alíquota de imposto (simplificada, 0 = ignorar)" valor={aliquotaIr} onChange={setAliquotaIr} sufixo="%" step={0.5} />
        </div>
      </div>

      <div className="rounded-xl border-2 p-4" style={{ borderColor: COR[comp.viabilidade] }}>
        <p className="text-sm text-zinc-600">Resultado (líquido anual, a partir do 2º ano)</p>
        <p className="mt-1 text-2xl font-bold" style={{ color: COR[comp.viabilidade] }}>
          {comp.viabilidade}
        </p>
        <p className="mt-1 text-sm">
          Temporada {brl(temp.liquido_anos_seguintes)} contra tradicional {brl(trad.liquido_anual)}. Diferença de{" "}
          {brl(comp.diferenca_anual)} por ano
          {comp.diferenca_pct !== null ? ` (${comp.diferenca_pct.toFixed(0)}%)` : ""}.
        </p>
        <p className="mt-1 text-sm text-zinc-600">
          {comp.breakeven_meses === null
            ? "A temporada não rende mais que o tradicional, então a implantação não se paga."
            : `A implantação (${brl(temp.implantacao)}) se paga em ${comp.breakeven_meses.toFixed(1)} meses com a vantagem da temporada.`}
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
        <p className="p-3 pb-0 font-medium">Cenários da temporada</p>
        <p className="px-3 pt-1 text-sm text-zinc-600">
          Os dados de mercado variam entre fontes e consultas. O conservador usa a diária e a ocupação mínimas do
          especialista, o central usa os valores acima, e o otimista usa as máximas. As demais premissas não mudam.
        </p>
        <table className="mt-2 w-full text-left text-sm">
          <thead className="bg-zinc-50 text-zinc-600">
            <tr>
              <th className="p-3">Cenário</th>
              <th className="p-3">Diária</th>
              <th className="p-3">Ocupação</th>
              <th className="p-3">Líquido temporada</th>
              <th className="p-3">Contra o tradicional</th>
              <th className="p-3">Resultado</th>
            </tr>
          </thead>
          <tbody>
            {cenarios.map((c) => (
              <tr key={c.id} className={`border-t border-zinc-100 ${c.id === "central" ? "bg-[#007AFF]/5" : ""}`}>
                <td className="p-3">{c.nome}</td>
                <td className="p-3">{brl(c.diaria)}</td>
                <td className="p-3">{c.ocupacao_pct}%</td>
                <td className="p-3">{brl(c.temporada.liquido_anos_seguintes)}</td>
                <td className="p-3">{brl(c.comparativo.diferenca_anual)}</td>
                <td className="p-3 font-medium" style={{ color: COR[c.comparativo.viabilidade] }}>
                  {c.comparativo.viabilidade}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={grade}>
        <div className={card}>
          <p className="mb-2 font-medium">Temporada por ano</p>
          <Linha rotulo="Diárias" valor={temp.receita_diarias} />
          <Linha rotulo="Taxas de limpeza cobradas" valor={temp.receita_limpeza} />
          <Linha rotulo="Receita bruta" valor={temp.receita_bruta} forte />
          <Linha rotulo="Taxa do Airbnb" valor={temp.taxa_airbnb} negativo />
          <Linha rotulo={`Taxa de gestão (${taxaGestao}%)`} valor={temp.taxa_gestao} negativo />
          {limpezaIncluida ? (
            <div className="flex justify-between gap-4 py-1">
              <span className="text-zinc-600">Limpeza e lavanderia</span>
              <span className="text-zinc-500">incluídas na taxa</span>
            </div>
          ) : (
            <Linha rotulo="Limpeza e lavanderia" valor={temp.custo_limpeza + temp.custo_lavanderia} negativo />
          )}
          <Linha rotulo="Consumíveis" valor={temp.custo_consumiveis} negativo />
          <Linha rotulo="Custos do imóvel" valor={temp.custos_comuns} negativo />
          {temp.imposto > 0 && <Linha rotulo="Imposto" valor={temp.imposto} negativo />}
          <Linha rotulo="Líquido (2º ano em diante)" valor={temp.liquido_anos_seguintes} forte />
          <Linha rotulo="Implantação (1º ano)" valor={temp.implantacao} negativo />
          <Linha rotulo="Líquido do 1º ano" valor={temp.liquido_primeiro_ano} forte />
        </div>
        <div className={card}>
          <p className="mb-2 font-medium">Tradicional por ano</p>
          <Linha rotulo={`Aluguel (${trad.meses_ocupados.toFixed(1)} meses ocupados)`} valor={trad.aluguel_bruto} />
          <Linha rotulo={`Administração (${administracao}%)`} valor={trad.administracao} negativo />
          <Linha rotulo="Custos que ficam com você" valor={trad.custos_comuns_proprietario} negativo />
          {trad.imposto > 0 && <Linha rotulo="Imposto" valor={trad.imposto} negativo />}
          <Linha rotulo="Líquido anual" valor={trad.liquido_anual} forte />
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 text-zinc-600">
            <tr>
              <th className="p-3">Modalidade de gestão</th>
              <th className="p-3">Líquido anual (temporada)</th>
              <th className="p-3">Implantação</th>
              <th className="p-3">Contra o tradicional</th>
            </tr>
          </thead>
          <tbody>
            {planos.map((r) => (
              <tr key={r.plano} className={`border-t border-zinc-100 ${r.plano === plano ? "bg-[#007AFF]/5" : ""}`}>
                <td className="p-3">{r.nome}</td>
                <td className="p-3">{brl(r.liquido)}</td>
                <td className="p-3">{brl(r.implantacao)}</td>
                <td className="p-3">{brl(r.liquido - trad.liquido_anual)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <details className={card}>
        <summary className="cursor-pointer font-medium">Como o cálculo funciona</summary>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-zinc-700">
          <li>Noites ocupadas = 365 x ocupação. Receita das diárias = noites x diária média.</li>
          <li>Estadias = noites ocupadas / estadia média. A taxa de limpeza cobrada entra como receita. A limpeza e a lavanderia pagas por você entram como custo a cada estadia, exceto nos planos Seazone, que já as incluem na taxa.</li>
          <li>A taxa do Airbnb incide sobre diária e taxa de limpeza. A taxa de gestão incide sobre o que sobra depois dela.</li>
          <li>Custos do imóvel (condomínio, IPTU, contas) são seus em todos os meses da temporada, pois o hóspede não paga contas.</li>
          <li>No tradicional, o inquilino costuma pagar condomínio, IPTU e contas. Esses itens ficam fora do seu cálculo enquanto o imóvel está alugado. Nos meses de vacância, todos voltam para você.</li>
          <li>A implantação (adesão, enxoval, itens mínimos) é cobrada uma vez e reduz o líquido do 1º ano. O breakeven é a implantação dividida pela vantagem mensal da temporada.</li>
          <li>A sazonalidade mensal não entra: o cálculo usa a diária e a ocupação médias do ano. A alíquota de imposto é opcional e simplificada.</li>
        </ul>
      </details>
    </section>
  );
}
