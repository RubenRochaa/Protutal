import prismaClient from "../../prisma";
import { AppError } from "../../errors/AppError";
import { Prisma, StatusContestacao } from "../../generated/prisma";

interface ListContestacoesRequest {
    id_usuario: number;
    email: string;
    status?: string;
    id_sala?: string;
}

class ListContestacoesService {
    async execute({ id_usuario, email, status, id_sala }: ListContestacoesRequest) {

        // ?status= é opcional, mas se vier precisa ser um dos valores do enum StatusContestacao
        // (a lista vem do client gerado pelo Prisma, então acompanha o schema)
        const statusValidos = Object.values(StatusContestacao) as string[];

        if (status !== undefined && !statusValidos.includes(status)) {
            throw new AppError(`O status deve ser ${statusValidos.join(" ou ")}`, 400);
        }

        // ?id_sala= é opcional, mas se vier precisa ser inteiro positivo
        const idSala = id_sala === undefined ? undefined : Number(id_sala);

        if (idSala !== undefined && (!Number.isInteger(idSala) || idSala <= 0)) {
            throw new AppError("O id da sala deve ser um número inteiro", 400);
        }

        // a rota usa só o isAuthenticated (atende professor e tutor), então a permissão é conferida aqui,
        // como na A5. sem email no token não dá para conferir (e o Prisma ignoraria o filtro email: undefined)
        if (!email) {
            throw new AppError("Você não tem permissão para listar contestações", 403);
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

        // caminho até o vínculo do tutor: Contestacao_nota -> Nota -> Atividade -> Tutor_sala
        let filtroTutorSala: Prisma.Tutor_salaWhereInput;

        if (professor) {
            // professor: atividades das salas em que ele é o dono
            filtroTutorSala = {
                sala: {
                    id_professor: professor.id_professor
                }
            };
        } else {
            // tutor: atividades que ele criou, só nos vínculos Tutor_sala ativos (o revogado não vê mais)
            filtroTutorSala = {
                data_revogacao: null,
                tutor: {
                    aluno: {
                        id_aluno: id_usuario,
                        email: email
                    }
                }
            };

            // aluno sem nenhum vínculo de tutor ativo (inclui o tutor revogado) não pode listar
            const vinculosAtivos = await prismaClient.tutor_sala.count({
                where: filtroTutorSala
            });

            if (vinculosAtivos === 0) {
                throw new AppError("Você não tem permissão para listar contestações", 403);
            }
        }

        // uma única consulta: nota, aluno, atividade, conteúdo, sala e tutor vêm juntos pelo select (sem N+1);
        // o ?id_sala= entra no AND, então só restringe dentro do que o usuário já pode ver;
        // sem filtro, status e id_sala ficam undefined e o Prisma ignora os campos;
        // do aluno e do tutor sai só o nome (sem email, senha ou tokens);
        // sem contestações, volta lista vazia e isso não é erro
        const contestacoes = await prismaClient.contestacao_nota.findMany({
            where: {
                status: status as StatusContestacao | undefined,
                nota: {
                    atividade: {
                        tutor_sala: {
                            AND: [
                                filtroTutorSala,
                                { id_sala: idSala }
                            ]
                        }
                    }
                }
            },
            select: {
                id_contestacao: true,
                comentario: true,
                status: true,
                data_envio: true,
                decisao: true,
                data_resolucao: true,
                nota: {
                    select: {
                        id_nota: true,
                        valor: true,
                        aluno: {
                            select: {
                                id_aluno: true,
                                nome: true
                            }
                        },
                        atividade: {
                            select: {
                                id_atividade: true,
                                titulo: true,
                                etapa: true,
                                conteudo: {
                                    select: {
                                        nome: true
                                    }
                                },
                                tutor_sala: {
                                    select: {
                                        id_tutor_sala: true,
                                        sala: {
                                            select: {
                                                id_sala: true,
                                                nome: true
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
                    }
                }
            },
            // da mais recente para a mais antiga
            orderBy: {
                data_envio: "desc"
            }
        });

        // achata nota.atividade.tutor_sala em atividade, sala e tutor, deixando a resposta mais simples para o front.
        // valor é Decimal no Prisma (viria como texto no JSON), então convertemos para número
        return contestacoes.map((contestacao) => {
            const { atividade } = contestacao.nota;

            return {
                id_contestacao: contestacao.id_contestacao,
                comentario: contestacao.comentario,
                status: contestacao.status,
                data_envio: contestacao.data_envio,
                decisao: contestacao.decisao,
                data_resolucao: contestacao.data_resolucao,
                nota: {
                    id_nota: contestacao.nota.id_nota,
                    valor: Number(contestacao.nota.valor)
                },
                aluno: contestacao.nota.aluno,
                atividade: {
                    id_atividade: atividade.id_atividade,
                    titulo: atividade.titulo,
                    etapa: atividade.etapa,
                    conteudo: atividade.conteudo
                },
                sala: atividade.tutor_sala.sala,
                tutor: {
                    id_tutor_sala: atividade.tutor_sala.id_tutor_sala,
                    nome: atividade.tutor_sala.tutor.aluno.nome
                }
            };
        });
    }
}

export { ListContestacoesService };
