// Abas da tela de detalhe da sala. Esta é a ÚNICA lista de abas:
// para liberar uma aba nova, crie a pasta com a page.tsx e troque "disponivel" para true.
// "caminho" é a sub-rota dentro de /professor/salas/[id_sala] ("" = página inicial da sala).
export interface AbaSala {
    rotulo: string;
    caminho: string;
    disponivel: boolean;
    // Lote em que a aba será feita (só para o grupo se organizar)
    lote: string;
}

export const ABAS_SALA: AbaSala[] = [
    { rotulo: "Resumo", caminho: "", disponivel: true, lote: "A1" },
    { rotulo: "Alunos", caminho: "alunos", disponivel: false, lote: "A1" },
    { rotulo: "Conteúdos", caminho: "conteudos", disponivel: false, lote: "A2" },
    { rotulo: "Avisos", caminho: "avisos", disponivel: false, lote: "A2" },
    { rotulo: "Pedidos", caminho: "pedidos", disponivel: false, lote: "A3" },
    { rotulo: "Tutores", caminho: "tutores", disponivel: false, lote: "A3" },
    { rotulo: "Tutorias", caminho: "tutorias", disponivel: false, lote: "A4" },
    { rotulo: "Atividades", caminho: "atividades", disponivel: false, lote: "A5" },
    { rotulo: "Notas", caminho: "notas", disponivel: false, lote: "A5" },
    { rotulo: "Contestações", caminho: "contestacoes", disponivel: false, lote: "A5" },
    { rotulo: "Feedbacks", caminho: "feedbacks", disponivel: false, lote: "A5" },
    { rotulo: "Desempenho", caminho: "desempenho", disponivel: false, lote: "A6" },
]
