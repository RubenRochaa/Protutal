import prismaClient from "../../prisma";
import { AppError } from "../../errors/AppError";
import { calcularStatusEntrega } from "../../helpers/calcularStatusEntrega";

interface ListRespostasAtividadeRequest {
    id_atividade: number;
}

class ListRespostasAtividadeService {
    async execute({ id_atividade }: ListRespostasAtividadeRequest) {

        // a permissão (professor dono ou tutor criador ativo) e a existência da atividade
        // já foram conferidas no middleware isTutorCriadorOuProfessorAtividade;
        // a validação do id fica aqui também para o service não depender da rota
        if (!Number.isInteger(id_atividade) || id_atividade <= 0) {
            throw new AppError("O id da atividade deve ser um número inteiro", 400);
        }

        // uma única consulta traz a atividade, todos os destinatários e,
        // para cada aluno, a resposta e a nota DESTA atividade.
        // o Prisma resolve cada nível de relação com uma query em lote (WHERE ... IN (...)),
        // então o número de queries é fixo e não cresce com a quantidade de alunos (sem N+1)
        const atividade = await prismaClient.atividade.findUnique({
            where: {
                id_atividade: id_atividade
            },
            select: {
                id_atividade: true,
                titulo: true,
                tipo: true,
                data_entrega: true,
                destinatarios: {
                    orderBy: {
                        tutoria: {
                            aluno: {
                                nome: "asc"
                            }
                        }
                    },
                    select: {
                        tutoria: {
                            select: {
                                aluno: {
                                    select: {
                                        id_aluno: true,
                                        nome: true,
                                        // @@unique([id_atividade, id_aluno]): no máximo 1 resposta e 1 nota
                                        respostas: {
                                            where: {
                                                id_atividade: id_atividade
                                            },
                                            select: {
                                                id_resposta: true,
                                                texto: true,
                                                conteudo_file: true,
                                                data_envio: true
                                            }
                                        },
                                        notas: {
                                            where: {
                                                id_atividade: id_atividade
                                            },
                                            select: {
                                                id_nota: true,
                                                valor: true,
                                                comentario: true
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

        if (!atividade) {
            throw new AppError("Atividade não encontrada", 404);
        }

        const alunos = atividade.destinatarios.map(({ tutoria }) => {
            const { respostas, notas, ...aluno } = tutoria.aluno;

            const resposta = respostas[0] ?? null;
            const nota = notas[0] ?? null;

            // status calculado (não fica salvo no banco)
            const status = calcularStatusEntrega(atividade.data_entrega, resposta?.data_envio ?? null);

            return {
                aluno,
                resposta,
                // valor é Decimal no Prisma e iria para o JSON como texto ("8.5"); convertemos para número
                nota: nota ? { ...nota, valor: Number(nota.valor) } : null,
                status
            };
        });

        return {
            id_atividade: atividade.id_atividade,
            titulo: atividade.titulo,
            tipo: atividade.tipo,
            data_entrega: atividade.data_entrega,
            alunos
        };
    }
}

export { ListRespostasAtividadeService };
