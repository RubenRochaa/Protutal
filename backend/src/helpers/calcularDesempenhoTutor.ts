import { calcularMedia } from "./calcularMedia";

// indicadores de desempenho de um vínculo Tutor_sala: feedback dos alunos (geral e por etapa)
// e avaliações do professor (só geral), lado a lado, sem nota única combinando os dois.
// notas dos alunos tutorados (Nota) não entram no desempenho do tutor.
// média só existe onde há nota: sem feedback/avaliação, media null e quantidade 0 (nunca média 0).
// usado no dashboard do professor (P13) e no desempenho do próprio tutor (T6)
function calcularDesempenhoTutor(feedbacks: { etapa: number; nota: number }[], notasAvaliacoes: number[]) {
    const notasFeedback = feedbacks.map((feedback) => feedback.nota);

    // sempre as 3 etapas; Avaliacao_tutor não tem etapa, então só o feedback tem por_etapa
    const por_etapa = [1, 2, 3].map((numeroEtapa) => {
        const notasEtapa = feedbacks
            .filter((feedback) => feedback.etapa === numeroEtapa)
            .map((feedback) => feedback.nota);

        return {
            etapa: numeroEtapa,
            media: calcularMedia(notasEtapa),
            quantidade: notasEtapa.length
        };
    });

    return {
        feedback: {
            media_geral: calcularMedia(notasFeedback),
            quantidade: notasFeedback.length,
            por_etapa
        },
        avaliacoes_professor: {
            media_geral: calcularMedia(notasAvaliacoes),
            quantidade: notasAvaliacoes.length
        }
    };
}

export { calcularDesempenhoTutor };
