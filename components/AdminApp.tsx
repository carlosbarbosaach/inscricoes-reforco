"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  BarChart3,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  LogOut,
  Printer,
  RefreshCw,
  Search,
  ShieldCheck,
  Ticket,
  TrendingUp,
  Users,
  UserRoundCheck,
} from "lucide-react";

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

const TURMAS = [
  "1EM A",
  "2EM A",
  "2EM B",
  "3EM A",
];

export default function AdminApp() {
  const [senha, setSenha] = useState("");
  const [logado, setLogado] =
    useState(false);

  const [horarios, setHorarios] =
    useState<H[]>([]);

  const [inscricoes, setInscricoes] =
    useState<I[]>([]);

  const [filtro, setFiltro] =
    useState("");

  const [busca, setBusca] =
    useState("");

  const [erro, setErro] =
    useState("");

  const [carregando, setCarregando] =
    useState(true);

  const [atualizando, setAtualizando] =
    useState(false);

  const [
    ultimaAtualizacao,
    setUltimaAtualizacao,
  ] = useState<Date | null>(null);

  async function carregar(
    mostrarLoading = false
  ) {
    try {
      if (mostrarLoading) {
        setAtualizando(true);
      }

      const r = await fetch(
        "/api/admin/inscricoes",
        {
          cache: "no-store",
        }
      );

      if (r.status === 401) {
        setLogado(false);
        setCarregando(false);
        return;
      }

      if (!r.ok) {
        throw new Error(
          "Erro ao carregar inscrições."
        );
      }

      const j = await r.json();

      const novosHorarios =
        j.horarios || [];

      setHorarios(novosHorarios);

      setInscricoes(
        j.inscricoes || []
      );

      setLogado(true);

      setUltimaAtualizacao(
        new Date()
      );

      setFiltro((atual) => {
        if (
          atual &&
          novosHorarios.some(
            (h: H) =>
              h.id === atual
          )
        ) {
          return atual;
        }

        return (
          novosHorarios[0]?.id ||
          ""
        );
      });

      setErro("");
    } catch (error) {
      console.error(
        "Erro ao carregar painel:",
        error
      );

      setErro(
        "Não foi possível atualizar os dados."
      );
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }

  useEffect(() => {
    carregar();

    const interval =
      setInterval(() => {
        carregar();
      }, 5000);

    return () =>
      clearInterval(interval);
  }, []);

  async function login(
    e: React.FormEvent
  ) {
    e.preventDefault();

    setErro("");

    try {
      const r = await fetch(
        "/api/admin/login",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            senha,
          }),
        }
      );

      const data =
        await r.json().catch(
          () => null
        );

      if (!r.ok) {
        setErro(
          data?.error ||
            "Senha incorreta."
        );
        return;
      }

      setSenha("");
      setCarregando(true);

      await carregar();
    } catch {
      setErro(
        "Erro ao realizar login."
      );
    }
  }

  async function sair() {
    await fetch(
      "/api/admin/logout",
      {
        method: "POST",
      }
    );

    setLogado(false);
  }

  const atual = useMemo(
    () =>
      horarios.find(
        (h) => h.id === filtro
      ),
    [horarios, filtro]
  );

  const lista = useMemo(() => {
    const termo =
      busca
        .trim()
        .toLowerCase();

    return inscricoes
      .filter(
        (i) =>
          i.horarioId === filtro
      )
      .filter((i) => {
        if (!termo) {
          return true;
        }

        return (
          i.nome
            .toLowerCase()
            .includes(termo) ||
          i.turma
            .toLowerCase()
            .includes(termo)
        );
      })
      .sort((a, b) =>
        a.nome.localeCompare(
          b.nome,
          "pt-BR"
        )
      );
  }, [
    inscricoes,
    filtro,
    busca,
  ]);

  const listaCompleta =
    useMemo(() => {
      return inscricoes
        .filter(
          (i) =>
            i.horarioId === filtro
        )
        .sort((a, b) =>
          a.nome.localeCompare(
            b.nome,
            "pt-BR"
          )
        );
    }, [
      inscricoes,
      filtro,
    ]);

  const totalVagas =
    horarios.reduce(
      (acc, h) =>
        acc + h.limite,
      0
    );

  const totalInscritos =
    horarios.reduce(
      (acc, h) =>
        acc + h.inscritos,
      0
    );

  const totalDisponiveis =
    Math.max(
      0,
      totalVagas -
        totalInscritos
    );

  const ocupacao =
    totalVagas > 0
      ? Math.round(
          (totalInscritos /
            totalVagas) *
            100
        )
      : 0;

  const inscritosPorTurma =
    TURMAS
      .map((turma) => {
        const total =
          inscricoes.filter(
            (i) =>
              i.turma === turma
          ).length;

        return {
          turma,
          total,
        };
      })
      .sort(
        (a, b) =>
          b.total - a.total
      );

  const maiorTurma =
    inscritosPorTurma[0] ||
    null;

  const maiorQuantidade =
    maiorTurma?.total || 0;

  function escapeHtml(
    valor: string
  ) {
    return valor
      .replaceAll(
        "&",
        "&amp;"
      )
      .replaceAll(
        "<",
        "&lt;"
      )
      .replaceAll(
        ">",
        "&gt;"
      )
      .replaceAll(
        '"',
        "&quot;"
      )
      .replaceAll(
        "'",
        "&#039;"
      );
  }

  function imprimirLista() {
    if (
      !atual ||
      listaCompleta.length === 0
    ) {
      return;
    }

    const linhas =
      listaCompleta
        .map(
          (
            aluno,
            index
          ) => `
            <tr>
              <td>${
                index + 1
              }</td>

              <td>
                ${escapeHtml(
                  aluno.nome
                )}
              </td>

              <td>
                ${escapeHtml(
                  aluno.turma
                )}
              </td>
            </tr>
          `
        )
        .join("");

    const janela =
      window.open(
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

        <title>
          Lista de Inscritos
        </title>

        <style>

          @page {
            size: A4;
            margin: 15mm;
          }

          * {
            box-sizing:
              border-box;
          }

          body {
            margin: 0;
            padding: 0;

            background: white;
            color: black;

            font-family:
              Arial,
              Helvetica,
              sans-serif;
          }

          .cabecalho {
            text-align: center;
            margin-bottom: 24px;
          }

          .cabecalho h1 {
            margin: 0;
            font-size: 21px;
          }

          .cabecalho h2 {
            margin:
              6px 0 0;

            font-size: 16px;
            font-weight: 600;
          }

          .cabecalho p {
            margin:
              7px 0 0;

            font-size: 13px;
          }

          .total {
            margin-bottom:
              12px;

            font-size: 13px;
          }

          table {
            width: 100%;

            border-collapse:
              collapse;
          }

          thead {
            display:
              table-header-group;
          }

          tr {
            page-break-inside:
              avoid;
          }

          th,
          td {
            border:
              1px solid #777;

            padding:
              9px 10px;

            font-size:
              12px;

            text-align:
              left;
          }

          th {
            background:
              #f2f2f2;

            font-weight:
              700;
          }

          th:first-child,
          td:first-child {
            width: 55px;

            text-align:
              center;
          }

          th:last-child,
          td:last-child {
            width: 120px;

            text-align:
              center;
          }

        </style>
      </head>

      <body>

        <div class="cabecalho">

          <h1>
            Colégio do Campeche
          </h1>

          <h2>
            Matemática Básica —
            Ensino Médio
          </h2>

          <p>
            ${escapeHtml(
              atual.dia
            )}
            —
            ${escapeHtml(
              atual.horario
            )}
          </p>

        </div>

        <div class="total">

          <strong>
            ${
              listaCompleta.length
            }
          </strong>

          aluno${
            listaCompleta.length !==
            1
              ? "s"
              : ""
          }

          inscrito${
            listaCompleta.length !==
            1
              ? "s"
              : ""
          }

        </div>

        <table>

          <thead>
            <tr>
              <th>#</th>

              <th>
                Nome completo
              </th>

              <th>
                Turma
              </th>
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

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm">

            <RefreshCw
              size={24}
              className="animate-spin text-[#073763]"
            />

          </div>

          <p className="mt-4 text-sm font-medium text-slate-500">
            Carregando painel...
          </p>

        </div>
      </main>
    );
  }

  if (!logado) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">

        <section className="w-full max-w-md rounded-[28px] border border-slate-100 bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.12)]">

          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-[#073763]">

            <ShieldCheck
              size={27}
            />

          </div>

          <span className="mt-6 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            Área restrita
          </span>

          <h1 className="mt-4 text-3xl font-bold tracking-tight text-[#073763]">
            Administração
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Acesse o painel para
            acompanhar as inscrições
            das aulas de Matemática
            Básica.
          </p>

          <form
            onSubmit={login}
            className="mt-7"
          >

            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Senha administrativa
            </label>

            <input
              type="password"
              value={senha}
              onChange={(e) =>
                setSenha(
                  e.target.value
                )
              }
              placeholder="Digite sua senha"
              required
              autoFocus
              className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#073763] focus:ring-4 focus:ring-blue-100"
            />

            <button
              type="submit"
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#073763] px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-[#052b4e]"
            >
              <ShieldCheck
                size={17}
              />

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

        {/* CABEÇALHO */}
        <header className="overflow-hidden rounded-[28px] bg-gradient-to-br from-[#073763] via-[#0a4a7d] to-[#0b5d96] px-6 py-7 text-white shadow-[0_20px_60px_rgba(7,55,99,0.22)] md:px-9 md:py-8">

          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">

            <div>

              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold">

                <ShieldCheck
                  size={14}
                />

                Administração

              </span>

              <h1 className="mt-4 text-3xl font-bold tracking-tight">
                Painel de inscrições
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/70 md:text-base">
                Acompanhe as vagas,
                inscrições e a procura
                pelas aulas de
                Matemática Básica.
              </p>

            </div>

            <div className="flex flex-wrap gap-2">

              <button
                type="button"
                onClick={() =>
                  carregar(true)
                }
                disabled={
                  atualizando
                }
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20 disabled:opacity-50"
              >

                <RefreshCw
                  size={16}
                  className={
                    atualizando
                      ? "animate-spin"
                      : ""
                  }
                />

                Atualizar

              </button>

              <button
                type="button"
                onClick={sair}
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20"
              >

                <LogOut size={16} />

                Sair

              </button>

            </div>

          </div>

          {ultimaAtualizacao && (
            <div className="mt-5 text-xs text-white/50">
              Atualizado às{" "}
              {ultimaAtualizacao.toLocaleTimeString(
                "pt-BR",
                {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                }
              )}
            </div>
          )}

        </header>

        {/* RESUMO */}
        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <ResumoCard
            titulo="Total de vagas"
            valor={totalVagas}
            descricao="Capacidade total"
            icon={
              <Ticket
                size={22}
              />
            }
            destaque="blue"
          />

          <ResumoCard
            titulo="Inscritos"
            valor={totalInscritos}
            descricao="Alunos confirmados"
            icon={
              <UserRoundCheck
                size={22}
              />
            }
            destaque="green"
          />

          <ResumoCard
            titulo="Disponíveis"
            valor={totalDisponiveis}
            descricao="Vagas restantes"
            icon={
              <Users
                size={22}
              />
            }
            destaque="amber"
          />

          <ResumoCard
            titulo="Ocupação"
            valor={`${ocupacao}%`}
            descricao="Das vagas preenchidas"
            icon={
              <BarChart3
                size={22}
              />
            }
            destaque="purple"
          />

        </section>

        {/* ANÁLISE POR TURMA */}
        <section className="mt-6 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm md:p-7">

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

            <div>

              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Análise por turma
              </span>

              <h2 className="mt-1 text-xl font-bold text-slate-900">
                Procura pelo reforço
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Comparativo dos
                alunos inscritos em
                cada turma.
              </p>

            </div>

            {maiorTurma &&
              maiorTurma.total >
                0 && (
                <div className="flex items-center gap-3 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">

                    <TrendingUp
                      size={20}
                    />

                  </div>

                  <div>

                    <span className="block text-xs font-medium text-amber-700">
                      Maior procura
                    </span>

                    <strong className="block text-base text-amber-900">
                      {
                        maiorTurma.turma
                      }{" "}
                      —{" "}
                      {
                        maiorTurma.total
                      }{" "}
                      alunos
                    </strong>

                  </div>

                </div>
              )}

          </div>

          <div className="mt-7 grid gap-4 md:grid-cols-2">

            {inscritosPorTurma.map(
              (
                item,
                index
              ) => {
                const percentual =
                  maiorQuantidade >
                  0
                    ? Math.round(
                        (item.total /
                          maiorQuantidade) *
                          100
                      )
                    : 0;

                return (
                  <div
                    key={
                      item.turma
                    }
                    className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4"
                  >

                    <div className="flex items-center justify-between gap-4">

                      <div className="flex items-center gap-3">

                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-xs font-bold text-slate-500 shadow-sm">
                          {index + 1}
                        </span>

                        <strong className="text-sm text-slate-800">
                          {
                            item.turma
                          }
                        </strong>

                      </div>

                      <strong className="text-sm text-[#073763]">
                        {
                          item.total
                        }{" "}
                        aluno
                        {item.total !==
                        1
                          ? "s"
                          : ""}
                      </strong>

                    </div>

                    <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-200">

                      <div
                        className="h-full rounded-full bg-[#073763] transition-all duration-500"
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

        {/* HORÁRIOS */}
        <section className="mt-6">

          <div className="mb-4">

            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Horários
            </span>

            <h2 className="mt-1 text-xl font-bold text-slate-900">
              Inscrições por dia
            </h2>

          </div>

          <div className="grid gap-4 md:grid-cols-2">

            {horarios.map(
              (h) => {
                const disponiveis =
                  Math.max(
                    0,
                    h.limite -
                      h.inscritos
                  );

                const selecionado =
                  filtro === h.id;

                const percentual =
                  h.limite > 0
                    ? Math.min(
                        100,
                        Math.round(
                          (h.inscritos /
                            h.limite) *
                            100
                        )
                      )
                    : 0;

                return (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => {
                      setFiltro(
                        h.id
                      );
                      setBusca("");
                    }}
                    className={`rounded-2xl border-2 bg-white p-5 text-left shadow-sm transition-all duration-200 ${
                      selecionado
                        ? "border-[#073763] shadow-[0_10px_30px_rgba(7,55,99,0.12)]"
                        : "border-transparent hover:-translate-y-0.5 hover:border-blue-100 hover:shadow-md"
                    }`}
                  >

                    <div className="flex items-start justify-between gap-4">

                      <div className="flex gap-3">

                        <div
                          className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                            selecionado
                              ? "bg-[#073763] text-white"
                              : "bg-blue-50 text-[#073763]"
                          }`}
                        >

                          <CalendarDays
                            size={20}
                          />

                        </div>

                        <div>

                          <strong className="block text-base text-slate-900">
                            {
                              h.dia
                            }
                          </strong>

                          <span className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">

                            <Clock3
                              size={14}
                            />

                            {
                              h.horario
                            }

                          </span>

                        </div>

                      </div>

                      {selecionado && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">

                          <CheckCircle2
                            size={13}
                          />

                          Selecionado

                        </span>
                      )}

                    </div>

                    <div className="mt-5 flex items-end justify-between">

                      <div>

                        <strong className="text-2xl text-[#073763]">
                          {
                            h.inscritos
                          }
                          /
                          {
                            h.limite
                          }
                        </strong>

                        <span className="ml-2 text-xs text-slate-400">
                          inscritos
                        </span>

                      </div>

                      <span className="text-sm font-semibold text-slate-500">
                        {
                          disponiveis
                        }{" "}
                        vagas
                      </span>

                    </div>

                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">

                      <div
                        className="h-full rounded-full bg-[#073763]"
                        style={{
                          width: `${percentual}%`,
                        }}
                      />

                    </div>

                  </button>
                );
              }
            )}

          </div>

        </section>

        {/* LISTA */}
        <section className="mt-6 overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">

          <div className="border-b border-slate-200 p-5 md:p-7">

            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

              <div>

                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Lista de inscritos
                </span>

                <h2 className="mt-1 text-2xl font-bold text-slate-900">
                  {atual?.dia ||
                    "Selecione um horário"}
                </h2>

                <p className="mt-1 flex items-center gap-2 text-sm text-slate-500">

                  <Clock3
                    size={15}
                  />

                  {
                    atual?.horario
                  }

                </p>

              </div>

              <div className="flex flex-col gap-2 sm:flex-row">

                <select
                  value={filtro}
                  onChange={(
                    e
                  ) => {
                    setFiltro(
                      e.target
                        .value
                    );

                    setBusca("");
                  }}
                  className="h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-[#073763] focus:ring-4 focus:ring-blue-100"
                >

                  {horarios.map(
                    (h) => (
                      <option
                        key={
                          h.id
                        }
                        value={
                          h.id
                        }
                      >
                        {
                          h.dia
                        }
                      </option>
                    )
                  )}

                </select>

                <button
                  type="button"
                  onClick={
                    imprimirLista
                  }
                  disabled={
                    listaCompleta.length ===
                    0
                  }
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#073763] px-5 text-sm font-semibold text-white transition hover:bg-[#052b4e] disabled:cursor-not-allowed disabled:opacity-50"
                >

                  <Printer
                    size={17}
                  />

                  Imprimir lista

                </button>

              </div>

            </div>

            {/* BUSCA */}
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

              <div className="relative w-full sm:max-w-sm">

                <Search
                  size={17}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  value={busca}
                  onChange={(e) =>
                    setBusca(
                      e.target.value
                    )
                  }
                  placeholder="Buscar aluno ou turma..."
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#073763] focus:ring-4 focus:ring-blue-100"
                />

              </div>

              <span className="text-sm text-slate-500">

                <strong className="text-[#073763]">
                  {
                    listaCompleta.length
                  }
                </strong>{" "}
                aluno
                {listaCompleta.length !==
                1
                  ? "s"
                  : ""}{" "}
                inscrito
                {listaCompleta.length !==
                1
                  ? "s"
                  : ""}

              </span>

            </div>

          </div>

          {lista.length === 0 ? (
            <div className="px-5 py-16 text-center">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">

                <Users size={24} />

              </div>

              <strong className="mt-4 block text-slate-700">
                {busca
                  ? "Nenhum aluno encontrado"
                  : "Nenhum aluno inscrito"}
              </strong>

              <span className="mt-1 block text-sm text-slate-400">
                {busca
                  ? "Tente outro nome ou turma."
                  : "As inscrições aparecerão aqui automaticamente."}
              </span>

            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full border-collapse text-left">

                <thead>

                  <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wider text-slate-500">

                    <th className="w-16 px-5 py-4 font-semibold">
                      #
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      Nome completo
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      Turma
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {lista.map(
                    (
                      aluno,
                      index
                    ) => (
                      <tr
                        key={
                          aluno.id
                        }
                        className="border-b border-slate-100 transition hover:bg-slate-50/80"
                      >

                        <td className="px-5 py-4 text-sm font-medium text-slate-400">
                          {index +
                            1}
                        </td>

                        <td className="px-5 py-4">

                          <div className="flex items-center gap-3">

                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-[#073763]">

                              {aluno.nome
                                .charAt(
                                  0
                                )
                                .toUpperCase()}

                            </div>

                            <strong className="text-sm font-semibold text-slate-800">
                              {
                                aluno.nome
                              }
                            </strong>

                          </div>

                        </td>

                        <td className="px-5 py-4">

                          <span className="inline-flex rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-[#073763]">
                            {
                              aluno.turma
                            }
                          </span>

                        </td>

                      </tr>
                    )
                  )}

                </tbody>

              </table>

            </div>
          )}

        </section>

        {erro && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {erro}
          </div>
        )}

        <footer className="mt-6 flex flex-col items-center justify-between gap-2 border-t border-slate-200 py-6 text-xs text-slate-400 sm:flex-row">

          <div className="flex items-center gap-2">

            <BookOpen
              size={14}
            />

            Colégio do Campeche •
            Matemática Básica

          </div>

          <span>
            Atualização automática
            a cada 5 segundos
          </span>

        </footer>

      </section>

    </main>
  );
}

type ResumoCardProps = {
  titulo: string;
  valor:
    | number
    | string;
  descricao: string;
  icon:
    React.ReactNode;
  destaque:
    | "blue"
    | "green"
    | "amber"
    | "purple";
};

function ResumoCard({
  titulo,
  valor,
  descricao,
  icon,
  destaque,
}: ResumoCardProps) {
  const estilos = {
    blue: {
      icon:
        "bg-blue-50 text-[#073763]",
      valor:
        "text-[#073763]",
    },

    green: {
      icon:
        "bg-emerald-50 text-emerald-600",
      valor:
        "text-emerald-600",
    },

    amber: {
      icon:
        "bg-amber-50 text-amber-600",
      valor:
        "text-amber-600",
    },

    purple: {
      icon:
        "bg-violet-50 text-violet-600",
      valor:
        "text-violet-600",
    },
  };

  const estilo =
    estilos[destaque];

  return (
    <article className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">

      <div className="flex items-start justify-between gap-4">

        <div>

          <span className="text-sm font-medium text-slate-500">
            {titulo}
          </span>

          <strong
            className={`mt-2 block text-3xl font-bold ${estilo.valor}`}
          >
            {valor}
          </strong>

        </div>

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${estilo.icon}`}
        >
          {icon}
        </div>

      </div>

      <p className="mt-3 text-xs text-slate-400">
        {descricao}
      </p>

    </article>
  );
}