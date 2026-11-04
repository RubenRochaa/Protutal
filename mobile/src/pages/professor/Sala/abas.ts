// Abas da tela da sala: mesma lista de design/src/app/professor/salas/[id_sala]/abas.ts.
// São 5 abas principais; cada uma tem uma ou mais sub-abas.
// Tocar na aba principal abre a 1ª sub-aba. A linha de sub-abas só aparece quando o grupo tem mais de uma
export type GrupoSala = "visao_geral" | "turma" | "tutoria" | "atividades" | "desempenho";

export type SubAbaSala =
    | "visao_geral"
    | "alunos" | "conteudos" | "avisos"
    | "pedidos" | "tutores" | "tutorias" | "feedbacks"
    | "atividades" | "materiais" | "notas" | "contestacoes"
    | "desempenho";

export interface GrupoAbaSala {
    valor: GrupoSala;
    rotulo: string;
    subabas: { valor: SubAbaSala; rotulo: string }[];
}

export const GRUPOS_ABAS_SALA: GrupoAbaSala[] = [
    {
        valor: "visao_geral",
        rotulo: "Visão geral",
        subabas: [{ valor: "visao_geral", rotulo: "Visão geral" }],
    },
    {
        valor: "turma",
        rotulo: "Turma",
        subabas: [
            { valor: "alunos", rotulo: "Alunos" },
            { valor: "conteudos", rotulo: "Conteúdos" },
            { valor: "avisos", rotulo: "Avisos" },
        ],
    },
    {
        valor: "tutoria",
        rotulo: "Tutoria",
        subabas: [
            { valor: "pedidos", rotulo: "Pedidos" },
            { valor: "tutores", rotulo: "Tutores" },
            { valor: "tutorias", rotulo: "Tutorias" },
            { valor: "feedbacks", rotulo: "Feedbacks" },
        ],
    },
    {
        valor: "atividades",
        rotulo: "Atividades",
        subabas: [
            { valor: "atividades", rotulo: "Atividades" },
            { valor: "materiais", rotulo: "Materiais" },
            { valor: "notas", rotulo: "Notas" },
            { valor: "contestacoes", rotulo: "Contestações" },
        ],
    },
    {
        valor: "desempenho",
        rotulo: "Desempenho",
        subabas: [{ valor: "desempenho", rotulo: "Desempenho" }],
    },
]

// Grupo (aba principal) de uma sub-aba
export function grupoDa(subaba: SubAbaSala): GrupoAbaSala {
    return GRUPOS_ABAS_SALA.find((grupo) => grupo.subabas.some((sub) => sub.valor === subaba)) ?? GRUPOS_ABAS_SALA[0];
}
