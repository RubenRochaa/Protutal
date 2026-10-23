import prismaClient from "../../prisma";
import { AppError } from "../../errors/AppError";
import { contarContestacoesPendentes } from "../../helpers/contarContestacoesPendentes";

interface RevogarTutorSalaRequest {
    id_tutor_sala: number;
    id_professor: number;
}

const MENSAGEM_JA_REVOGADO = "Este tutor já foi revogado nesta sala";

class RevogarTutorSalaService {
    async execute({ id_tutor_sala, id_professor }: RevogarTutorSalaRequest) {

        // o id do vínculo vem da URL (/tutores-sala/:id/revogar) e precisa ser um inteiro positivo
        if (!Number.isInteger(id_tutor_sala) || id_tutor_sala <= 0) {
            throw new AppError("O id do tutor da sala deve ser um número inteiro", 400);
        }

        // a sala do vínculo diz quem é o professor dono
        const tutorSala = await prismaClient.tutor_sala.findUnique({
            where: {
                id_tutor_sala: id_tutor_sala
            },
            select: {
                id_tutor_sala: true,
                data_revogacao: true,
                sala: {
                    select: {
                        id_professor: true
                    }
                }
            }
        });

        if (!tutorSala) {
            throw new AppError("Tutor da sala não encontrado", 404);
        }

        // mesmo critério da listagem de tutorias da sala: só o professor dono da sala
        if (tutorSala.sala.id_professor !== id_professor) {
            throw new AppError("Você não tem permissão para acessar esta sala", 403);
        }

        // a revogação só preenche data_revogacao (o registro não é apagado)
        if (tutorSala.data_revogacao !== null) {
            throw new AppError(MENSAGEM_JA_REVOGADO, 409);
        }

        // RN15: nenhuma tutoria deste vínculo pode ter contestação de nota pendente
        const pendentes = await contarContestacoesPendentes({
            id_tutor_sala: tutorSala.id_tutor_sala
        });

        if (pendentes > 0) {
            const texto = pendentes === 1
                ? "há 1 contestação de nota pendente"
                : `há ${pendentes} contestações de nota pendentes`;

            throw new AppError(`Não é possível revogar o tutor: ${texto}`, 409);
        }

        // revogar e finalizar as tutorias acontecem juntos: se um falhar, nenhum é gravado.
        // atividades, notas, materiais e pode_criar_ativ ficam como estão;
        // o histórico não passa a um novo tutor (novas tutorias são criadas em POST /tutorias)
        const resultado = await prismaClient.$transaction(async (tx) => {
            const agora = new Date();

            // o filtro data_revogacao: null evita revogar duas vezes se outra requisição
            // revogar o vínculo entre a leitura acima e este update
            const revogados = await tx.tutor_sala.updateMany({
                where: {
                    id_tutor_sala: tutorSala.id_tutor_sala,
                    data_revogacao: null
                },
                data: {
                    data_revogacao: agora
                }
            });

            if (revogados.count === 0) {
                throw new AppError(MENSAGEM_JA_REVOGADO, 409);
            }

            // mesma finalização da P6: status finalizada + data_fim
            const finalizadas = await tx.tutoria.updateMany({
                where: {
                    id_tutor_sala: tutorSala.id_tutor_sala,
                    status: "ativa"
                },
                data: {
                    status: "finalizada",
                    data_fim: agora
                }
            });

            const tutorSalaAtualizado = await tx.tutor_sala.findUnique({
                where: {
                    id_tutor_sala: tutorSala.id_tutor_sala
                },
                select: {
                    id_tutor_sala: true,
                    data_revogacao: true
                }
            });

            return {
                tutor_sala: tutorSalaAtualizado,
                tutorias_finalizadas: finalizadas.count
            };
        });

        return resultado;
    }
}

export { RevogarTutorSalaService };
