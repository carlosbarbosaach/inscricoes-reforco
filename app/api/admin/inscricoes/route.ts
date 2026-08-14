import { NextResponse } from "next/server";

import { getAdminDb } from "@/lib/firebase-admin";
import { isAdminAuthenticated } from "@/lib/admin-auth";

type Inscricao = {
  id: string;
  horarioId: string;
  nome: string;
  turma: string;
};

export const dynamic =
  "force-dynamic";

export async function GET() {
  try {
    const autenticado =
      await isAdminAuthenticated();

    if (!autenticado) {
      return NextResponse.json(
        {
          error:
            "Não autorizado.",
        },
        {
          status: 401,
        }
      );
    }

    const adminDb =
      getAdminDb();

    /*
     * Busca horários e inscrições
     * uma única vez.
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
     * Monta a lista REAL de inscrições.
     */
    const inscricoes: Inscricao[] =
      inscricoesSnapshot.docs.map(
        (doc) => {
          const data =
            doc.data();

          return {
            id: doc.id,

            horarioId:
              String(
                data.horarioId || ""
              ),

            nome:
              String(
                data.nome || ""
              ),

            turma:
              String(
                data.turma || ""
              ),
          };
        }
      );

    /*
     * Quantidade real por horário.
     */
    const inscritosPorHorario =
      inscricoes.reduce<
        Record<string, number>
      >(
        (
          acumulador,
          inscricao
        ) => {
          if (
            !inscricao.horarioId
          ) {
            return acumulador;
          }

          acumulador[
            inscricao.horarioId
          ] =
            (
              acumulador[
                inscricao.horarioId
              ] || 0
            ) + 1;

          return acumulador;
        },
        {}
      );

    /*
     * Horários com "inscritos"
     * calculado pela coleção real.
     */
    const horarios =
      horariosSnapshot.docs.map(
        (doc) => {
          const data =
            doc.data();

          return {
            id: doc.id,
            ...data,

            inscritos:
              inscritosPorHorario[
                doc.id
              ] || 0,
          };
        }
      );

    console.log(
      "ADMIN API - horários:",
      horarios.length
    );

    console.log(
      "ADMIN API - inscrições:",
      inscricoes.length
    );

    return NextResponse.json(
      {
        horarios,
        inscricoes,
      },
      {
        status: 200,

        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate",
        },
      }
    );
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