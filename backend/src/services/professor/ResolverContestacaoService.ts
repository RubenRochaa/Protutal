import prismaClient from "../../prisma";
import { AppError } from "../../errors/AppError";
import { StatusContestacao } from "../../generated/prisma";

interface ResolverContestacaoRequest {
    id_contestacao: number;
    id_usuario: number;
    email: string;
    status?: unknown;
    decisao?: unknown;
    valor?: unknown;
}

class ResolverContestacaoService {
    async execute({ id_contestacao, id_usuario, email, status, decisao, valor }: ResolverContestacaoRequest) {

        // 1) validação do id da URL e do corpo (400), antes de qualquer consulta ao banco

        // o id vem da URL (já convertido com Number no controller): "abc" vira NaN e "1.5" não é inteiro
        if (!Number.isInteger(id_contestacao) || id_contestacao <= 0) {
            throw new AppError("O id da contestação deve ser um número inteiro", 400);
        }

        // status: os valores vêm do enum StatusContestacao do client gerado, tirando "pendente"
        // (resolver é justamente sair de pendente)
        const statusValidos = (Object.values(StatusContestacao) as string[])
            .filter((valorStatus) => valorStatus !== StatusContestacao.pendente);

        if (typeof status !== "string" || !statusValidos.includes(status)) {
            throw new AppError(`O status deve ser ${statusValidos.join(" ou ")}`, 400);
        }

        // decisao é obrigatória: é o parecer que o aluno vai ler no histórico (A9)
        if (typeof decisao !== "string" || decisao.trim() === "") {
            throw new AppError("O campo decisao é obrigatório", 400);
        }

        if (status === StatusContestacao.aceita) {
            // aceita: valor é a nova nota e precisa ser número de verdade no JSON (não texto)
            if (typeof valor !== "number" || !Number.isFinite(valor)) {
                throw new AppError("O campo valor é obrigatório quando a contestação é aceita e deve ser um número", 400);
            }

            // o banco também tem um CHECK de 0 a 10
            if (valor < 0 || valor > 10) {
                throw new AppError("O valor deve estar entre 0 e 10", 400);
            }

            // a coluna é Decimal(4,2): com mais casas o banco arredondaria sem avisar
            if (Number(valor.toFixed(2)) !== valor) {
                throw new AppError("O valor deve ter no máximo 2 casas decimais", 400);
            }
        } else if (valor !== undefined) {
            // recusada: a nota fica como está, então valor não pode vir (nem null)
            throw new AppError("O campo valor só pode ser enviado quando a contestação é aceita", 400);
        }

        // 2) a contestação existe (404). já traz o caminho até a sala e o tutor para conferir a permissão
        const contestacao = await prismaClient.contestacao_nota.findUnique({
            where: {
                id_contestacao: id_contestacao
            },
            select: {
                status: true,
                id_nota: true,
                nota: {
                    select: {
                        atividade: {
                            select: {
                                tutor_sala: {
                                    select: {
                                        data_revogacao: true,
                                        sala: {
                                            select: {
                                                id_professor: true
                                            }
                                        },
                                        tutor: {
                                            select: {
                                                aluno: {
                                                    select: {
                                                        id_aluno: true,
                                                        email: true
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
            }
        });

        if (!contestacao) {
            throw new AppError("Contestação não encontrada", 404);
        }

        // 3) permissão (403): os mesmos usuários que veem a contestação na P16.
        // a rota usa só o isAuthenticated (atende professor e tutor), então a conferência é feita aqui;
        // sem email no token não dá para conferir o par id + email
        if (!email) {
            throw new AppError("Você não tem permissão para resolver esta contestação", 403);
        }

        const { tutor_sala } = contestacao.nota.atividade;

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

        // professor: só o dono da sala da atividade
        const ehProfessorDono = professor !== null && tutor_sala.sala.id_professor === professor.id_professor;

        // tutor: só quem criou a atividade, com o vínculo Tutor_sala ativo (o revogado não resolve mais)
        const ehTutorCriadorAtivo =
            professor === null &&
            tutor_sala.data_revogacao === null &&
            tutor_sala.tutor.aluno.id_aluno === id_usuario &&
            tutor_sala.tutor.aluno.email === email;

        if (!ehProfessorDono && !ehTutorCriadorAtivo) {
            throw new AppError("Você não tem permissão para resolver esta contestação", 403);
        }

        // 4) só a contestação pendente pode ser resolvida (409)
        if (contestacao.status !== StatusContestacao.pendente) {
            throw new AppError("Esta contestação já foi resolvida", 409);
        }

        // 5) contestação e nota numa transação: ou salva tudo, ou nada.
        // o updateMany com status pendente no where evita que duas resoluções ao mesmo tempo passem:
        // a segunda não encontra mais a contestação pendente e cai no 409 (o throw desfaz a transação).
        // a notificação ao aluno (UC06 passo 03) fica de fora: não existe tabela de notificação
        const resultado = await prismaClient.$transaction(async (tx) => {
            const atualizacao = await tx.contestacao_nota.updateMany({
                where: {
                    id_contestacao: id_contestacao,
                    status: StatusContestacao.pendente
                },
                data: {
                    status: status as StatusContestacao,
                    decisao: decisao.trim(),
                    data_resolucao: new Date()
                }
            });

            if (atualizacao.count === 0) {
                throw new AppError("Esta contestação já foi resolvida", 409);
            }

            // aceita: a nota é sobrescrita com o novo valor (não existe campo de valor anterior)
            if (status === StatusContestacao.aceita) {
                await tx.nota.update({
                    where: {
                        id_nota: contestacao.id_nota
                    },
                    data: {
                        valor: valor as number
                    }
                });
            }

            return tx.contestacao_nota.findUniqueOrThrow({
                where: {
                    id_contestacao: id_contestacao
                },
                select: {
                    id_contestacao: true,
                    status: true,
                    decisao: true,
                    data_resolucao: true,
                    nota: {
                        select: {
                            id_nota: true,
                            valor: true
                        }
                    }
                }
            });
        });

        // valor é Decimal no Prisma (viria como texto no JSON), então convertemos para número
        return {
            id_contestacao: resultado.id_contestacao,
            status: resultado.status,
            decisao: resultado.decisao,
            data_resolucao: resultado.data_resolucao,
            nota: {
                id_nota: resultado.nota.id_nota,
                valor: Number(resultado.nota.valor)
            }
        };
    }
}

export { ResolverContestacaoService };
