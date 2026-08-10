import { NextResponse } from "next/server";import { adminCookieName } from "@/lib/admin-auth";
export async function POST(){const r=NextResponse.json({ok:true});r.cookies.set(adminCookieName(),"",{maxAge:0,path:"/"});return r}
