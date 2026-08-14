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

type StatusPresenca = "" | "P" | "F";
type Frequencias = Record<string, StatusPresenca[]>;

const TOTAL_AULAS = 10;
const FREQUENCIA_STORAGE_KEY = "reforco-frequencias-v1";

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

  const [frequencias, setFrequencias] =
    useState<Frequencias>({});

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

  useEffect(() => {
    try {
      const salvo = window.localStorage.getItem(
        FREQUENCIA_STORAGE_KEY
      );

      if (salvo) {
        setFrequencias(JSON.parse(salvo));
      }
    } catch (error) {
      console.error(
        "Erro ao carregar frequências:",
        error
      );
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        FREQUENCIA_STORAGE_KEY,
        JSON.stringify(frequencias)
      );
    } catch (error) {
      console.error(
        "Erro ao salvar frequências:",
        error
      );
    }
  }, [frequencias]);

  function frequenciaDoAluno(
    alunoId: string
  ): StatusPresenca[] {
    const atual =
      frequencias[alunoId] || [];

    return Array.from(
      { length: TOTAL_AULAS },
      (_, index) =>
        atual[index] || ""
    );
  }

  function alternarPresenca(
    alunoId: string,
    aulaIndex: number
  ) {
    setFrequencias((estadoAtual) => {
      const aulas = Array.from(
        { length: TOTAL_AULAS },
        (_, index) =>
          estadoAtual[alunoId]?.[index] ||
          ""
      );

      const statusAtual =
        aulas[aulaIndex];

      aulas[aulaIndex] =
        statusAtual === ""
          ? "P"
          : statusAtual === "P"
            ? "F"
            : "";

      return {
        ...estadoAtual,
        [alunoId]: aulas,
      };
    });
  }

  function calcularFrequencia(
    alunoId: string
  ) {
    const aulas =
      frequenciaDoAluno(alunoId);

    const realizadas =
      aulas.filter(
        (status) => status !== ""
      ).length;

    const presencas =
      aulas.filter(
        (status) => status === "P"
      ).length;

    if (realizadas === 0) {
      return 0;
    }

    return Math.round(
      (presencas / realizadas) * 100
    );
  }

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
  }, []);

  /*
   * Atualiza somente quando o usuário volta para a aba do Admin.
   * Isso evita consultar o Firestore a cada poucos segundos.
   */
  useEffect(() => {
    if (!logado) {
      return;
    }

    const atualizarAoVoltar = () => {
      if (
        document.visibilityState ===
        "visible"
      ) {
        carregar();
      }
    };

    window.addEventListener(
      "focus",
      atualizarAoVoltar
    );

    document.addEventListener(
      "visibilitychange",
      atualizarAoVoltar
    );

    return () => {
      window.removeEventListener(
        "focus",
        atualizarAoVoltar
      );

      document.removeEventListener(
        "visibilitychange",
        atualizarAoVoltar
      );
    };
  }, [logado]);

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
      .sort((a, b) => {
        const turmaCompare =
          a.turma.localeCompare(
            b.turma,
            "pt-BR",
            {
              numeric: true,
              sensitivity: "base",
            }
          );

        if (turmaCompare !== 0) {
          return turmaCompare;
        }

        return a.nome.localeCompare(
          b.nome,
          "pt-BR",
          {
            sensitivity: "base",
          }
        );
      });
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
        .sort((a, b) => {
          const turmaCompare =
            a.turma.localeCompare(
              b.turma,
              "pt-BR",
              {
                numeric: true,
                sensitivity: "base",
              }
            );

          if (turmaCompare !== 0) {
            return turmaCompare;
          }

          return a.nome.localeCompare(
            b.nome,
            "pt-BR",
            {
              sensitivity: "base",
            }
          );
        });
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

  /*
   * A lista de inscrições é a fonte real.
   * Não usamos mais o campo h.inscritos
   * para os totais do painel.
   */
  const totalInscritos =
    inscricoes.length;

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

    const tabelasPorTurma =
      TURMAS.map((turma) => {
        const alunosDaTurma =
          listaCompleta.filter(
            (aluno) =>
              aluno.turma === turma
          );

        if (
          alunosDaTurma.length === 0
        ) {
          return "";
        }

        const linhas =
          alunosDaTurma
            .map(
              (aluno, index) => {
                const aulas =
                  frequenciaDoAluno(
                    aluno.id
                  );

                const frequencia =
                  calcularFrequencia(
                    aluno.id
                  );

                const colunas =
                  aulas
                    .map(
                      (status) => `
                        <td class="presenca">
                          ${status}
                        </td>
                      `
                    )
                    .join("");

                return `
                  <tr>
                    <td class="numero">
                      ${index + 1}
                    </td>

                    <td class="nome">
                      ${escapeHtml(
                  aluno.nome.toUpperCase()
                )}
                    </td>

                    ${colunas}

                    <td class="percentual">
                      ${aulas.some(
                  (status) =>
                    status !== ""
                )
                    ? `${frequencia}%`
                    : "—"
                  }
                    </td>
                  </tr>
                `;
              }
            )
            .join("");

        return `
          <section class="bloco-turma">
            <div class="titulo-turma">
              <strong>
                ${escapeHtml(turma)}
              </strong>

              <span>
                ${alunosDaTurma.length}
                ${alunosDaTurma.length === 1
            ? " aluno"
            : " alunos"
          }
              </span>
            </div>

            <table>
              <thead>
                <tr>
                  <th class="numero">
                    Nº
                  </th>

                  <th class="nome">
                    Aluno
                  </th>

                  ${Array.from(
            {
              length:
                TOTAL_AULAS,
            },
            (_, index) => `
                      <th class="aula">
                        ${String(
              index + 1
            ).padStart(
              2,
              "0"
            )}
                      </th>
                    `
          ).join("")}

                  <th class="percentual">
                    Freq.
                  </th>
                </tr>
              </thead>

              <tbody>
                ${linhas}
              </tbody>
            </table>
          </section>
        `;
      }).join("");

    const janela =
      window.open(
        "",
        "_blank",
        "width=1200,height=800"
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
            Frequência - Reforço Escolar
          </title>

          <style>
            @page {
              size: A4 landscape;
              margin: 10mm;
            }

            * {
              box-sizing: border-box;
            }

            body {
              margin: 0;
              padding: 0;
              background: white;
              color: #111827;
              font-family:
                Arial,
                Helvetica,
                sans-serif;
            }

            .cabecalho {
              display: flex;
              align-items: flex-end;
              justify-content:
                space-between;
              padding-bottom: 12px;
              margin-bottom: 16px;
              border-bottom:
                2px solid #073763;
            }

            .cabecalho h1 {
              margin: 0;
              color: #073763;
              font-size: 20px;
            }

            .cabecalho h2 {
              margin: 4px 0 0;
              font-size: 15px;
            }

            .cabecalho p {
              margin: 5px 0 0;
              color: #4b5563;
              font-size: 12px;
            }

            .total {
              text-align: right;
            }

            .total span {
              display: block;
              color: #6b7280;
              font-size: 10px;
              font-weight: 700;
              text-transform: uppercase;
            }

            .total strong {
              display: block;
              margin-top: 2px;
              color: #073763;
              font-size: 18px;
            }

            .bloco-turma {
              margin-bottom: 18px;
              break-inside: avoid;
              page-break-inside: avoid;
            }

            .titulo-turma {
              display: flex;
              align-items: center;
              justify-content:
                space-between;
              padding: 7px 10px;
              color: white;
              background: #073763;
              border: 1px solid #073763;
              border-radius:
                5px 5px 0 0;
            }

            .titulo-turma strong {
              font-size: 14px;
            }

            .titulo-turma span {
              font-size: 10px;
              font-weight: 600;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              table-layout: fixed;
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
              height: 30px;
              padding: 4px;
              border:
                1px solid #9ca3af;
              font-size: 10px;
            }

            th {
              background: #f1f5f9;
              color: #334155;
              font-weight: 700;
              text-align: center;
            }

            .numero {
              width: 32px;
              text-align: center;
            }

            .nome {
              width: 220px;
              text-align: left;
            }

            td.nome {
              padding-left: 8px;
              font-size: 10.5px;
              font-weight: 600;
            }

            .aula,
            .presenca {
              width: 38px;
              text-align: center;
            }

            td.presenca {
              font-size: 12px;
              font-weight: 800;
            }

            .percentual {
              width: 52px;
              text-align: center;
              font-weight: 700;
            }

            @media print {
              body {
                -webkit-print-color-adjust:
                  exact;
                print-color-adjust:
                  exact;
              }
            }
          </style>
        </head>

        <body>
          <div class="cabecalho">
            <div>
              <h1>
                Colégio do Campeche
              </h1>

              <h2>
                Reforço Escolar —
                Matemática Básica
              </h2>

              <p>
                ${escapeHtml(
      atual.dia
    )}
                •
                ${escapeHtml(
      atual.horario
    )}
                • Frequência das 10 aulas
              </p>
            </div>

            <div class="total">
              <span>
                Total de inscritos
              </span>

              <strong>
                ${listaCompleta.length}
              </strong>
            </div>
          </div>

          ${tabelasPorTurma}
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
        <header className="relative overflow-hidden rounded-[30px] border border-blue-900/10 bg-[#073763] px-6 py-7 text-white shadow-[0_20px_50px_rgba(7,55,99,0.18)] md:px-8 md:py-8">

          {/* ELEMENTOS DECORATIVOS */}
          <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-white/5" />

          <div className="pointer-events-none absolute -bottom-28 right-32 h-56 w-56 rounded-full bg-[#8ED7F2]/10" />

          <div className="relative z-10 flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">

            {/* ESQUERDA */}
            <div className="max-w-2xl">

              <div className="flex flex-wrap items-center gap-2">

                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white/90 backdrop-blur-sm">
                  <ShieldCheck size={14} />

                  Administração
                </span>

                <span className="inline-flex items-center gap-2 rounded-full bg-[#8ED7F2]/15 px-3.5 py-1.5 text-xs font-semibold text-[#c9efff]">
                  <BookOpen size={14} />

                  Matemática Básica
                </span>

              </div>

              <h1 className="mt-5 text-3xl font-bold tracking-tight md:text-4xl">
                Painel de inscrições
              </h1>

              <p className="mt-3 max-w-xl text-sm leading-6 text-white/65 md:text-base">
                Visão geral das vagas, alunos inscritos e distribuição das inscrições por turma e horário.
              </p>

            </div>

            {/* DIREITA */}
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col lg:items-end">

              {/* STATUS */}
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3 backdrop-blur-sm">

                <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300">

                  <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-[#073763]" />

                  <RefreshCw
                    size={18}
                    className={atualizando ? "animate-spin" : ""}
                  />

                </div>

                <div>

                  <span className="block text-[10px] font-bold uppercase tracking-[0.15em] text-white/40">
                    Status
                  </span>

                  <strong className="mt-0.5 block text-sm font-semibold text-white">
                    Dados atualizados
                  </strong>

                  {ultimaAtualizacao && (
                    <span className="mt-0.5 block text-xs text-white/50">
                      Última atualização às{" "}
                      {ultimaAtualizacao.toLocaleTimeString(
                        "pt-BR",
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </span>
                  )}

                </div>

              </div>

              {/* BOTÕES */}
              <div className="flex gap-2">

                <button
                  type="button"
                  onClick={() => carregar(true)}
                  disabled={atualizando}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-[#073763] shadow-sm transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <RefreshCw
                    size={16}
                    className={atualizando ? "animate-spin" : ""}
                  />

                  Atualizar
                </button>

                <button
                  type="button"
                  onClick={sair}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 text-sm font-semibold text-white transition hover:bg-white/15"
                >
                  <LogOut size={16} />

                  Sair
                </button>

              </div>

            </div>

          </div>

        </header>

        {/* RESUMO */}
        <section className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">

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

          <OcupacaoCard
            percentual={ocupacao}
            inscritos={totalInscritos}
            vagas={totalVagas}
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
                Comparativo de participação entre as turmas.
              </p>

            </div>

            {maiorTurma && maiorTurma.total > 0 && (
              <div className="flex items-center gap-3 rounded-2xl border border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-3">

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                  <TrendingUp size={21} />
                </div>

                <div>
                  <span className="block text-xs font-semibold uppercase tracking-wide text-amber-700">
                    Maior procura
                  </span>

                  <strong className="mt-0.5 block text-base text-amber-950">
                    {maiorTurma.turma}
                  </strong>

                  <span className="text-xs text-amber-700">
                    {maiorTurma.total}{" "}
                    {maiorTurma.total === 1 ? "aluno" : "alunos"}
                  </span>
                </div>

              </div>
            )}

          </div>

          <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            {inscritosPorTurma.map((item, index) => {

              const percentual =
                maiorQuantidade > 0
                  ? Math.round(
                    (item.total / maiorQuantidade) * 100
                  )
                  : 0;

              const cor =
                index === 0
                  ? "#073763"
                  : percentual >= 75
                    ? "#2563eb"
                    : percentual >= 50
                      ? "#0ea5e9"
                      : "#64748b";

              return (
                <div
                  key={item.turma}
                  className="group rounded-3xl border border-slate-100 bg-slate-50/60 p-5 transition duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-md"
                >

                  {/* TOPO */}
                  <div className="flex items-center justify-between">

                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-xs font-bold text-slate-500 shadow-sm">
                      {index + 1}
                    </span>

                    {index === 0 && item.total > 0 && (
                      <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#073763]">
                        Maior
                      </span>
                    )}

                  </div>

                  {/* CÍRCULO */}
                  <div className="mt-5 flex justify-center">

                    <div
                      className="relative flex h-28 w-28 items-center justify-center rounded-full"
                      style={{
                        background: `conic-gradient(
                  ${cor} 0%,
                  ${cor} ${percentual}%,
                  #e2e8f0 ${percentual}%,
                  #e2e8f0 100%
                )`,
                      }}
                    >

                      <div className="flex h-[86px] w-[86px] flex-col items-center justify-center rounded-full bg-white shadow-inner">

                        <strong
                          className="text-2xl font-extrabold"
                          style={{
                            color: cor,
                          }}
                        >
                          {percentual}%
                        </strong>

                        <span className="mt-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-400">
                          procura
                        </span>

                      </div>

                    </div>

                  </div>

                  {/* INFORMAÇÕES */}
                  <div className="mt-5 text-center">

                    <strong className="block text-base font-bold text-slate-900">
                      {item.turma}
                    </strong>

                    <span className="mt-1 block text-sm text-slate-500">
                      <strong className="font-bold text-[#073763]">
                        {item.total}
                      </strong>{" "}
                      {item.total === 1 ? "aluno inscrito" : "alunos inscritos"}
                    </span>

                  </div>

                  {/* BARRA INFERIOR */}
                  <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-200">

                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${percentual}%`,
                        backgroundColor: cor,
                      }}
                    />

                  </div>

                </div>
              );
            })}

          </div>

        </section>

        {/* HORÁRIOS */}
        <section className="mt-6">

          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Horários
              </span>

              <h2 className="mt-1 text-xl font-bold text-slate-900">
                Inscrições por dia
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Acompanhe a ocupação e as vagas disponíveis em cada horário.
              </p>
            </div>

            <div className="text-sm text-slate-400">
              {horarios.length}{" "}
              {horarios.length === 1 ? "horário disponível" : "horários disponíveis"}
            </div>

          </div>

          <div className="grid gap-4 md:grid-cols-2">

            {horarios.map((h) => {

              /*
               * Quantidade real deste horário
               * calculada pela lista carregada
               * de /api/admin/inscricoes.
               */
              const inscritos =
                inscricoes.filter(
                  (inscricao) =>
                    inscricao.horarioId ===
                    h.id
                ).length;

              const disponiveis =
                Math.max(
                  0,
                  h.limite -
                    inscritos
                );

              const selecionado =
                filtro === h.id;

              const percentual =
                h.limite > 0
                  ? Math.min(
                    100,
                    Math.round(
                      (
                        inscritos /
                        h.limite
                      ) * 100
                    )
                  )
                  : 0;

              const status =
                percentual >= 100
                  ? {
                    texto: "Lotado",
                    badge:
                      "bg-red-50 text-red-700 border-red-100",
                  }
                  : percentual >= 80
                    ? {
                      texto: "Poucas vagas",
                      badge:
                        "bg-amber-50 text-amber-700 border-amber-100",
                    }
                    : {
                      texto: "Vagas disponíveis",
                      badge:
                        "bg-emerald-50 text-emerald-700 border-emerald-100",
                    };

              return (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => {
                    setFiltro(h.id);
                    setBusca("");
                  }}
                  className={`group relative overflow-hidden rounded-3xl border bg-white p-5 text-left transition-all duration-200 ${selecionado
                    ? "border-[#073763] shadow-[0_12px_35px_rgba(7,55,99,0.14)]"
                    : "border-slate-100 shadow-sm hover:-translate-y-0.5 hover:border-blue-100 hover:shadow-md"
                    }`}
                >

                  {/* DETALHE LATERAL QUANDO SELECIONADO */}
                  {selecionado && (
                    <div className="absolute left-0 top-5 h-[calc(100%-40px)] w-1 rounded-r-full bg-[#073763]" />
                  )}

                  <div className="flex items-center justify-between gap-5">

                    {/* INFORMAÇÕES */}
                    <div className="min-w-0 flex-1">

                      <div className="flex items-start gap-3">

                        <div
                          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition ${selecionado
                            ? "bg-[#073763] text-white"
                            : "bg-blue-50 text-[#073763]"
                            }`}
                        >
                          <CalendarDays size={21} />
                        </div>

                        <div className="min-w-0">

                          <div className="flex flex-wrap items-center gap-2">

                            <strong className="text-base font-bold text-slate-900">
                              {h.dia}
                            </strong>

                            {selecionado && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#073763]">
                                <CheckCircle2 size={11} />
                                Selecionado
                              </span>
                            )}

                          </div>

                          <span className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                            <Clock3 size={14} />

                            {h.horario}
                          </span>

                        </div>

                      </div>

                      {/* STATUS */}
                      <div className="mt-5">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${status.badge}`}
                        >
                          {status.texto}
                        </span>
                      </div>

                      {/* NÚMEROS */}
                      <div className="mt-4 flex flex-wrap items-end gap-x-6 gap-y-3">

                        <div>
                          <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Inscritos
                          </span>

                          <div className="mt-1 flex items-baseline gap-1">
                            <strong className="text-2xl font-bold text-[#073763]">
                              {inscritos}
                            </strong>

                            <span className="text-sm text-slate-400">
                              / {h.limite}
                            </span>
                          </div>
                        </div>

                        <div>
                          <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Disponíveis
                          </span>

                          <strong
                            className={`mt-1 block text-xl font-bold ${disponiveis === 0
                              ? "text-red-600"
                              : disponiveis <= 5
                                ? "text-amber-600"
                                : "text-emerald-600"
                              }`}
                          >
                            {disponiveis}
                          </strong>
                        </div>

                      </div>

                    </div>

                    {/* CÍRCULO */}
                    <div className="shrink-0">

                      <CirculoPercentual
                        percentual={percentual}
                        tamanho="pequeno"
                      />

                    </div>

                  </div>

                  {/* BARRA INFERIOR */}
                  <div className="mt-5">

                    <div className="mb-2 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      <span>Ocupação</span>

                      <span>
                        {percentual}%
                      </span>
                    </div>

                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">

                      <div
                        className={`h-full rounded-full transition-all duration-500 ${percentual >= 100
                          ? "bg-red-500"
                          : percentual >= 80
                            ? "bg-amber-500"
                            : "bg-[#073763]"
                          }`}
                        style={{
                          width: `${percentual}%`,
                        }}
                      />

                    </div>

                  </div>

                </button>
              );
            })}

          </div>

        </section>

        {/* LISTA / FREQUÊNCIA */}
        <section className="mt-6 overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">

          <div className="border-b border-slate-200 p-5 md:p-7">

            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Frequência
                </span>

                <h2 className="mt-1 text-2xl font-bold text-slate-900">
                  {atual?.dia ||
                    "Selecione um horário"}
                </h2>

                <p className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                  <Clock3 size={15} />

                  {atual?.horario}

                  <span className="text-slate-300">
                    •
                  </span>

                  10 aulas
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">

                <select
                  value={filtro}
                  onChange={(e) => {
                    setFiltro(
                      e.target.value
                    );
                    setBusca("");
                  }}
                  className="h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-[#073763] focus:ring-4 focus:ring-blue-100"
                >
                  {horarios.map(
                    (h) => (
                      <option
                        key={h.id}
                        value={h.id}
                      >
                        {h.dia}
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
                  <Printer size={17} />
                  Imprimir frequência
                </button>

              </div>
            </div>

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

              <div className="flex flex-wrap items-center gap-3 text-xs">
                <span className="inline-flex items-center gap-1.5 text-slate-500">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-100 font-bold text-emerald-700">
                    P
                  </span>
                  Presente
                </span>

                <span className="inline-flex items-center gap-1.5 text-slate-500">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-red-100 font-bold text-red-700">
                    F
                  </span>
                  Falta
                </span>

                <span className="text-slate-400">
                  Clique: vazio → P → F
                </span>
              </div>

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
                  : "Nenhum aluno inscrito neste horário."}
              </span>
            </div>
          ) : (
            <div className="space-y-5 bg-slate-50/60 p-4 md:p-6">

              {TURMAS.map((turma) => {
                const alunosDaTurma =
                  lista.filter(
                    (aluno) =>
                      aluno.turma === turma
                  );

                if (
                  alunosDaTurma.length === 0
                ) {
                  return null;
                }

                return (
                  <div
                    key={turma}
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                  >

                    <div className="flex items-center justify-between bg-[#073763] px-5 py-3 text-white">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/55">
                          Turma
                        </span>

                        <strong className="block text-base font-bold">
                          {turma}
                        </strong>
                      </div>

                      <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">
                        {alunosDaTurma.length}{" "}
                        {alunosDaTurma.length ===
                          1
                          ? "aluno"
                          : "alunos"}
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="min-w-[1050px] w-full border-collapse text-left">

                        <thead>
                          <tr className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
                            <th className="w-14 px-4 py-3 text-center font-semibold">
                              Nº
                            </th>

                            <th className="min-w-[240px] px-4 py-3 font-semibold">
                              Aluno
                            </th>

                            {Array.from(
                              {
                                length:
                                  TOTAL_AULAS,
                              },
                              (_, index) => (
                                <th
                                  key={
                                    index
                                  }
                                  className="w-14 px-2 py-3 text-center font-semibold"
                                >
                                  {String(
                                    index +
                                    1
                                  ).padStart(
                                    2,
                                    "0"
                                  )}
                                </th>
                              )
                            )}

                            <th className="w-24 px-3 py-3 text-center font-semibold">
                              Freq.
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          {alunosDaTurma.map(
                            (
                              aluno,
                              index
                            ) => {
                              const aulas =
                                frequenciaDoAluno(
                                  aluno.id
                                );

                              const percentual =
                                calcularFrequencia(
                                  aluno.id
                                );

                              const temRegistro =
                                aulas.some(
                                  (
                                    status
                                  ) =>
                                    status !==
                                    ""
                                );

                              return (
                                <tr
                                  key={
                                    aluno.id
                                  }
                                  className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/70"
                                >
                                  <td className="px-4 py-3 text-center text-sm font-medium text-slate-400">
                                    {index +
                                      1}
                                  </td>

                                  <td className="px-4 py-3">
                                    <div className="flex items-center gap-3">
                                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-[#073763]">
                                        {aluno.nome
                                          .charAt(
                                            0
                                          )
                                          .toUpperCase()}
                                      </div>

                                      <strong className="whitespace-nowrap text-sm font-semibold uppercase text-slate-800">
                                        {aluno.nome}
                                      </strong>
                                    </div>
                                  </td>

                                  {aulas.map(
                                    (
                                      status,
                                      aulaIndex
                                    ) => (
                                      <td
                                        key={
                                          aulaIndex
                                        }
                                        className="px-2 py-3 text-center"
                                      >
                                        <button
                                          type="button"
                                          onClick={() =>
                                            alternarPresenca(
                                              aluno.id,
                                              aulaIndex
                                            )
                                          }
                                          title={`Aula ${aulaIndex + 1}: clique para alterar a frequência`}
                                          className={`mx-auto flex h-9 w-9 items-center justify-center rounded-lg border text-xs font-extrabold transition ${status ===
                                              "P"
                                              ? "border-emerald-200 bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                                              : status ===
                                                "F"
                                                ? "border-red-200 bg-red-100 text-red-700 hover:bg-red-200"
                                                : "border-slate-200 bg-white text-slate-300 hover:border-blue-300 hover:bg-blue-50"
                                            }`}
                                        >
                                          {status ||
                                            "—"}
                                        </button>
                                      </td>
                                    )
                                  )}

                                  <td className="px-3 py-3 text-center">
                                    <span
                                      className={`inline-flex min-w-[58px] justify-center rounded-full px-2.5 py-1 text-xs font-bold ${!temRegistro
                                          ? "bg-slate-100 text-slate-400"
                                          : percentual >=
                                            75
                                            ? "bg-emerald-100 text-emerald-700"
                                            : percentual >=
                                              50
                                              ? "bg-amber-100 text-amber-700"
                                              : "bg-red-100 text-red-700"
                                        }`}
                                    >
                                      {temRegistro
                                        ? `${percentual}%`
                                        : "—"}
                                    </span>
                                  </td>
                                </tr>
                              );
                            }
                          )}
                        </tbody>

                      </table>
                    </div>

                  </div>
                );
              })}

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
            Dados atualizados ao abrir, ao voltar para esta aba ou pelo botão Atualizar
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

function OcupacaoCard({
  percentual,
  inscritos,
  vagas,
}: {
  percentual: number;
  inscritos: number;
  vagas: number;
}) {
  return (
    <article className="flex min-h-[150px] items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">

      <div>

        <span className="text-sm font-medium text-slate-500">
          Ocupação
        </span>

        <strong className="mt-2 block text-xl font-bold text-slate-900">
          {inscritos} de {vagas}
        </strong>

        <p className="mt-1 text-xs text-slate-400">
          Vagas preenchidas
        </p>

      </div>

      <CirculoPercentual
        percentual={
          percentual
        }
        tamanho="medio"
      />

    </article>
  );
}

function CirculoPercentual({
  percentual,
  tamanho = "medio",
}: {
  percentual: number;
  tamanho?:
  | "pequeno"
  | "medio";
}) {
  const valor = Math.max(
    0,
    Math.min(
      100,
      percentual
    )
  );

  const cor =
    valor >= 90
      ? "#dc2626"
      : valor >= 70
        ? "#f59e0b"
        : "#16a34a";

  const tamanhoExterno =
    tamanho === "pequeno"
      ? "h-24 w-24"
      : "h-28 w-28";

  const tamanhoInterno =
    tamanho === "pequeno"
      ? "h-[74px] w-[74px]"
      : "h-[86px] w-[86px]";

  const tamanhoTexto =
    tamanho === "pequeno"
      ? "text-xl"
      : "text-2xl";

  return (
    <div
      className={`relative flex shrink-0 items-center justify-center rounded-full ${tamanhoExterno}`}
      style={{
        background: `conic-gradient(
          ${cor} 0%,
          ${cor} ${valor}%,
          #e2e8f0 ${valor}%,
          #e2e8f0 100%
        )`,
      }}
    >

      <div
        className={`flex flex-col items-center justify-center rounded-full bg-white shadow-inner ${tamanhoInterno}`}
      >

        <strong
          className={`${tamanhoTexto} font-extrabold`}
          style={{
            color: cor,
          }}
        >
          {valor}%
        </strong>

        <span className="mt-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-400">
          ocupado
        </span>

      </div>

    </div>
  );
}