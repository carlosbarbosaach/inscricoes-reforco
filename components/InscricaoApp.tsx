"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Info,
  LockKeyhole,
  Users,
} from "lucide-react";

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

const TURMAS = [
  "1EM A",
  "2EM A",
  "2EM B",
  "3EM A",
];

export default function InscricaoApp() {
  const [horarios, setHorarios] =
    useState<Horario[]>([]);

  const [sel, setSel] =
    useState("");

  const [nome, setNome] =
    useState("");

  const [turma, setTurma] =
    useState("");

  const [msg, setMsg] =
    useState("");

  const [erro, setErro] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [
    carregandoHorarios,
    setCarregandoHorarios,
  ] = useState(true);

  const formularioRef =
    useRef<HTMLElement | null>(null);

  /* =========================================================
     FIREBASE - HORÁRIOS EM TEMPO REAL
  ========================================================= */

  useEffect(() => {
    const q = query(
      collection(
        db,
        "horarios"
      ),
      orderBy("ordem")
    );

    const unsubscribe =
      onSnapshot(
        q,

        (snapshot) => {
          const dados =
            snapshot.docs.map(
              (doc) => ({
                id: doc.id,
                ...doc.data(),
              })
            ) as Horario[];

          setHorarios(dados);

          setCarregandoHorarios(
            false
          );

          setSel((atual) => {
            if (!atual) {
              return "";
            }

            const horarioAtual =
              dados.find(
                (h) =>
                  h.id === atual
              );

            if (!horarioAtual) {
              return "";
            }

            const semVagas =
              horarioAtual.inscritos >=
              horarioAtual.limite;

            if (
              !horarioAtual.ativo ||
              semVagas
            ) {
              return "";
            }

            return atual;
          });
        },

        (error) => {
          console.error(
            "Erro ao carregar horários:",
            error
          );

          setErro(
            "Não foi possível carregar os horários disponíveis."
          );

          setCarregandoHorarios(
            false
          );
        }
      );

    return unsubscribe;
  }, []);

  /* =========================================================
     HORÁRIO SELECIONADO
  ========================================================= */

  const selecionado =
    useMemo(
      () =>
        horarios.find(
          (horario) =>
            horario.id === sel
        ),
      [horarios, sel]
    );

  /* =========================================================
     SELECIONAR HORÁRIO
  ========================================================= */

  function selecionarHorario(
    horario: Horario
  ) {
    const restantes =
      Math.max(
        0,
        horario.limite -
        horario.inscritos
      );

    if (
      !horario.ativo ||
      restantes === 0
    ) {
      return;
    }

    setSel(horario.id);

    setErro("");
    setMsg("");

    setTimeout(() => {
      formularioRef.current?.scrollIntoView(
        {
          behavior:
            "smooth",
          block: "start",
        }
      );
    }, 150);
  }

  /* =========================================================
     ENVIO DA INSCRIÇÃO
  ========================================================= */

  async function enviar(
    e: React.FormEvent
  ) {
    e.preventDefault();

    setErro("");
    setMsg("");

    if (!sel) {
      setErro(
        "Selecione um dia para continuar."
      );
      return;
    }

    if (
      nome.trim().length < 5
    ) {
      setErro(
        "Informe o nome completo do aluno."
      );
      return;
    }

    if (!turma) {
      setErro(
        "Selecione a turma."
      );
      return;
    }

    setLoading(true);

    try {
      const response =
        await fetch(
          "/api/inscricoes",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                horarioId: sel,
                nome:
                  nome.trim(),
                turma,
              }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
          "Não foi possível realizar a inscrição."
        );
      }

      setMsg(
        `Sua vaga foi reservada para ${selecionado?.dia}, ${selecionado?.horario}. As aulas iniciam em 18 de agosto.`
      );

      setNome("");
      setTurma("");
      setSel("");

      setTimeout(() => {
        window.scrollTo({
          top:
            document.body
              .scrollHeight,
          behavior:
            "smooth",
        });
      }, 100);
    } catch (
    error: unknown
    ) {
      const mensagem =
        error instanceof Error
          ? error.message
          : "Não foi possível realizar a inscrição.";

      setErro(mensagem);
    } finally {
      setLoading(false);
    }
  }

  /* =========================================================
     TOTAL DE VAGAS
  ========================================================= */

  const totalVagas =
    horarios.reduce(
      (total, horario) =>
        total +
        horario.limite,
      0
    );

  const totalInscritos =
    horarios.reduce(
      (total, horario) =>
        total +
        horario.inscritos,
      0
    );

  const vagasRestantes =
    Math.max(
      0,
      totalVagas -
      totalInscritos
    );

  /* =========================================================
     JSX
  ========================================================= */

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 md:px-6 md:py-10">

      <section className="mx-auto w-full max-w-5xl">

        {/* ===================================================
            CABEÇALHO
        =================================================== */}

        <header className="relative overflow-hidden rounded-[30px] border border-blue-900/10 bg-[#073763] px-6 py-7 text-white shadow-[0_20px_50px_rgba(7,55,99,0.18)] md:px-9 md:py-9">

          {/* DECORAÇÃO */}
          <div className="pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full bg-white/[0.05]" />

          <div className="pointer-events-none absolute -bottom-32 right-24 h-64 w-64 rounded-full bg-[#8ED7F2]/10" />

          <div className="relative z-10">

            {/* IDENTIFICAÇÃO */}
            <div className="flex flex-wrap items-center gap-2">

              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white/90 backdrop-blur-sm">
                Colégio do Campeche
              </span>

              <span className="inline-flex items-center gap-2 rounded-full bg-[#8ED7F2]/15 px-3.5 py-1.5 text-xs font-semibold text-[#d5f3ff]">
                <BookOpen
                  size={14}
                />

                Ensino Médio
              </span>

            </div>

            {/* TÍTULO */}
            <div className="mt-6">

              <span className="text-xs font-bold uppercase tracking-[0.18em] text-[#8ED7F2]">
                Reforço Escolar
              </span>

              <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
                Matemática Básica
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/65 md:text-base md:leading-7">
                Escolha seu dia,
                reserve sua vaga e
                fortaleça seus
                conhecimentos em
                Matemática.
              </p>

            </div>

            {/* CARDS INFORMATIVOS */}
            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

              <CabecalhoInfo
                icon={
                  <BookOpen
                    size={20}
                  />
                }
                titulo="10 aulas"
                descricao="Programa gratuito"
              />

              <CabecalhoInfo
                icon={
                  <CalendarDays
                    size={20}
                  />
                }
                titulo="18 de agosto"
                descricao="Início das aulas"
              />

              <CabecalhoInfo
                icon={
                  <Clock3
                    size={20}
                  />
                }
                titulo="14h às 14h50"
                descricao="Horário das aulas"
              />

              <CabecalhoInfo
                icon={
                  <Users
                    size={20}
                  />
                }
                titulo={
                  `${vagasRestantes} vagas`
                }
                descricao="Disponíveis agora"
              />

            </div>

          </div>

        </header>

        {/* ===================================================
            AVISO
        =================================================== */}

        <section className="mt-6 overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm">

          <div className="flex gap-4 p-5 md:p-6">

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-[#073763]">

              <Info
                size={20}
              />

            </div>

            <div>

              <strong className="text-sm font-bold text-[#073763]">
                Como funciona a inscrição?
              </strong>

              <p className="mt-1.5 text-sm leading-6 text-slate-600">
                Escolha o dia em que
                deseja participar.
                Sua vaga ficará
                reservada para esse
                mesmo dia durante
                todo o período das
                aulas de Matemática
                Básica.
              </p>

              <div className="mt-3 flex items-center gap-2 text-xs font-medium text-slate-500">

                <span className="relative flex h-2.5 w-2.5">

                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-30" />

                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />

                </span>

                Vagas atualizadas em tempo real

              </div>

            </div>

          </div>

        </section>

        {/* ===================================================
            PASSO 1
        =================================================== */}

        <section className="mt-10">

          {/* CABEÇALHO PASSO 1 */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div className="flex items-start gap-3">

              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#073763] text-sm font-bold text-white shadow-sm">
                1
              </span>

              <div>

                <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
                  Passo 1 de 2
                </span>

                <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900 md:text-2xl">
                  Escolha o dia da sua aula
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Selecione uma das opções disponíveis.
                </p>

              </div>

            </div>

            {!carregandoHorarios && (
              <span className="text-xs font-medium text-slate-400">
                {horarios.length}{" "}
                {horarios.length ===
                  1
                  ? "opção disponível"
                  : "opções disponíveis"}
              </span>
            )}

          </div>

          {/* LOADING */}
          {carregandoHorarios ? (

            <div className="grid gap-5 md:grid-cols-2">

              {[1, 2].map(
                (item) => (
                  <div
                    key={item}
                    className="h-[280px] animate-pulse rounded-3xl border border-slate-100 bg-white shadow-sm"
                  />
                )
              )}

            </div>

          ) : (

            <div className="grid gap-5 md:grid-cols-2">

              {horarios.map(
                (h) => {

                  const rest =
                    Math.max(
                      0,
                      h.limite -
                      h.inscritos
                    );

                  const pct =
                    h.limite >
                      0
                      ? Math.min(
                        100,
                        Math.round(
                          (h.inscritos /
                            h.limite) *
                          100
                        )
                      )
                      : 0;

                  const selected =
                    sel === h.id;

                  const indisponivel =
                    !h.ativo ||
                    rest === 0;

                  const cor =
                    rest === 0
                      ? "#dc2626"
                      : rest <=
                        5
                        ? "#f59e0b"
                        : "#073763";

                  return (
                    <article
                      key={
                        h.id
                      }
                      onClick={() =>
                        selecionarHorario(
                          h
                        )
                      }
                      className={`group relative overflow-hidden rounded-3xl border bg-white p-5 transition-all duration-200 md:p-6 ${selected
                          ? "cursor-pointer border-[#073763] shadow-[0_16px_40px_rgba(7,55,99,0.15)]"
                          : indisponivel
                            ? "cursor-not-allowed border-slate-200 opacity-70"
                            : "cursor-pointer border-slate-100 shadow-sm hover:-translate-y-1 hover:border-blue-100 hover:shadow-lg"
                        }`}
                    >

                      {/* BARRA SELECIONADO */}
                      {selected && (
                        <div className="absolute left-0 top-6 h-[calc(100%-48px)] w-1 rounded-r-full bg-[#073763]" />
                      )}

                      <div className="flex items-start justify-between gap-4">

                        {/* CONTEÚDO */}
                        <div className="min-w-0 flex-1">

                          <div className="flex items-center gap-3">

                            <div
                              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition ${selected
                                  ? "bg-[#073763] text-white"
                                  : "bg-blue-50 text-[#073763]"
                                }`}
                            >

                              <CalendarDays
                                size={22}
                              />

                            </div>

                            <div className="min-w-0">

                              <div className="flex flex-wrap items-center gap-2">

                                <h3 className="text-lg font-bold text-slate-900">
                                  {
                                    h.dia
                                  }
                                </h3>

                                {selected && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700">

                                    <CheckCircle2
                                      size={
                                        11
                                      }
                                    />

                                    Selecionado

                                  </span>
                                )}

                                {!h.ativo && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-600">

                                    <LockKeyhole
                                      size={
                                        11
                                      }
                                    />

                                    Encerrado

                                  </span>
                                )}

                              </div>

                              <span className="mt-1.5 flex items-center gap-1.5 text-sm text-slate-500">

                                <Clock3
                                  size={
                                    14
                                  }
                                />

                                {
                                  h.horario
                                }

                              </span>

                            </div>

                          </div>

                          {/* DADOS */}
                          <div className="mt-6 flex flex-wrap items-end gap-x-7 gap-y-4">

                            <div>

                              <span className="block text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                                Vagas restantes
                              </span>

                              <div className="mt-1 flex items-baseline gap-1">

                                <strong
                                  className="text-3xl font-extrabold"
                                  style={{
                                    color:
                                      cor,
                                  }}
                                >
                                  {
                                    rest
                                  }
                                </strong>

                                <span className="text-sm text-slate-400">
                                  de{" "}
                                  {
                                    h.limite
                                  }
                                </span>

                              </div>

                            </div>

                            <div>

                              <span className="block text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                                Inscritos
                              </span>

                              <strong className="mt-1 block text-xl font-bold text-slate-700">
                                {
                                  h.inscritos
                                }
                              </strong>

                            </div>

                          </div>

                          {/* STATUS */}
                          <div className="mt-4">

                            {rest ===
                              0 ? (

                              <span className="inline-flex rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700">
                                Vagas esgotadas
                              </span>

                            ) : rest <=
                              5 ? (

                              <span className="inline-flex rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
                                Últimas{" "}
                                {
                                  rest
                                }{" "}
                                vagas
                              </span>

                            ) : (

                              <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                                Vagas disponíveis
                              </span>

                            )}

                          </div>

                        </div>

                        {/* CÍRCULO */}
                        <CirculoOcupacao
                          percentual={
                            pct
                          }
                          cor={
                            cor
                          }
                        />

                      </div>

                      {/* BARRA */}
                      <div className="mt-5">

                        <div className="mb-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">

                          <span>
                            Ocupação
                          </span>

                          <span>
                            {pct}%
                          </span>

                        </div>

                        <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">

                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${pct}%`,
                              backgroundColor:
                                cor,
                            }}
                          />

                        </div>

                      </div>

                      {/* BOTÃO */}
                      <button
                        type="button"
                        disabled={
                          indisponivel
                        }
                        onClick={(
                          e
                        ) => {
                          e.stopPropagation();

                          selecionarHorario(
                            h
                          );
                        }}
                        className={`mt-6 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-semibold transition ${selected
                            ? "bg-blue-50 text-[#073763]"
                            : indisponivel
                              ? "cursor-not-allowed bg-slate-100 text-slate-400"
                              : "bg-[#073763] text-white shadow-sm hover:bg-[#052b4e]"
                          }`}
                      >

                        {!h.ativo ? (
                          <>
                            <LockKeyhole
                              size={
                                16
                              }
                            />

                            Inscrições encerradas
                          </>
                        ) : rest ===
                          0 ? (
                          <>
                            <LockKeyhole
                              size={
                                16
                              }
                            />

                            Vagas esgotadas
                          </>
                        ) : selected ? (
                          <>
                            <CheckCircle2
                              size={
                                16
                              }
                            />

                            Dia selecionado
                          </>
                        ) : (
                          <>
                            <CalendarDays
                              size={
                                16
                              }
                            />

                            Escolher{" "}
                            {
                              h.dia
                            }
                          </>
                        )}

                      </button>

                    </article>
                  );
                }
              )}

            </div>

          )}

        </section>

        {/* ===================================================
            PASSO 2
        =================================================== */}

        {sel &&
          selecionado && (

            <section
              ref={
                formularioRef
              }
              className="scroll-mt-6 mt-8 overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.07)]"
            >

              {/* CABEÇALHO */}
              <div className="border-b border-slate-100 p-6 md:p-7">

                <div className="flex items-start gap-3">

                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#073763] text-sm font-bold text-white">
                    2
                  </span>

                  <div>

                    <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
                      Passo 2 de 2
                    </span>

                    <h2 className="mt-1 text-xl font-bold text-slate-900 md:text-2xl">
                      Complete sua inscrição
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Informe os dados do aluno para reservar a vaga.
                    </p>

                  </div>

                </div>

              </div>

              <div className="p-6 md:p-7">

                {/* RESUMO */}
                <div className="flex flex-col gap-4 rounded-2xl border border-blue-100 bg-blue-50/60 p-4 sm:flex-row sm:items-center sm:justify-between">

                  <div className="flex items-center gap-4">

                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#073763] text-white">

                      <CalendarDays
                        size={
                          21
                        }
                      />

                    </div>

                    <div>

                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Horário escolhido
                      </span>

                      <strong className="mt-1 block text-base font-bold text-[#073763]">
                        {
                          selecionado.dia
                        }
                      </strong>

                      <span className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">

                        <Clock3
                          size={
                            14
                          }
                        />

                        {
                          selecionado.horario
                        }

                      </span>

                    </div>

                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSel("");
                      setMsg("");
                      setErro("");

                      window.scrollTo(
                        {
                          top:
                            0,
                          behavior:
                            "smooth",
                        }
                      );
                    }}
                    className="rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-xs font-semibold text-[#073763] transition hover:bg-blue-50"
                  >
                    Trocar dia
                  </button>

                </div>

                {/* FORMULÁRIO */}
                <form
                  onSubmit={
                    enviar
                  }
                  className="mt-6 grid gap-5 md:grid-cols-2"
                >

                  {/* NOME */}
                  <div>

                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Nome completo
                    </label>

                    <input
                      required
                      minLength={
                        5
                      }
                      value={
                        nome
                      }
                      onChange={(
                        e
                      ) =>
                        setNome(
                          e.target
                            .value
                        )
                      }
                      placeholder="Digite o nome completo do aluno"
                      className="h-12 w-full rounded-xl border border-slate-300 bg-slate-50/40 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#073763] focus:bg-white focus:ring-4 focus:ring-blue-100"
                    />

                  </div>

                  {/* TURMA */}
                  <div>

                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Turma
                    </label>

                    <select
                      required
                      value={
                        turma
                      }
                      onChange={(
                        e
                      ) =>
                        setTurma(
                          e.target
                            .value
                        )
                      }
                      className="h-12 w-full rounded-xl border border-slate-300 bg-slate-50/40 px-4 text-sm text-slate-700 outline-none transition focus:border-[#073763] focus:bg-white focus:ring-4 focus:ring-blue-100"
                    >

                      <option value="">
                        Selecione sua turma
                      </option>

                      {TURMAS.map(
                        (
                          item
                        ) => (
                          <option
                            key={
                              item
                            }
                            value={
                              item
                            }
                          >
                            {
                              item
                            }
                          </option>
                        )
                      )}

                    </select>

                  </div>

                  {/* AVISO RESERVA */}
                  <div className="md:col-span-2 flex gap-3 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3.5 text-sm leading-6 text-amber-900">

                    <Info
                      size={
                        18
                      }
                      className="mt-0.5 shrink-0 text-amber-600"
                    />

                    <span>
                      Ao confirmar,
                      sua vaga ficará
                      reservada para{" "}
                      <strong>
                        {
                          selecionado.dia
                        }
                      </strong>{" "}
                      durante todo o
                      período das
                      aulas de
                      Matemática
                      Básica.
                    </span>

                  </div>

                  {/* BOTÃO */}
                  <button
                    type="submit"
                    disabled={
                      loading
                    }
                    className="md:col-span-2 flex h-12 items-center justify-center gap-2 rounded-xl bg-[#073763] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#052b4e] disabled:cursor-not-allowed disabled:opacity-60"
                  >

                    {loading ? (
                      <>

                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />

                        Realizando inscrição...

                      </>
                    ) : (
                      <>

                        <CheckCircle2
                          size={
                            17
                          }
                        />

                        Confirmar minha inscrição

                      </>
                    )}

                  </button>

                </form>

              </div>

            </section>
          )}

        {/* ===================================================
            SUCESSO
        =================================================== */}

        {msg && (

          <div className="mt-6 overflow-hidden rounded-3xl border border-emerald-200 bg-white shadow-sm">

            <div className="flex gap-4 p-5 md:p-6">

              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">

                <CheckCircle2
                  size={24}
                />

              </div>

              <div>

                <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-600">
                  Tudo certo
                </span>

                <strong className="mt-1 block text-lg font-bold text-slate-900">
                  Inscrição realizada com sucesso!
                </strong>

                <p className="mt-1 text-sm leading-6 text-slate-600">
                  {msg}
                </p>

                <div className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">

                  <CheckCircle2
                    size={
                      14
                    }
                  />

                  Vaga confirmada

                </div>

              </div>

            </div>

          </div>

        )}

        {/* ===================================================
            ERRO
        =================================================== */}

        {erro && (

          <div className="mt-6 flex gap-4 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-800">

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100">

              <Info
                size={19}
              />

            </div>

            <div>

              <strong className="block font-bold">
                Atenção
              </strong>

              <span className="mt-1 block text-sm leading-6">
                {erro}
              </span>

            </div>

          </div>

        )}

        {/* ===================================================
            RODAPÉ
        =================================================== */}

        <footer className="mt-10 border-t border-slate-200 py-7">

          <div className="flex flex-col gap-4 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">

            <div className="flex items-center justify-center gap-3 sm:justify-start">

              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-[#073763]">

                <BookOpen
                  size={
                    16
                  }
                />

              </div>

              <div>

                <strong className="block text-sm font-semibold text-slate-600">
                  Colégio do Campeche
                </strong>

                <span className="text-xs text-slate-400">
                  Matemática Básica • Ensino Médio
                </span>

              </div>

            </div>

            <div className="flex items-center justify-center gap-2 text-xs text-slate-400">

              <span className="h-2 w-2 rounded-full bg-emerald-500" />

              Sistema de inscrições online

            </div>

          </div>

        </footer>

      </section>

    </main>
  );
}

/* ===========================================================
   COMPONENTE - CARD DO CABEÇALHO
=========================================================== */

function CabecalhoInfo({
  icon,
  titulo,
  descricao,
}: {
  icon:
  React.ReactNode;
  titulo: string;
  descricao: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.07] p-3.5 backdrop-blur-sm">

      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[#bcecff]">
        {icon}
      </div>

      <div className="min-w-0">

        <strong className="block truncate text-sm font-semibold text-white">
          {titulo}
        </strong>

        <span className="mt-0.5 block text-[11px] text-white/50">
          {descricao}
        </span>

      </div>

    </div>
  );
}

/* ===========================================================
   COMPONENTE - CÍRCULO DE OCUPAÇÃO
=========================================================== */

function CirculoOcupacao({
  percentual,
  cor,
}: {
  percentual: number;
  cor: string;
}) {
  const valor =
    Math.max(
      0,
      Math.min(
        100,
        percentual
      )
    );

  return (
    <div
      className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full"
      style={{
        background: `conic-gradient(
          ${cor} 0%,
          ${cor} ${valor}%,
          #e2e8f0 ${valor}%,
          #e2e8f0 100%
        )`,
      }}
    >

      <div className="flex h-[74px] w-[74px] flex-col items-center justify-center rounded-full bg-white shadow-inner">

        <strong
          className="text-xl font-extrabold"
          style={{
            color: cor,
          }}
        >
          {valor}%
        </strong>

        <span className="mt-0.5 text-[8px] font-bold uppercase tracking-wider text-slate-400">
          ocupado
        </span>

      </div>

    </div>
  );
}