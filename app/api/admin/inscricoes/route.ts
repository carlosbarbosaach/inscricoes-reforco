import { NextResponse } from "next/server";

import { adminDb } from "@/lib/firebase-admin";
import { isAdminAuthenticated } from "@/lib/admin-auth";

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

    const horarios =
      horariosSnapshot.docs.map(
        (doc) => ({
          id: doc.id,
          ...doc.data(),
        })
      );

    const inscricoes =
      inscricoesSnapshot.docs.map(
        (doc) => ({
          id: doc.id,
          ...doc.data(),
        })
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