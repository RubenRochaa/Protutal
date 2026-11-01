import prismaClient from "../../prisma";
import { AppError } from "../../errors/AppError";
import { Prisma } from "../../generated/prisma";
import { parseIdOpcional } from "../../helpers/parseIdOpcional";

interface ListFeedbacksRequest {
    id_usuario: number;
    email: string;
    etapa?: string;
    ano?: string;
    id_aluno?: string;
    id_sala?: string;
    id_tutor_sala?: string;
}

class ListFeedbacksService {
    async execute({ id_usuario, email, etapa, ano, id_aluno, id_sala, id_tutor_sala }: ListFeedbacksRequest) {

        // filtros opcionais da query string: se vierem, precisam ser válidos
        // (conferidos antes da permissão, como na rota de contestações)
        let etapaFiltro: number | undefined;

        if (etapa !== undefined) {
            etapaFiltro = Number(etapa);

            if (![1, 2, 3].includes(etapaFiltro)) {
                throw new AppError("A etapa deve ser 1, 2 ou 3", 400);
            }
        }

        const anoFiltro = parseIdOpcional(ano, "O ano deve ser um número inteiro");
        const idAlunoFiltro = parseIdOpcional(id_aluno, "O id do aluno deve ser um número inteiro");
        const idSalaFiltro = parseIdOpcional(id_sala, "O id da sala deve ser um número inteiro");
        const idTutorSalaFiltro = parseIdOpcional(id_tutor_sala, "O id do tutor da sala deve ser um número inteiro");

        // a rota usa só o isAuthenticated (atende professor e tutor), então a permissão é conferida aqui,
        // como na rota de contestações. sem email no token não dá para conferir (e o Prisma ignoraria o filtro email: undefined)
        if (!email) {
            throw new AppError("Você não tem permissão para listar feedbacks", 403);
        }

        // Professor e Aluno são tabelas separadas e os ids podem se repetir,
        // então sempre conferimos o par id + email (mesmo critério do isProfessor/isAluno)
        const professor = await prismaClient.professor.findFirst({
            where: {
                id_professor: id_usuario,
                email: email
            },
            select: {
                id_professor: true
            }
        });

        // caminho até o vínculo do tutor: Feedback -> Tutoria -> Tutor_sala
        let filtroTutorSala: Prisma.Tutor_salaWhereInput;

        if (professor) {
            // professor: tutorias das salas em que ele é o dono. ?id_sala= e ?id_tutor_sala= só restringem
            // dentro disso: id de outro professor volta lista vazia (como o ?id_sala= das contestações)
            filtroTutorSala = {
                id_sala: idSalaFiltro,
                id_tutor_sala: idTutorSalaFiltro,
                sala: {
                    id_professor: professor.id_professor
                }
            };
        } else {
            // aluno sem nenhum vínculo de tutor ativo não pode listar (mesmo critério do isTutor)
            const vinculosAtivos = await prismaClient.tutor_sala.count({
                where: {
                    data_revogacao: null,
                    tutor: {
                        aluno: {
                            id_aluno: id_usuario,
                            email: email
                        }
                    }
                }
            });

            if (vinculosAtivos === 0) {
                throw new AppError("Você não tem permissão para listar feedbacks", 403);
            }

            // tutor: feedbacks de todos os vínculos dele, inclusive revogados e de anos anteriores,
            // porque foram recebidos por ele (por isso aqui não filtramos data_revogacao).
            // ?id_sala= e ?id_tutor_sala= são só do professor e ficam de fora
            filtroTutorSala = {
                tutor: {
                    aluno: {
                        id_aluno: id_usuario,
                        email: email
                    }
                }
            };
        }

        // o mesmo where serve para o resumo e para a lista, então os dois respeitam os filtros;
        // sem filtro, etapa, id_aluno e ano_letivo ficam undefined e o Prisma ignora os campos
        const where: Prisma.FeedbackWhereInput = {
            etapa: etapaFiltro,
            tutoria: {
                id_aluno: idAlunoFiltro,
                tutor_sala: {
                    AND: [
                        filtroTutorSala,
                        { sala: { ano_letivo: anoFiltro } }
                    ]
                }
            }
        };

        // total e média calculados no banco (como na P10); sem feedback, _avg.nota volta null
        const resumo = await prismaClient.feedback.aggregate({
            where: where,
            _count: {
                _all: true
            },
            _avg: {
                nota: true
            }
        });

        // uma única consulta: tutoria, aluno, sala e tutor vêm juntos pelo select (sem N+1);
        // do aluno e do tutor sai só o nome (sem email, senha ou tokens);
        // sem feedbacks, volta lista vazia e isso não é erro
        const feedbacks = await prismaClient.feedback.findMany({
            where: where,
            select: {
                id_feedback: true,
                id_tutoria: true,
                etapa: true,
                nota: true,
                comentario: true,
                rubrica_file: true,
                data: true,
                tutoria: {
                    select: {
                        aluno: {
                            select: {
                                id_aluno: true,
                                nome: true
                            }
                        },
                        tutor_sala: {
                            select: {
                                id_tutor_sala: true,
                                sala: {
                                    select: {
                                        id_sala: true,
                                        nome: true,
                                        serie: true,
                                        ano_letivo: true
                                    }
                                },
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
                        }
                    }
                }
            },
            // do mais recente para o mais antigo; o id desempata feedbacks no mesmo instante
            orderBy: [
                { data: "desc" },
                { id_feedback: "desc" }
            ]
        });

        // nota e média são Decimal no Prisma e iriam para o JSON como texto ("8.5"); convertemos para número.
        // achata tutoria.tutor_sala em aluno, tutor e sala, deixando a resposta mais simples para o front
        return {
            resumo: {
                total_feedbacks: resumo._count._all,
                media_notas: resumo._avg.nota === null ? null : Number(resumo._avg.nota)
            },
            feedbacks: feedbacks.map((feedback) => {
                const { tutor_sala } = feedback.tutoria;

                return {
                    id_feedback: feedback.id_feedback,
                    id_tutoria: feedback.id_tutoria,
                    etapa: feedback.etapa,
                    nota: Number(feedback.nota),
                    comentario: feedback.comentario,
                    rubrica_file: feedback.rubrica_file,
                    data: feedback.data,
                    aluno: feedback.tutoria.aluno,
                    tutor: {
                        id_tutor_sala: tutor_sala.id_tutor_sala,
                        nome: tutor_sala.tutor.aluno.nome
                    },
                    sala: tutor_sala.sala
                };
            })
        };
    }
}

export { ListFeedbacksService };
