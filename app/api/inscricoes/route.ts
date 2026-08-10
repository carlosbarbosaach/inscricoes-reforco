import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

function clean(value: unknown) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ");
}

function key(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const horarioId = clean(body.horarioId);
    const nome = clean(body.nome);
    const turma = clean(body.turma);

    if (
      !horarioId ||
      nome.length < 5 ||
      !turma
    ) {
      return NextResponse.json(
        {
          error:
            "Preencha nome completo, turma e horário.",
        },
        {
          status: 400,
        }
      );
    }

    // Inicializa o Firebase Admin somente
    // quando a API realmente é chamada
    const adminDb = getAdminDb();

    const horarioRef = adminDb
      .collection("horarios")
      .doc(horarioId);

    const inscricaoId =
      `${horarioId}_${key(nome)}_${key(turma)}`;

    const inscricaoRef = adminDb
      .collection("inscricoes")
      .doc(inscricaoId);

    await adminDb.runTransaction(
      async (transaction) => {
        const [
          horarioSnapshot,
          inscricaoSnapshot,
        ] = await Promise.all([
          transaction.get(horarioRef),
          transaction.get(inscricaoRef),
        ]);

        if (!horarioSnapshot.exists) {
          throw new Error("HORARIO");
        }

        if (inscricaoSnapshot.exists) {
          throw new Error("DUP");
        }

        const horario =
          horarioSnapshot.data();

        if (!horario) {
          throw new Error("HORARIO");
        }

        if (!horario.ativo) {
          throw new Error("FECHADO");
        }

        const inscritos =
          Number(horario.inscritos || 0);

        const limite =
          Number(horario.limite || 0);

        if (inscritos >= limite) {
          throw new Error("LOTADO");
        }

        transaction.set(
          inscricaoRef,
          {
            horarioId,
            nome,
            turma,
            criadoEm:
              FieldValue.serverTimestamp(),
          }
        );

        transaction.update(
          horarioRef,
          {
            inscritos:
              FieldValue.increment(1),
          }
        );
      }
    );

    return NextResponse.json(
      {
        message:
          "Inscrição realizada com sucesso!",
      },
      {
        status: 201,
      }
    );
  } catch (error: unknown) {
    console.error(
      "ERRO AO REALIZAR INSCRIÇÃO:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "";

    const erros: Record<
      string,
      {
        mensagem: string;
        status: number;
      }
    > = {
      DUP: {
        mensagem:
          "Este aluno já está inscrito neste horário.",
        status: 409,
      },

      LOTADO: {
        mensagem:
          "As vagas deste horário acabaram.",
        status: 409,
      },

      FECHADO: {
        mensagem:
          "As inscrições deste horário estão fechadas.",
        status: 409,
      },

      HORARIO: {
        mensagem:
          "Horário inválido.",
        status: 400,
      },
    };

    const resposta = erros[message];

    if (resposta) {
      return NextResponse.json(
        {
          error: resposta.mensagem,
        },
        {
          status: resposta.status,
        }
      );
    }

    return NextResponse.json(
      {
        error:
          "Não foi possível realizar a inscrição.",
      },
      {
        status: 500,
      }
    );
  }
}