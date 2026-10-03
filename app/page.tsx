"use client";

import { useState } from "react";
import { lerResposta, montarPrompt, type RespostaEspecialista } from "@/lib/especialista";

const brl = (n: number | null) =>
  n === null ? "-" : n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

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
      setAviso("Não foi possível copiar automaticamente. Use o botão de copiar abaixo.");
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

      {dados && (
        <section className="flex flex-col gap-5">
          <h2 className="text-lg font-semibold">3. Resultado</h2>

          {avisos.length > 0 && (
            <ul className="rounded-xl border border-amber-400/50 bg-amber-50 p-4 text-sm text-amber-800">
              {avisos.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          )}

          <div className="rounded-xl border border-zinc-200 p-4">
            <p className="font-medium">{dados.localizacao_normalizada}</p>
            <p className="text-sm text-zinc-600">
              Confiança: {dados.confianca} | Base da ocupação: {dados.temporada.base_ocupacao}
            </p>
            <p className="mt-2 text-sm">
              Diária: {brl(dados.temporada.preco_minimo)} a {brl(dados.temporada.preco_maximo)} (média{" "}
              {brl(dados.temporada.preco_medio)}) | Aluguel tradicional:{" "}
              {brl(dados.tradicional.aluguel_mensal_mediano)}/mês
            </p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-zinc-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 text-zinc-600">
                <tr>
                  <th className="p-3">Mês</th>
                  <th className="p-3">Temporada</th>
                  <th className="p-3">Diária</th>
                  <th className="p-3">Ocupação</th>
                  <th className="p-3">Fonte</th>
                </tr>
              </thead>
              <tbody>
                {[...dados.temporada.meses]
                  .sort((a, b) => a.mes - b.mes)
                  .map((m) => (
                    <tr key={m.mes} className="border-t border-zinc-100">
                      <td className="p-3">{MESES[m.mes - 1]}</td>
                      <td className="p-3">{m.classificacao}</td>
                      <td className="p-3">{brl(m.diaria)}</td>
                      <td className="p-3">{m.ocupacao_pct}%</td>
                      <td className="p-3 text-zinc-500">{m.fonte_periodo ?? "-"}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-xl border border-zinc-200 p-4 text-sm">
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
            <div className="rounded-xl border border-zinc-200 p-4 text-sm">
              <p className="mb-2 font-medium">Alertas do especialista</p>
              <ul className="list-disc pl-5">
                {dados.alertas.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </div>
          )}

          <details className="rounded-xl border border-zinc-200 p-4 text-sm">
            <summary className="cursor-pointer font-medium">JSON completo</summary>
            <pre className="mt-3 overflow-x-auto text-xs">{JSON.stringify(dados, null, 2)}</pre>
          </details>
        </section>
      )}
    </main>
  );
}
