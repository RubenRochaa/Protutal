import prismaClient from "../../prisma";
import { AppError } from "../../errors/AppError";

interface FinalizarTutoriaRequest {
    id_tutoria: number;
    id_professor: number;
}

const MENSAGEM_JA_FINALIZADA = "Esta tutoria já está finalizada";

class FinalizarTutoriaService {
    async execute({ id_tutoria, id_professor }: FinalizarTutoriaRequest) {

        // o id da tutoria vem da URL (/tutorias/:id/finalizar) e precisa ser um inteiro positivo
        if (!Number.isInteger(id_tutoria) || id_tutoria <= 0) {
            throw new AppError("O id da tutoria deve ser um número inteiro", 400);
        }

        // a sala da tutoria é descoberta pelo caminho Tutoria -> Tutor_sala -> Sala;
        // id_aluno e id_tutor_sala são usados depois para achar as contestações pendentes
        const tutoria = await prismaClient.tutoria.findUnique({
            where: {
                id_tutoria: id_tutoria
            },
            select: {
                id_tutoria: true,
                status: true,
                id_aluno: true,
                id_tutor_sala: true,
                tutor_sala: {
                    select: {
                        sala: {
                            select: {
                                id_professor: true
                            }
                        }
                    }
                }
            }
        });

        if (!tutoria) {
            throw new AppError("Tutoria não encontrada", 404);
        }

        // mesmo critério da listagem de tutorias da sala: só o professor dono da sala
        if (tutoria.tutor_sala.sala.id_professor !== id_professor) {
            throw new AppError("Você não tem permissão para acessar esta sala", 403);
        }

        if (tutoria.status !== "ativa") {
            throw new AppError(MENSAGEM_JA_FINALIZADA, 409);
        }

        // RN15: contestações pendentes desta tutoria, pelo caminho
        // Contestacao_nota -> Nota (do aluno tutorado) -> Atividade (criada pelo mesmo Tutor_sala da tutoria)
        const pendentes = await prismaClient.contestacao_nota.count({
            where: {
                status: "pendente",
                nota: {
                    id_aluno: tutoria.id_aluno,
                    atividade: {
                        id_tutor_sala: tutoria.id_tutor_sala
                    }
                }
            }
        });

        if (pendentes > 0) {
            const texto = pendentes === 1
                ? "há 1 contestação de nota pendente"
                : `há ${pendentes} contestações de nota pendentes`;

            throw new AppError(`Não é possível finalizar a tutoria: ${texto}`, 409);
        }

        // o filtro status: "ativa" evita finalizar duas vezes se outra requisição
        // finalizar a tutoria entre a leitura acima e este update
        const atualizadas = await prismaClient.tutoria.updateMany({
            where: {
                id_tutoria: tutoria.id_tutoria,
                status: "ativa"
            },
            data: {
                status: "finalizada",
                data_fim: new Date()
            }
        });

        if (atualizadas.count === 0) {
            throw new AppError(MENSAGEM_JA_FINALIZADA, 409);
        }

        const tutoriaAtualizada = await prismaClient.tutoria.findUnique({
            where: {
                id_tutoria: tutoria.id_tutoria
            },
            select: {
                id_tutoria: true,
                status: true,
                data_fim: true
            }
        });

        return tutoriaAtualizada;
    }
}

export { FinalizarTutoriaService };
