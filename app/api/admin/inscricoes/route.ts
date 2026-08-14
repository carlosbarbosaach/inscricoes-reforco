import { NextResponse } from "next/server";

import { getAdminDb } from "@/lib/firebase-admin";
import { isAdminAuthenticated } from "@/lib/admin-auth";

type Inscricao = {
  id: string;
  horarioId: string;
  nome?: string;
  turma?: string;
};

export async function GET() {
  try {
    const autenticado =
      await isAdminAuthenticated();

    if (!autenticado) {
      return NextResponse.json(
        {
          error: "Não autorizado.",
        },
        {
          status: 401,
        }
      );
    }

    /*
     * Firebase só inicializa
     * depois de confirmar que
     * o usuário está autenticado.
     */
    const adminDb =
      getAdminDb();

    /*
     * Busca horários e inscrições
     * apenas uma vez.
     */
    const [
      horariosSnapshot,
      inscricoesSnapshot,
    ] = await Promise.all([
      adminDb
        .collection("horarios")
        .orderBy("ordem")
        .get(),

      adminDb
        .collection("inscricoes")
        .get(),
    ]);

    /*
     * Inscrições reais.
     */
    const inscricoes: Inscricao[] =
      inscricoesSnapshot.docs.map(
        (doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<
            Inscricao,
            "id"
          >),
        })
      );

    /*
     * Conta quantos alunos
     * existem em cada horário.
     *
     * Exemplo:
     *
     * {
     *   terca: 29,
     *   sexta: 23
     * }
     */
    const inscritosPorHorario =
      inscricoes.reduce<
        Record<string, number>
      >(
        (
          acumulador,
          inscricao
        ) => {
          const horarioId =
            inscricao.horarioId;

          if (!horarioId) {
            return acumulador;
          }

          acumulador[
            horarioId
          ] =
            (
              acumulador[
              horarioId
              ] || 0
            ) + 1;

          return acumulador;
        },
        {}
      );

    /*
     * Horários.
     *
     * IMPORTANTE:
     * ignoramos o valor antigo
     * de "inscritos" salvo no
     * documento e usamos a
     * quantidade real.
     */
    const horarios =
      horariosSnapshot.docs.map(
        (doc) => {
          const data =
            doc.data();

          const inscritos =
            inscritosPorHorario[
            doc.id
            ] || 0;

          return {
            id: doc.id,

            ...data,

            /*
             * Sobrescreve o
             * inscritos antigo.
             */
            inscritos,
          };
        }
      );

    return NextResponse.json({
      horarios,
      inscricoes,
    });
  } catch (error) {
    console.error(
      "ERRO ADMIN INSCRICOES:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Erro ao carregar inscrições.",
      },
      {
        status: 500,
      }
    );
  }
}