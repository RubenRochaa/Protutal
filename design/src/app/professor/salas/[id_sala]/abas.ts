// Abas da tela de detalhe da sala. Esta é a ÚNICA lista de abas.
// São 5 abas principais; cada uma tem uma ou mais sub-abas.
// "caminho" é a sub-rota dentro de /professor/salas/[id_sala] ("" = página inicial da sala).
// NÃO mude os caminhos: o sino de notificações e outras telas linkam para eles.
export interface SubAbaSala {
    rotulo: string;
    caminho: string;
}

// Clicar na aba principal leva para a 1ª sub-aba.
// A linha de sub-abas só aparece quando o grupo tem mais de uma.
export interface GrupoAbaSala {
    rotulo: string;
    subabas: SubAbaSala[];
}

export const GRUPOS_ABAS_SALA: GrupoAbaSala[] = [
    {
        rotulo: "Visão geral",
        subabas: [{ rotulo: "Visão geral", caminho: "" }],
    },
    {
        rotulo: "Turma",
        subabas: [
            { rotulo: "Alunos", caminho: "alunos" },
            { rotulo: "Conteúdos", caminho: "conteudos" },
            { rotulo: "Avisos", caminho: "avisos" },
        ],
    },
    {
        rotulo: "Tutoria",
        subabas: [
            { rotulo: "Pedidos", caminho: "pedidos" },
            { rotulo: "Tutores", caminho: "tutores" },
            { rotulo: "Tutorias", caminho: "tutorias" },
            { rotulo: "Feedbacks", caminho: "feedbacks" },
        ],
    },
    {
        rotulo: "Atividades",
        subabas: [
            { rotulo: "Atividades", caminho: "atividades" },
            { rotulo: "Materiais", caminho: "materiais" },
            { rotulo: "Notas", caminho: "notas" },
            { rotulo: "Contestações", caminho: "contestacoes" },
        ],
    },
    {
        rotulo: "Desempenho",
        subabas: [{ rotulo: "Desempenho", caminho: "desempenho" }],
    },
]
