import { NextResponse } from "next/server";

import { getAdminDb } from "@/lib/firebase-admin";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { FieldValue } from "firebase-admin/firestore";

type StatusPresenca =
  | ""
  | "P"
  | "F";

const TOTAL_AULAS = 10;

export const dynamic =
  "force-dynamic";

/* =========================================================
   GET /api/admin/frequencias

   Carrega todas as frequências salvas no Firestore.
========================================================= */

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

    const snapshot =
      await adminDb
        .collection(
          "frequencias"
        )
        .get();

    const frequencias:
      Record<
        string,
        StatusPresenca[]
      > = {};

    snapshot.docs.forEach(
      (doc) => {
        const data =
          doc.data();

        const aulas =
          Array.from(
            {
              length:
                TOTAL_AULAS,
            },
            (
              _,
              index
            ) => {
              const campo =
                `aula${String(
                  index + 1
                ).padStart(
                  2,
                  "0"
                )}`;

              const valor =
                data[
                  campo
                ];

              if (
                valor === "P" ||
                valor === "F"
              ) {
                return valor;
              }

              return "";
            }
          ) as StatusPresenca[];

        frequencias[
          doc.id
        ] =
          aulas;
      }
    );

    return NextResponse.json(
      {
        frequencias,
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
      "ERRO AO CARREGAR FREQUÊNCIAS:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Não foi possível carregar as frequências.",
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
   PATCH /api/admin/frequencias

   Salva somente UMA aula de UM aluno.
   Não precisa ler o documento antes.
========================================================= */

export async function PATCH(
  req: Request
) {
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

    const body =
      await req.json();

    const alunoId =
      String(
        body.alunoId ||
          ""
      ).trim();

    const aulaIndex =
      Number(
        body.aulaIndex
      );

    const status =
      String(
        body.status ??
          ""
      ) as StatusPresenca;

    if (!alunoId) {
      return NextResponse.json(
        {
          error:
            "Aluno inválido.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !Number.isInteger(
        aulaIndex
      ) ||
      aulaIndex < 0 ||
      aulaIndex >=
        TOTAL_AULAS
    ) {
      return NextResponse.json(
        {
          error:
            "Aula inválida.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      status !== "" &&
      status !== "P" &&
      status !== "F"
    ) {
      return NextResponse.json(
        {
          error:
            "Status de frequência inválido.",
        },
        {
          status: 400,
        }
      );
    }

    const adminDb =
      getAdminDb();

    const campo =
      `aula${String(
        aulaIndex + 1
      ).padStart(
        2,
        "0"
      )}`;

    const frequenciaRef =
      adminDb
        .collection(
          "frequencias"
        )
        .doc(
          alunoId
        );

    /*
     * Uma única escrita por clique.
     *
     * Exemplo:
     * frequencias/{alunoId}
     *   aula01: "P"
     *   aula02: "F"
     */
    await frequenciaRef.set(
      {
        alunoId,

        [campo]:
          status,

        atualizadoEm:
          FieldValue.serverTimestamp(),
      },
      {
        merge: true,
      }
    );

    return NextResponse.json(
      {
        ok: true,
        alunoId,
        aulaIndex,
        status,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "ERRO AO SALVAR FREQUÊNCIA:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Não foi possível salvar a frequência.",
      },
      {
        status: 500,
      }
    );
  }
}