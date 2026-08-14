import { NextResponse } from "next/server";

import { getAdminDb } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

/* =========================================================
   GET /api/horarios

   Retorna os horários com a quantidade REAL de inscritos.
   Não utiliza o campo "inscritos" salvo no documento horario.
========================================================= */

export async function GET() {
  try {
    const adminDb =
      getAdminDb();

    /* =====================================================
       1. BUSCAR HORÁRIOS
    ===================================================== */

    const horariosSnapshot =
      await adminDb
        .collection("horarios")
        .orderBy("ordem")
        .get();

    /* =====================================================
       2. CONTAR INSCRIÇÕES REAIS
    ===================================================== */

    const horarios =
      await Promise.all(
        horariosSnapshot.docs.map(
          async (doc) => {
            const data =
              doc.data();

            /*
             * Conta somente as inscrições
             * pertencentes a este horário.
             *
             * Exemplo:
             * horarioId === "terca"
             */
            const contagemSnapshot =
              await adminDb
                .collection("inscricoes")
                .where(
                  "horarioId",
                  "==",
                  doc.id
                )
                .count()
                .get();

            const inscritos =
              contagemSnapshot
                .data()
                .count;

            /* =============================================
               IMPORTANTE

               inscritos vem DEPOIS de ...data.

               Portanto, mesmo que no Firebase exista:

               inscritos: 30

               se existem apenas 29 inscrições reais,
               a API retorna:

               inscritos: 29
            ============================================= */

            return {
              id: doc.id,
              ...data,
              inscritos,
            };
          }
        )
      );

    /* =====================================================
       3. RETORNO
    ===================================================== */

    return NextResponse.json(
      {
        horarios,
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
      "ERRO AO CARREGAR HORÁRIOS:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Não foi possível carregar os horários.",
      },
      {
        status: 500,
      }
    );
  }
}