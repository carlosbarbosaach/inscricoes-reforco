import { NextResponse } from "next/server";

import {
  adminCookieName,
  createAdminToken,
} from "@/lib/admin-auth";

export async function POST(req: Request) {
  try {
    const { senha } = await req.json();

    const adminPassword =
      process.env.ADMIN_PASSWORD;

    const sessionSecret =
      process.env.ADMIN_SESSION_SECRET;

    if (!adminPassword) {
      return NextResponse.json(
        {
          error:
            "ADMIN_PASSWORD não configurada.",
        },
        {
          status: 500,
        }
      );
    }

    if (!sessionSecret) {
      return NextResponse.json(
        {
          error:
            "ADMIN_SESSION_SECRET não configurada.",
        },
        {
          status: 500,
        }
      );
    }

    if (senha !== adminPassword) {
      return NextResponse.json(
        {
          error: "Senha incorreta.",
        },
        {
          status: 401,
        }
      );
    }

    const response =
      NextResponse.json({
        ok: true,
      });

    response.cookies.set(
      adminCookieName(),
      createAdminToken(),
      {
        httpOnly: true,
        secure:
          process.env.NODE_ENV ===
          "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 12,
        path: "/",
      }
    );

    return response;
  } catch (error) {
    console.error(
      "ERRO LOGIN ADMIN:",
      error
    );

    return NextResponse.json(
      {
        error: "Erro ao realizar login.",
      },
      {
        status: 500,
      }
    );
  }
}