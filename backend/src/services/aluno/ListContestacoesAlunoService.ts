import prismaClient from "../../prisma";
import { AppError } from "../../errors/AppError";
import { StatusContestacao } from "../../generated/prisma";

interface ListContestacoesAlunoRequest {
    id_aluno: number;
    status?: string;
}

class ListContestacoesAlunoService {
    async execute({ id_aluno, status }: ListContestacoesAlunoRequest) {

        // ?status= é opcional, mas se vier precisa ser um dos valores do enum StatusContestacao
        // (a lista vem do client gerado pelo Prisma, então acompanha o schema)
        const statusValidos = Object.values(StatusContestacao) as string[];

        if (status !== undefined && !statusValidos.includes(status)) {
            throw new AppError(`O status deve ser ${statusValidos.join(" ou ")}`, 400);
        }

        // contestações das notas do aluno logado (Contestacao_nota -> Nota.id_aluno).
        // não filtra pelo status da tutoria: o histórico continua disponível
        // depois que a tutoria é finalizada (UC06, passo 4; RN14);
        // sem filtro, status fica undefined e o Prisma ignora o campo (traz todas);
        // uma única consulta: nota, atividade, conteúdo e tutor vêm juntos pelo select (sem N+1);
        // do tutor sai só o nome (sem email, senha ou tokens);
        // se o aluno não tiver contestações, volta lista vazia e isso não é erro
        const contestacoes = await prismaClient.contestacao_nota.findMany({
            where: {
                status: status as StatusContestacao | undefined,
                nota: {
                    id_aluno: id_aluno
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

        // achata nota.atividade para atividade e o tutor_sala.tutor.aluno para tutor,
        // deixando a resposta mais simples para o front.
        // valor é Decimal no Prisma (viria como texto no JSON), então convertemos para número
        return contestacoes.map((contestacao) => ({
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
            atividade: {
                id_atividade: contestacao.nota.atividade.id_atividade,
                titulo: contestacao.nota.atividade.titulo,
                etapa: contestacao.nota.atividade.etapa,
                conteudo: contestacao.nota.atividade.conteudo
            },
            tutor: {
                nome: contestacao.nota.atividade.tutor_sala.tutor.aluno.nome
            }
        }));
    }
}

export { ListContestacoesAlunoService };
