import { NextResponse } from "next/server";
import { adminCookieName, createAdminToken } from "@/lib/admin-auth";
export async function POST(req:Request){const {senha}=await req.json();if(!process.env.ADMIN_PASSWORD||senha!==process.env.ADMIN_PASSWORD)return NextResponse.json({error:"Senha incorreta."},{status:401});const r=NextResponse.json({ok:true});r.cookies.set(adminCookieName(),createAdminToken(),{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",maxAge:60*60*12,path:"/"});return r;}
