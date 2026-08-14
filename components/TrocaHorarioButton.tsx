"use client";

import {
    ArrowRightLeft,
    Loader2,
} from "lucide-react";

type Aluno = {
    id: string;
    nome: string;
    turma: string;
    horarioId: string;
};

type Horario = {
    id: string;
    dia: string;
    horario: string;
    limite: number;
    inscritos: number;
};

type Props = {
    aluno: Aluno;
    horarios: Horario[];

    posicaoFila?: number | null;

    horarioDesejadoId?: string | null;

    carregando?: boolean;

    onSolicitarTroca: (
        aluno: Aluno,
        destino: Horario
    ) => void;
};

export default function TrocaHorarioButton({
    aluno,
    horarios,
    posicaoFila = null,
    horarioDesejadoId = null,
    carregando = false,
    onSolicitarTroca,
}: Props) {
    const destino =
        horarios.find(
            (horario) =>
                horario.id !==
                aluno.horarioId
        );

    const horarioDesejado =
        horarios.find(
            (horario) =>
                horario.id ===
                horarioDesejadoId
        );

    const aguardando =
        posicaoFila !== null &&
        horarioDesejadoId !== null;

    if (!destino) {
        return null;
    }

    if (aguardando) {
        return (
            <div className="flex flex-col items-center gap-1">

                <button
                    type="button"
                    disabled
                    className="inline-flex min-w-[150px] items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700"
                >
                    <ArrowRightLeft
                        size={15}
                    />

                    Aguardando{" "}
                    {horarioDesejado?.dia ||
                        "troca"}
                </button>

                <span className="text-[10px] font-semibold text-amber-600">
                    {posicaoFila}º na fila
                </span>

            </div>
        );
    }

    return (
        <button
            type="button"
            disabled={carregando}
            onClick={() =>
                onSolicitarTroca(
                    aluno,
                    destino
                )
            }
            className="inline-flex min-w-[150px] items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold text-[#073763] transition hover:border-[#073763] hover:bg-[#073763] hover:text-white disabled:cursor-wait disabled:opacity-60"
        >
            {carregando ? (
                <>
                    <Loader2
                        size={15}
                        className="animate-spin"
                    />

                    Salvando...
                </>
            ) : (
                <>
                    <ArrowRightLeft
                        size={15}
                    />
                    Solicitar troca
                </>
            )}
        </button>
    );
}