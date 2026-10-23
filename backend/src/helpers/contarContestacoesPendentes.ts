import prismaClient from "../prisma";

// RN15: conta as contestações de nota pendentes pelo caminho
// Contestacao_nota -> Nota (do aluno tutorado) -> Atividade (criada pelo Tutor_sala).
// usado na finalização da tutoria (P6) e na revogação do tutor da sala (P8).
interface ContestacoesPendentesRequest {
    id_tutor_sala: number;
    id_aluno?: number; // se vier, conta só as do aluno tutorado (uma tutoria); sem ele, todas do vínculo
}

async function contarContestacoesPendentes({ id_tutor_sala, id_aluno }: ContestacoesPendentesRequest) {
    // com id_aluno undefined o Prisma ignora o filtro e conta as pendentes
    // de todas as tutorias deste Tutor_sala
    return prismaClient.contestacao_nota.count({
        where: {
            status: "pendente",
            nota: {
                id_aluno: id_aluno,
                atividade: {
                    id_tutor_sala: id_tutor_sala
                }
            }
        }
    });
}

export { contarContestacoesPendentes };
