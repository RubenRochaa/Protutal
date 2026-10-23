import prismaClient from "../../prisma";
import { AppError } from "../../errors/AppError";

interface ListAvaliacoesTutorRequest {
    id_tutor_sala: number;
    id_professor: number;
}

class ListAvaliacoesTutorService {
    async execute({ id_tutor_sala, id_professor }: ListAvaliacoesTutorRequest) {

        // o id do vínculo vem da URL (/tutores-sala/:id/avaliacoes) e precisa ser um inteiro positivo
        if (!Number.isInteger(id_tutor_sala) || id_tutor_sala <= 0) {
            throw new AppError("O id do tutor da sala deve ser um número inteiro", 400);
        }

        // o vínculo existe (404); select explícito: e-mail, senha e tokens do aluno nunca saem na resposta
        const tutorSala = await prismaClient.tutor_sala.findUnique({
            where: {
                id_tutor_sala: id_tutor_sala
            },
            select: {
                id_tutor_sala: true,
                data_revogacao: true,
                tutor: {
                    select: {
                        aluno: {
                            select: {
                                nome: true
                            }
                        }
                    }
                },
                sala: {
                    select: {
                        id_professor: true,
                        nome: true,
                        serie: true
                    }
                }
            }
        });

        if (!tutorSala) {
            throw new AppError("Tutor da sala não encontrado", 404);
        }

        // mesmo critério da avaliação (P9): só o professor dono da sala (403).
        // não filtramos data_revogacao: tutor revogado também tem o histórico listado
        if (tutorSala.sala.id_professor !== id_professor) {
            throw new AppError("Você não tem permissão para acessar esta sala", 403);
        }

        // total e média calculados no banco; sem avaliação, _avg.nota volta null
        const resumo = await prismaClient.avaliacao_tutor.aggregate({
            where: {
                id_tutor_sala: id_tutor_sala
            },
            _count: {
                _all: true
            },
            _avg: {
                nota: true
            }
        });

        // da mais recente para a mais antiga; o id desempata avaliações no mesmo instante
        const avaliacoes = await prismaClient.avaliacao_tutor.findMany({
            where: {
                id_tutor_sala: id_tutor_sala
            },
            select: {
                id_avaliacao: true,
                nota: true,
                comentario: true,
                data: true,
                professor: {
                    select: {
                        nome: true
                    }
                }
            },
            orderBy: [
                { data: "desc" },
                { id_avaliacao: "desc" }
            ]
        });

        // nota e média são Decimal no Prisma e iriam para o JSON como texto ("8.5"); convertemos para número
        return {
            tutor: {
                id_tutor_sala: tutorSala.id_tutor_sala,
                nome: tutorSala.tutor.aluno.nome,
                sala: {
                    nome: tutorSala.sala.nome,
                    serie: tutorSala.sala.serie
                },
                revogado: tutorSala.data_revogacao !== null,
                data_revogacao: tutorSala.data_revogacao
            },
            resumo: {
                total_avaliacoes: resumo._count._all,
                media_notas: resumo._avg.nota === null ? null : Number(resumo._avg.nota)
            },
            avaliacoes: avaliacoes.map((avaliacao) => ({
                ...avaliacao,
                nota: Number(avaliacao.nota)
            }))
        };
    }
}

export { ListAvaliacoesTutorService };
