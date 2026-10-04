"use client";

import { useState } from "react";
import { lerResposta, montarPrompt, type RespostaEspecialista } from "@/lib/especialista";

const brl = (n: number | null) =>
  n === null ? "-" : n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const ROTULO_ITEM: Record<string, string> = {
  condominio: "Condomínio",
  iptu: "IPTU",
  energia: "Energia",
  agua: "Água",
  gas: "Gás",
  internet: "Internet",
};

export default function Home() {
  const [localizacao, setLocalizacao] = useState("");
  const [tipo, setTipo] = useState("");
  const [aviso, setAviso] = useState("");
  const [colado, setColado] = useState("");
  const [erros, setErros] = useState<string[]>([]);
  const [avisos, setAvisos] = useState<string[]>([]);
  const [dados, setDados] = useState<RespostaEspecialista | null>(null);

  const valido = localizacao.trim().length >= 10 && tipo.trim().length >= 15;

  async function consultar() {
    const prompt = montarPrompt(localizacao, tipo);
    try {
      await navigator.clipboard.writeText(prompt);
      setAviso("Prompt copiado. Na aba do Claude que abriu, cole com Ctrl+V e envie.");
    } catch {
      setAviso("Não foi possível copiar automaticamente. Use o botão Copiar prompt.");
    }
    window.open("https://claude.ai/new", "_blank", "noopener");
  }

  function validar() {
    const r = lerResposta(colado);
    if (r.ok) {
      setDados(r.dados);
      setAvisos(r.avisos);
      setErros([]);
    } else {
      setDados(null);
      setAvisos([]);
      setErros(r.erros);
    }
  }

  const campo =
    "w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-base outline-none transition focus:border-[#007AFF] focus:ring-4 focus:ring-[#007AFF]/15";
  const botao =
    "rounded-xl bg-[#007AFF] px-5 py-3 font-medium text-white transition active:scale-[0.98] disabled:opacity-40";
  const card = "rounded-xl border border-zinc-200 bg-white p-4 text-sm";

  const t = dados?.temporada;
  const receitaBruta = t ? t.preco_medio * 365 * (t.ocupacao_anual_pct / 100) : 0;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-10">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Simulador Imobiliário</h1>
        <p className="mt-1 text-zinc-600">Teste do especialista de mercado (consulta manual no Claude)</p>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">1. Consultar</h2>
        <input
          className={campo}
          placeholder="Asa Norte 912, Brasília/DF"
          value={localizacao}
          onChange={(e) => setLocalizacao(e.target.value)}
        />
        <input
          className={campo}
          placeholder="Kit 30m², mobiliada, 1 quarto"
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
        />
        <div className="flex flex-wrap items-center gap-3">
          <button className={botao} disabled={!valido} onClick={consultar}>
            Consultar especialista
          </button>
          <button
            className="rounded-xl border border-zinc-300 px-5 py-3 font-medium transition active:scale-[0.98] disabled:opacity-40"
            disabled={!valido}
            onClick={() => navigator.clipboard.writeText(montarPrompt(localizacao, tipo))}
          >
            Copiar prompt
          </button>
        </div>
        {!valido && (
          <p className="text-sm text-zinc-500">Localização: mínimo 10 caracteres. Tipo: mínimo 15.</p>
        )}
        {aviso && <p className="text-sm text-zinc-700">{aviso}</p>}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">2. Colar a resposta</h2>
        <textarea
          className={`${campo} min-h-48 font-mono text-sm`}
          placeholder="Cole aqui o JSON que o Claude devolveu"
          value={colado}
          onChange={(e) => setColado(e.target.value)}
        />
        <div>
          <button className={botao} disabled={!colado.trim()} onClick={validar}>
            Validar resposta
          </button>
        </div>
        {erros.length > 0 && (
          <ul className="rounded-xl border border-[#FF3B30]/40 bg-[#FF3B30]/5 p-4 text-sm text-[#FF3B30]">
            {erros.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        )}
      </section>

      {dados && t && (
        <section className="flex flex-col gap-5">
          <h2 className="text-lg font-semibold">3. Resultado</h2>

          {avisos.length > 0 && (
            <ul className="list-disc rounded-xl border border-amber-400/50 bg-amber-50 p-4 pl-8 text-sm text-amber-800">
              {avisos.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          )}

          <div className={card}>
            <p className="font-medium">{dados.localizacao_normalizada}</p>
            <p className="text-zinc-600">
              Confiança: {dados.confianca} | Base da ocupação: {t.base_ocupacao}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className={card}>
              <p className="mb-1 font-medium">Temporada (nível anual)</p>
              <p>
                Diária: {brl(t.preco_minimo)} a {brl(t.preco_maximo)} (média {brl(t.preco_medio)})
              </p>
              <p>
                Ocupação: {t.ocupacao_anual_min_pct}% a {t.ocupacao_anual_max_pct}% (central{" "}
                {t.ocupacao_anual_pct}%)
              </p>
              <p>Estadia média: {t.estadia_media_noites ?? "-"} noites</p>
              <p>Taxa de limpeza cobrada: {brl(t.taxa_limpeza_cobrada_hospede)}</p>
              <p className="mt-2 text-zinc-600">
                Receita bruta anual estimada (diária média x 365 x ocupação central, antes de taxas e custos):{" "}
                <span className="font-medium text-zinc-900">{brl(receitaBruta)}</span>
              </p>
            </div>
            <div className={card}>
              <p className="mb-1 font-medium">Aluguel tradicional</p>
              <p>
                Mensal: {brl(dados.tradicional.aluguel_mensal_min)} a {brl(dados.tradicional.aluguel_mensal_max)}{" "}
                (mediano {brl(dados.tradicional.aluguel_mensal_mediano)})
              </p>
              <p>Vacância: {dados.tradicional.vacancia_meses_ano ?? "-"} mês(es) por ano</p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 text-zinc-600">
                <tr>
                  <th className="p-3">Custo comum</th>
                  <th className="p-3">Valor mensal</th>
                  <th className="p-3">Pago por (tradicional)</th>
                </tr>
              </thead>
              <tbody>
                {dados.custos_comuns_estimados.map((c) => (
                  <tr key={c.item} className="border-t border-zinc-100">
                    <td className="p-3">{ROTULO_ITEM[c.item]}</td>
                    <td className="p-3">{brl(c.valor_mensal)}</td>
                    <td className="p-3">{c.pago_por_no_tradicional}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={card}>
            <p className="mb-1 font-medium">Sazonalidade (qualitativa)</p>
            <p>{t.sazonalidade_resumo}</p>
          </div>

          <div className={card}>
            <p className="mb-2 font-medium">Fontes e comparáveis</p>
            <ul className="list-disc pl-5">
              {dados.fontes.map((f) => (
                <li key={f.nome + f.referencia}>
                  {f.url ? (
                    <a className="text-[#007AFF] underline" href={f.url} target="_blank" rel="noopener noreferrer">
                      {f.nome}
                    </a>
                  ) : (
                    f.nome
                  )}{" "}
                  ({f.referencia})
                </li>
              ))}
              {dados.comparaveis.map((c) => (
                <li key={c.descricao + c.valor}>
                  {c.url ? (
                    <a className="text-[#007AFF] underline" href={c.url} target="_blank" rel="noopener noreferrer">
                      {c.descricao}
                    </a>
                  ) : (
                    c.descricao
                  )}{" "}
                  - {c.tipo}, {brl(c.valor)}
                </li>
              ))}
            </ul>
          </div>

          {dados.alertas.length > 0 && (
            <div className={card}>
              <p className="mb-2 font-medium">Alertas do especialista</p>
              <ul className="list-disc pl-5">
                {dados.alertas.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </div>
          )}

          <details className={card}>
            <summary className="cursor-pointer font-medium">JSON completo</summary>
            <pre className="mt-3 overflow-x-auto text-xs">{JSON.stringify(dados, null, 2)}</pre>
          </details>
        </section>
      )}
    </main>
  );
}
