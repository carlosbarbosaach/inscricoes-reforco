import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

function clean(v:unknown){return String(v||"").trim().replace(/\s+/g," ")}
function key(v:string){return v.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]/g,"")}

export async function POST(req:Request){
 try{const body=await req.json();const horarioId=clean(body.horarioId);const nome=clean(body.nome);const turma=clean(body.turma);if(!horarioId||nome.length<5||!turma)return NextResponse.json({error:"Preencha nome completo, turma e horário."},{status:400});
 const href=adminDb.collection("horarios").doc(horarioId);const dupId=`${horarioId}_${key(nome)}_${key(turma)}`;const iref=adminDb.collection("inscricoes").doc(dupId);
 await adminDb.runTransaction(async tx=>{const [hs,is]=await Promise.all([tx.get(href),tx.get(iref)]);if(!hs.exists)throw new Error("HORARIO");if(is.exists)throw new Error("DUP");const h=hs.data()!;if(!h.ativo)throw new Error("FECHADO");if((h.inscritos||0)>=(h.limite||0))throw new Error("LOTADO");tx.set(iref,{horarioId,nome,turma,criadoEm:FieldValue.serverTimestamp()});tx.update(href,{inscritos:FieldValue.increment(1)});});
 return NextResponse.json({message:"Inscrição realizada com sucesso!"});
 }catch(e:any){const m=e?.message;const map:any={DUP:["Este aluno já está inscrito neste horário.",409],LOTADO:["As vagas deste horário acabaram.",409],FECHADO:["As inscrições deste horário estão fechadas.",409],HORARIO:["Horário inválido.",400]};const x=map[m]||["Não foi possível realizar a inscrição.",500];return NextResponse.json({error:x[0]},{status:x[1]});}
}
