"use client";

import { useEffect, useMemo, useState } from "react";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "@/lib/firebase-client";

type Horario = {
  id: string;
  dia: string;
  horario: string;
  limite: number;
  inscritos: number;
  ativo: boolean;
  ordem: number;
};

export default function InscricaoApp() {
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [sel, setSel] = useState("");
  const [nome, setNome] = useState("");
  const [turma, setTurma] = useState("");
  const [msg, setMsg] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, "horarios"),
      orderBy("ordem")
    );

    return onSnapshot(q, (snapshot) => {
      setHorarios(
        snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Horario[]
      );
    });
  }, []);

  const selecionado = useMemo(
    () => horarios.find((h) => h.id === sel),
    [horarios, sel]
  );

  async function enviar(e: React.FormEvent) {
    e.preventDefault();

    setErro("");
    setMsg("");

    if (!sel) {
      setErro("Selecione um dia para continuar.");
      return;
    }

    if (!nome.trim()) {
      setErro("Informe o nome completo do aluno.");
      return;
    }

    if (!turma) {
      setErro("Selecione a turma.");
      return;
    }

    setLoading(true);

    try {
      const r = await fetch("/api/inscricoes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          horarioId: sel,
          nome: nome.trim(),
          turma,
        }),
      });

      const j = await r.json();

      if (!r.ok) {
        throw new Error(
          j.error ||
          "Não foi possível realizar a inscrição."
        );
      }

      setMsg(
        `Sua vaga foi reservada para ${selecionado?.dia}, das ${selecionado?.horario}. As aulas iniciam em 18 de agosto.`
      );

      setNome("");
      setTurma("");
      setSel("");
    } catch (e: any) {
      setErro(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 md:px-6 md:py-10">
      <section className="mx-auto w-full max-w-5xl">

        {/* CABEÇALHO */}
        <header className="overflow-hidden rounded-[28px] bg-gradient-to-br from-[#073763] via-[#0a4a7d] to-[#0b5d96] px-6 py-8 text-white shadow-[0_20px_60px_rgba(7,55,99,0.22)] md:px-10 md:py-10">
          <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold backdrop-blur">
            Colégio do Campeche
          </span>

          <div className="mt-6">
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
              Matemática Básica
            </h1>

            <h2 className="mt-2 text-lg font-semibold text-white/85 md:text-xl">
              Ensino Médio
            </h2>

            <p className="mt-5 max-w-2xl text-sm leading-6 text-white/75 md:text-base md:leading-7">
              Reforce seus conhecimentos, tire dúvidas e fortaleça
              sua base em Matemática.
            </p>
          </div>

          <div className="mt-8 grid gap-3 md:grid-cols-3">
            <div className="flex items-center gap-4 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10 text-2xl">
                📚
              </div>

              <div>
                <strong className="block text-sm font-semibold">
                  10 aulas gratuitas
                </strong>

                <span className="mt-1 block text-xs text-white/60">
                  Programa de apoio
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10 text-2xl">
                📅
              </div>

              <div>
                <strong className="block text-sm font-semibold">
                  18 de agosto
                </strong>

                <span className="mt-1 block text-xs text-white/60">
                  Início das aulas
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10 text-2xl">
                🕑
              </div>

              <div>
                <strong className="block text-sm font-semibold">
                  14h às 14h50
                </strong>

                <span className="mt-1 block text-xs text-white/60">
                  Horário das aulas
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* EXPLICAÇÃO */}
        <section className="mt-6 flex gap-4 rounded-2xl border border-blue-100 bg-blue-50 p-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#073763] text-white">
            i
          </div>

          <div>
            <strong className="text-sm font-semibold text-[#073763]">
              Como funciona a inscrição?
            </strong>

            <p className="mt-1 text-sm leading-6 text-slate-600">
              Escolha terça-feira ou sexta-feira. A vaga ficará
              reservada para o aluno durante o período das aulas
              de Matemática Básica.
            </p>

            <p className="mt-1 text-sm text-slate-500">
              As vagas são limitadas e atualizadas em tempo real.
            </p>
          </div>
        </section>

        {/* PASSO 1 */}
        <section className="mt-10">
          <div className="mb-5 flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#073763] text-sm font-bold text-white">
              1
            </span>

            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Escolha seu dia
              </h2>

              <p className="mt-0.5 text-sm text-slate-500">
                Selecione uma das opções disponíveis.
              </p>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {horarios.map((h) => {
              const rest = Math.max(
                0,
                h.limite - h.inscritos
              );

              const pct = Math.min(
                100,
                (h.inscritos / h.limite) * 100
              );

              const selected = sel === h.id;

              return (
                <article
                  key={h.id}
                  className={`rounded-2xl border-2 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${selected
                      ? "border-[#073763] shadow-[0_12px_35px_rgba(7,55,99,0.13)]"
                      : "border-transparent"
                    }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-2xl">
                      📅
                    </div>

                    {selected && (
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                        ✓ Selecionado
                      </span>
                    )}
                  </div>

                  <h3 className="mt-5 text-xl font-bold text-slate-900">
                    {h.dia}
                  </h3>

                  <div className="mt-2 text-sm text-slate-500">
                    🕒 {h.horario}
                  </div>

                  <div className="mt-6">
                    <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                      <span className="text-slate-500">
                        Vagas disponíveis
                      </span>

                      <strong className="text-[#073763]">
                        {rest} de {h.limite}
                      </strong>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full bg-[#073763] transition-all duration-300"
                        style={{
                          width: `${pct}%`,
                        }}
                      />
                    </div>

                    {rest <= 5 && rest > 0 && (
                      <span className="mt-2 block text-xs font-semibold text-amber-600">
                        Últimas vagas disponíveis
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    disabled={!h.ativo || rest === 0}
                    onClick={() => setSel(h.id)}
                    className={`mt-6 w-full rounded-xl px-4 py-3.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${selected
                        ? "bg-blue-50 text-[#073763]"
                        : "bg-[#073763] text-white hover:bg-[#052b4e]"
                      }`}
                  >
                    {rest === 0
                      ? "Vagas esgotadas"
                      : selected
                        ? "Dia selecionado"
                        : h.id === "terca"
                          ? "Escolher terça-feira"
                          : "Escolher sexta-feira"}
                  </button>
                </article>
              );
            })}
          </div>
        </section>

        {/* PASSO 2 */}
        {sel && selecionado && (
          <section className="mt-8 rounded-2xl bg-white p-6 shadow-[0_10px_35px_rgba(15,23,42,0.07)] md:p-7">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#073763] text-sm font-bold text-white">
                2
              </span>

              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Dados do aluno
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Você escolheu{" "}
                  <strong className="text-slate-700">
                    {selecionado.dia}
                  </strong>{" "}
                  • {selecionado.horario}
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <span className="text-2xl">📅</span>

              <div>
                <small className="block text-xs text-slate-500">
                  Dia escolhido
                </small>

                <strong className="mt-1 block text-sm text-[#073763]">
                  {selecionado.dia}
                </strong>

                <span className="mt-1 block text-xs text-slate-500">
                  {selecionado.horario}
                </span>
              </div>
            </div>

            <form
              onSubmit={enviar}
              className="mt-6 grid gap-5 md:grid-cols-2"
            >
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Nome completo
                </label>

                <input
                  required
                  minLength={5}
                  value={nome}
                  onChange={(e) =>
                    setNome(e.target.value)
                  }
                  placeholder="Digite o nome completo do aluno"
                  className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#073763] focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Turma
                </label>

                <select
                  required
                  value={turma}
                  onChange={(e) =>
                    setTurma(e.target.value)
                  }
                  className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-[#073763] focus:ring-4 focus:ring-blue-100"
                >
                  <option value="">
                    Selecione sua turma
                  </option>

                  <option value="1EM A">1EM A</option>
                  <option value="2EM A">2EM A</option>
                  <option value="2EM B">2EM B</option>
                  <option value="3EM A">3EM A</option>
                </select>
              </div>

              <div className="md:col-span-2 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm leading-6 text-orange-800">
                Ao confirmar, sua vaga ficará reservada para
                este dia durante as aulas de Matemática Básica.
              </div>

              <button
                disabled={loading}
                className="md:col-span-2 rounded-xl bg-[#073763] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#052b4e] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? "Realizando inscrição..."
                  : "Confirmar inscrição"}
              </button>
            </form>
          </section>
        )}

        {/* SUCESSO */}
        {msg && (
          <div className="mt-6 flex items-start gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-800">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-600 font-bold text-white">
              ✓
            </div>

            <div>
              <strong className="block">
                Inscrição realizada com sucesso!
              </strong>

              <span className="mt-1 block text-sm leading-6">
                {msg}
              </span>
            </div>
          </div>
        )}

        {/* ERRO */}
        {erro && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-800">
            <strong className="block">
              Atenção
            </strong>

            <span className="mt-1 block text-sm">
              {erro}
            </span>
          </div>
        )}

        {/* RODAPÉ */}
        <footer className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-slate-200 px-1 py-6 text-center text-xs text-slate-400 sm:flex-row sm:text-left">
          <div>
            <strong className="block text-slate-500">
              Colégio do Campeche
            </strong>

            <span>
              Matemática Básica • Ensino Médio
            </span>
          </div>

          <a
            href="/admin"
            className="font-medium text-slate-500 transition hover:text-[#073763]"
          >
            Administração
          </a>
        </footer>

      </section>
    </main>
  );
}