"use client";

import { useEffect, useMemo, useState } from "react";

type H = {
  id: string;
  dia: string;
  horario: string;
  limite: number;
  inscritos: number;
};

type I = {
  id: string;
  horarioId: string;
  nome: string;
  turma: string;
};

export default function AdminApp() {
  const [senha, setSenha] = useState("");
  const [logado, setLogado] = useState(false);

  const [horarios, setHorarios] = useState<H[]>([]);
  const [inscricoes, setInscricoes] = useState<I[]>([]);

  const [filtro, setFiltro] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);

  async function carregar() {
    try {
      const r = await fetch("/api/admin/inscricoes", {
        cache: "no-store",
      });

      if (r.status === 401) {
        setLogado(false);
        setCarregando(false);
        return;
      }

      if (!r.ok) {
        throw new Error("Erro ao carregar inscrições.");
      }

      const j = await r.json();

      setHorarios(j.horarios || []);
      setInscricoes(j.inscricoes || []);
      setLogado(true);

      if (!filtro && j.horarios?.[0]) {
        setFiltro(j.horarios[0].id);
      }
    } catch {
      setErro("Erro ao carregar dados.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();

    const t = setInterval(() => {
      carregar();
    }, 5000);

    return () => clearInterval(t);
  }, []);

  async function login(e: React.FormEvent) {
    e.preventDefault();

    setErro("");

    try {
      const r = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          senha,
        }),
      });

      if (!r.ok) {
        setErro("Senha incorreta.");
        return;
      }

      setSenha("");
      setCarregando(true);

      await carregar();
    } catch {
      setErro("Erro ao realizar login.");
    }
  }

  async function sair() {
    await fetch("/api/admin/logout", {
      method: "POST",
    });

    setLogado(false);
  }

  const atual = useMemo(
    () => horarios.find((h) => h.id === filtro),
    [horarios, filtro]
  );

  const lista = useMemo(() => {
    return inscricoes
      .filter((i) => i.horarioId === filtro)
      .sort((a, b) =>
        a.nome.localeCompare(b.nome, "pt-BR")
      );
  }, [inscricoes, filtro]);

  const totalVagas = horarios.reduce(
    (acc, h) => acc + h.limite,
    0
  );

  const totalInscritos = horarios.reduce(
    (acc, h) => acc + h.inscritos,
    0
  );

  const totalDisponiveis = Math.max(
    0,
    totalVagas - totalInscritos
  );

  const turmas = [
    "1EM A",
    "2EM A",
    "2EM B",
    "3EM A",
  ];

  const inscritosPorTurma = turmas
    .map((turma) => {
      const total = inscricoes.filter(
        (i) => i.turma === turma
      ).length;

      return {
        turma,
        total,
      };
    })
    .sort((a, b) => b.total - a.total);

  const maiorTurma =
    inscritosPorTurma.length > 0
      ? inscritosPorTurma[0]
      : null;

  const maiorQuantidade =
    maiorTurma?.total || 0;

  function escapeHtml(valor: string) {
    return valor
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function imprimirLista() {
    if (!atual || lista.length === 0) {
      return;
    }

    const linhas = lista
      .map(
        (aluno, index) => `
          <tr>
            <td>${index + 1}</td>
            <td>${escapeHtml(aluno.nome)}</td>
            <td>${escapeHtml(aluno.turma)}</td>
          </tr>
        `
      )
      .join("");

    const janela = window.open(
      "",
      "_blank",
      "width=900,height=700"
    );

    if (!janela) {
      alert(
        "Não foi possível abrir a impressão. Verifique se o navegador está bloqueando pop-ups."
      );
      return;
    }

    janela.document.write(`
      <!DOCTYPE html>
      <html lang="pt-BR">
        <head>
          <meta charset="UTF-8" />

          <title>Lista de Inscritos</title>

          <style>
            @page {
              size: A4;
              margin: 15mm;
            }

            * {
              box-sizing: border-box;
            }

            body {
              margin: 0;
              padding: 0;
              background: white;
              color: black;
              font-family: Arial, Helvetica, sans-serif;
            }

            .cabecalho {
              text-align: center;
              margin-bottom: 24px;
            }

            .cabecalho h1 {
              margin: 0;
              font-size: 20px;
              font-weight: 700;
            }

            .cabecalho h2 {
              margin: 6px 0 0;
              font-size: 16px;
              font-weight: 600;
            }

            .cabecalho p {
              margin: 7px 0 0;
              font-size: 13px;
            }

            .total {
              margin-bottom: 12px;
              font-size: 13px;
            }

            table {
              width: 100%;
              border-collapse: collapse;
            }

            thead {
              display: table-header-group;
            }

            tr {
              page-break-inside: avoid;
            }

            th,
            td {
              border: 1px solid #888;
              padding: 9px 10px;
              font-size: 12px;
              text-align: left;
            }

            th {
              background: #f2f2f2;
              font-weight: 700;
            }

            th:first-child,
            td:first-child {
              width: 55px;
              text-align: center;
            }

            th:last-child,
            td:last-child {
              width: 120px;
              text-align: center;
            }
          </style>
        </head>

        <body>
          <div class="cabecalho">
            <h1>Colégio do Campeche</h1>

            <h2>
              Matemática Básica — Ensino Médio
            </h2>

            <p>
              ${escapeHtml(atual.dia)} —
              ${escapeHtml(atual.horario)}
            </p>
          </div>

          <div class="total">
            <strong>${lista.length}</strong>
            aluno${lista.length !== 1 ? "s" : ""}
            inscrito${lista.length !== 1 ? "s" : ""}
          </div>

          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Nome completo</th>
                <th>Turma</th>
              </tr>
            </thead>

            <tbody>
              ${linhas}
            </tbody>
          </table>
        </body>
      </html>
    `);

    janela.document.close();
    janela.focus();

    setTimeout(() => {
      janela.print();
    }, 300);
  }

  if (carregando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-[#073763]" />

          <p className="mt-4 text-sm text-slate-500">
            Carregando painel...
          </p>
        </div>
      </main>
    );
  }

  if (!logado) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <section className="w-full max-w-md rounded-3xl bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.12)]">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-2xl">
            🔐
          </div>

          <span className="mt-6 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            Área restrita
          </span>

          <h1 className="mt-4 text-3xl font-bold tracking-tight text-[#073763]">
            Administração
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Entre com a senha administrativa para acessar
            as inscrições dos alunos.
          </p>

          <form
            onSubmit={login}
            className="mt-7"
          >
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Senha
              </label>

              <input
                type="password"
                value={senha}
                onChange={(e) =>
                  setSenha(e.target.value)
                }
                placeholder="Digite sua senha"
                required
                autoFocus
                className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#073763] focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <button
              type="submit"
              className="mt-5 w-full rounded-xl bg-[#073763] px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-[#052b4e]"
            >
              Entrar no painel
            </button>

            {erro && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {erro}
              </div>
            )}
          </form>

          <a
            href="/"
            className="mt-6 block text-center text-sm font-medium text-slate-500 transition hover:text-[#073763]"
          >
            ← Voltar para inscrições
          </a>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 md:px-6 md:py-10">
      <section className="mx-auto w-full max-w-6xl">

        <header className="flex flex-col gap-5 rounded-[28px] bg-gradient-to-br from-[#073763] via-[#0a4a7d] to-[#0b5d96] px-6 py-7 text-white shadow-[0_20px_60px_rgba(7,55,99,0.22)] md:flex-row md:items-center md:justify-between md:px-9 md:py-8">
          <div>
            <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold">
              Administração
            </span>

            <h1 className="mt-4 text-3xl font-bold tracking-tight">
              Painel de inscrições
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/70 md:text-base">
              Acompanhe as vagas disponíveis, consulte os
              alunos inscritos e compare a procura pelas
              aulas de Matemática Básica.
            </p>
          </div>

          <button
            onClick={sair}
            className="self-start rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20 md:self-auto"
          >
            Sair
          </button>
        </header>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl bg-white p-6 shadow-sm">
            <span className="text-sm font-medium text-slate-500">
              Total de vagas
            </span>

            <strong className="mt-2 block text-4xl font-bold text-[#073763]">
              {totalVagas}
            </strong>

            <p className="mt-3 text-xs text-slate-400">
              Soma de todos os horários
            </p>
          </article>

          <article className="rounded-2xl bg-white p-6 shadow-sm">
            <span className="text-sm font-medium text-slate-500">
              Inscritos
            </span>

            <strong className="mt-2 block text-4xl font-bold text-emerald-600">
              {totalInscritos}
            </strong>

            <p className="mt-3 text-xs text-slate-400">
              Alunos confirmados
            </p>
          </article>

          <article className="rounded-2xl bg-white p-6 shadow-sm">
            <span className="text-sm font-medium text-slate-500">
              Disponíveis
            </span>

            <strong className="mt-2 block text-4xl font-bold text-amber-600">
              {totalDisponiveis}
            </strong>

            <p className="mt-3 text-xs text-slate-400">
              Vagas restantes
            </p>
          </article>
        </section>

        <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm md:p-7">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Análise por turma
              </span>

              <h2 className="mt-1 text-xl font-bold text-slate-900">
                Inscrições por turma
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Comparativo da procura pelas aulas
                de Matemática Básica.
              </p>
            </div>

            {maiorTurma &&
              maiorTurma.total > 0 && (
                <div className="rounded-xl bg-amber-50 px-4 py-3">
                  <span className="block text-xs font-medium text-amber-700">
                    Maior procura pelo reforço
                  </span>

                  <strong className="mt-1 block text-lg text-amber-800">
                    {maiorTurma.turma} —{" "}
                    {maiorTurma.total} alunos
                  </strong>
                </div>
              )}
          </div>

          <div className="mt-6 space-y-5">
            {inscritosPorTurma.map(
              (item, index) => {
                const percentual =
                  maiorQuantidade > 0
                    ? (item.total /
                        maiorQuantidade) *
                      100
                    : 0;

                return (
                  <div key={item.turma}>
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500">
                          {index + 1}
                        </span>

                        <strong className="text-sm text-slate-800">
                          {item.turma}
                        </strong>
                      </div>

                      <span className="text-sm font-semibold text-[#073763]">
                        {item.total} aluno
                        {item.total !== 1
                          ? "s"
                          : ""}
                      </span>
                    </div>

                    <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-[#073763]"
                        style={{
                          width: `${percentual}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-2">
          {horarios.map((h) => {
            const disponiveis =
              h.limite - h.inscritos;

            const selecionado =
              filtro === h.id;

            return (
              <button
                key={h.id}
                onClick={() =>
                  setFiltro(h.id)
                }
                className={`rounded-2xl border-2 bg-white p-5 text-left shadow-sm transition ${
                  selecionado
                    ? "border-[#073763]"
                    : "border-transparent"
                }`}
              >
                <strong className="block text-lg text-slate-900">
                  {h.dia}
                </strong>

                <span className="mt-1 block text-sm text-slate-500">
                  {h.horario}
                </span>

                <div className="mt-5 flex items-end justify-between">
                  <strong className="text-2xl text-[#073763]">
                    {h.inscritos}/{h.limite}
                  </strong>

                  <span className="text-sm text-slate-500">
                    {disponiveis} vagas
                  </span>
                </div>
              </button>
            );
          })}
        </section>

        <section className="mt-6 rounded-3xl bg-white p-5 shadow-sm md:p-7">
          <div className="flex flex-col gap-5 border-b border-slate-200 pb-5 md:flex-row md:items-center md:justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Lista de inscritos
              </span>

              <h2 className="mt-1 text-2xl font-bold text-slate-900">
                {atual?.dia}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {atual?.horario}
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <select
                value={filtro}
                onChange={(e) =>
                  setFiltro(e.target.value)
                }
                className="h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm"
              >
                {horarios.map((h) => (
                  <option
                    key={h.id}
                    value={h.id}
                  >
                    {h.dia}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={imprimirLista}
                disabled={lista.length === 0}
                className="h-11 rounded-xl bg-[#073763] px-5 text-sm font-semibold text-white transition hover:bg-[#052b4e] disabled:cursor-not-allowed disabled:opacity-50"
              >
                🖨 Imprimir lista
              </button>
            </div>
          </div>

          <div className="mt-5">
            <span className="text-sm text-slate-500">
              <strong className="text-[#073763]">
                {lista.length}
              </strong>{" "}
              aluno(s) inscrito(s)
            </span>
          </div>

          {lista.length === 0 ? (
            <div className="py-14 text-center text-slate-400">
              Nenhum aluno inscrito.
            </div>
          ) : (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-y border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
                    <th className="px-4 py-3">
                      #
                    </th>

                    <th className="px-4 py-3">
                      Nome completo
                    </th>

                    <th className="px-4 py-3">
                      Turma
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {lista.map(
                    (i, n) => (
                      <tr
                        key={i.id}
                        className="border-b border-slate-100"
                      >
                        <td className="px-4 py-4 text-sm text-slate-500">
                          {n + 1}
                        </td>

                        <td className="px-4 py-4 text-sm font-semibold text-slate-800">
                          {i.nome}
                        </td>

                        <td className="px-4 py-4 text-sm text-slate-700">
                          {i.turma}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <footer className="mt-5 text-center text-xs text-slate-400">
          Dados atualizados automaticamente a cada 5 segundos.
        </footer>
      </section>
    </main>
  );
}