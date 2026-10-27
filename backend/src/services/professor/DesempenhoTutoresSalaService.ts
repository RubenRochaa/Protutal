import prismaClient from "../../prisma";
import { AppError } from "../../errors/AppError";
import { calcularMedia } from "../../helpers/calcularMedia";

interface DesempenhoTutoresSalaRequest {
    id_sala: number;
    id_professor: number;
}

// dashboard de desempenho dos tutores da sala (RF13 / UC15): dois indicadores lado a lado,
// feedback dos alunos (com média por etapa) e avaliações do professor, sem nota única combinando os dois.
// só os números: as listas ficam em GET /feedbacks e GET /tutores-sala/:id/avaliacoes
class DesempenhoTutoresSalaService {
    async execute({ id_sala, id_professor }: DesempenhoTutoresSalaRequest) {

        // o id da sala vem da URL (/salas/:id/desempenho-tutores) e precisa ser um inteiro positivo
        if (!Number.isInteger(id_sala) || id_sala <= 0) {
            throw new AppError("O id da sala deve ser um número inteiro", 400);
        }

        const sala = await prismaClient.sala.findUnique({
            where: {
                id_sala: id_sala
            },
            select: {
                id_sala: true,
                id_professor: true
            }
        });

        if (!sala) {
            throw new AppError("Sala não encontrada", 404);
        }

        // mesmo critério da P11/P14: só o professor dono da sala
        if (sala.id_professor !== id_professor) {
            throw new AppError("Você não tem permissão para acessar esta sala", 403);
        }

        // todos os vínculos de tutor da sala, inclusive os revogados (o histórico continua valendo);
        // do aluno sai só o nome (sem email, senha ou tokens)
        const tutores = await prismaClient.tutor_sala.findMany({
            where: {
                id_sala: id_sala
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
                }
            }
        });

        // sala sem tutores: lista vazia, não é erro
        if (tutores.length === 0) {
            return [];
        }

        // sem N+1: uma consulta para os feedbacks e outra para as avaliações de todos os tutores da sala,
        // agrupados depois em memória pelo id_tutor_sala.
        // caminho do feedback até o vínculo: Feedback -> Tutoria -> Tutor_sala.
        // notas dos alunos tutorados (Nota) não entram no desempenho do tutor
        const feedbacks = await prismaClient.feedback.findMany({
            where: {
                tutoria: {
                    tutor_sala: {
                        id_sala: id_sala
                    }
                }
            },
            select: {
                etapa: true,
                nota: true,
                tutoria: {
                    select: {
                        id_tutor_sala: true
                    }
                }
            }
        });

        const avaliacoes = await prismaClient.avaliacao_tutor.findMany({
            where: {
                tutor_sala: {
                    id_sala: id_sala
                }
            },
            select: {
                id_tutor_sala: true,
                nota: true
            }
        });

        // nota é Decimal no Prisma (viria como texto no JSON), então convertemos para número
        const feedbacksPorTutor = new Map<number, { etapa: number; nota: number }[]>();

        for (const feedback of feedbacks) {
            const id_tutor_sala = feedback.tutoria.id_tutor_sala;
            const grupo = feedbacksPorTutor.get(id_tutor_sala) ?? [];

            grupo.push({ etapa: feedback.etapa, nota: Number(feedback.nota) });
            feedbacksPorTutor.set(id_tutor_sala, grupo);
        }

        const avaliacoesPorTutor = new Map<number, number[]>();

        for (const avaliacao of avaliacoes) {
            const grupo = avaliacoesPorTutor.get(avaliacao.id_tutor_sala) ?? [];

            grupo.push(Number(avaliacao.nota));
            avaliacoesPorTutor.set(avaliacao.id_tutor_sala, grupo);
        }

        // média só existe onde há nota: sem feedback/avaliação, media null e quantidade 0 (nunca média 0)
        const desempenho = tutores.map((tutorSala) => {
            const feedbacksTutor = feedbacksPorTutor.get(tutorSala.id_tutor_sala) ?? [];
            const notasAvaliacoes = avaliacoesPorTutor.get(tutorSala.id_tutor_sala) ?? [];
            const notasFeedback = feedbacksTutor.map((feedback) => feedback.nota);

            // sempre as 3 etapas; Avaliacao_tutor não tem etapa, então só o feedback tem por_etapa
            const por_etapa = [1, 2, 3].map((numeroEtapa) => {
                const notasEtapa = feedbacksTutor
                    .filter((feedback) => feedback.etapa === numeroEtapa)
                    .map((feedback) => feedback.nota);

                return {
                    etapa: numeroEtapa,
                    media: calcularMedia(notasEtapa),
                    quantidade: notasEtapa.length
                };
            });

            return {
                id_tutor_sala: tutorSala.id_tutor_sala,
                nome: tutorSala.tutor.aluno.nome,
                revogado: tutorSala.data_revogacao !== null,
                data_revogacao: tutorSala.data_revogacao,
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
        });

        // ativos primeiro, depois por nome
        return desempenho.sort((a, b) =>
            Number(a.revogado) - Number(b.revogado) || a.nome.localeCompare(b.nome, "pt-BR")
        );
    }
}

export { DesempenhoTutoresSalaService };
