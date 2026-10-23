import prismaClient from "../../prisma";
import { AppError } from "../../errors/AppError";
import { calcularStatusEntrega, STATUS_ENTREGA, StatusEntrega } from "../../helpers/calcularStatusEntrega";

interface ListAtividadesAlunoRequest {
    id_aluno: number;
    status?: string;
    etapa?: string;
}

class ListAtividadesAlunoService {
    async execute({ id_aluno, status, etapa }: ListAtividadesAlunoRequest) {

        // filtros opcionais da query string: se vierem, precisam ser válidos
        let etapaFiltro: number | undefined;

        if (etapa !== undefined) {
            etapaFiltro = Number(etapa);

            if (![1, 2, 3].includes(etapaFiltro)) {
                throw new AppError("A etapa deve ser 1, 2 ou 3", 400);
            }
        }

        if (status !== undefined && !STATUS_ENTREGA.includes(status as StatusEntrega)) {
            throw new AppError("O status deve ser pendente, entregue ou entregue_com_atraso", 400);
        }

        // uma única consulta traz as atividades em que o aluno é DESTINATÁRIO
        // (por alguma tutoria dele) e, de cada uma, conteúdo, sala, tutor e
        // a resposta e a nota DESTE aluno.
        // as atividades que ele criou como tutor não entram, porque nelas ele não é destinatário.
        // o Prisma resolve cada nível de relação com uma query em lote (WHERE ... IN (...)),
        // então o número de queries é fixo e não cresce com a quantidade de atividades (sem N+1)
        const atividades = await prismaClient.atividade.findMany({
            where: {
                destinatarios: {
                    some: {
                        tutoria: {
                            id_aluno: id_aluno
                        }
                    }
                },
                etapa: etapaFiltro
            },
            orderBy: {
                data_entrega: "asc"
            },
            select: {
                id_atividade: true,
                titulo: true,
                descricao: true,
                tipo: true,
                etapa: true,
                data_entrega: true,
                conteudo: {
                    select: {
                        id_conteudo: true,
                        nome: true
                    }
                },
                tutor_sala: {
                    select: {
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
                },
                // a tutoria do aluno que recebeu a atividade (para saber se está ativa).
                // o primeiro por id, o mesmo que o findFirst do POST /atividades/:id/respostas encontra
                destinatarios: {
                    where: {
                        tutoria: {
                            id_aluno: id_aluno
                        }
                    },
                    orderBy: {
                        id_att_destinatario: "asc"
                    },
                    take: 1,
                    select: {
                        tutoria: {
                            select: {
                                status: true
                            }
                        }
                    }
                },
                // @@unique([id_atividade, id_aluno]): no máximo 1 resposta e 1 nota
                respostas: {
                    where: {
                        id_aluno: id_aluno
                    },
                    select: {
                        data_envio: true
                    }
                },
                notas: {
                    where: {
                        id_aluno: id_aluno
                    },
                    select: {
                        valor: true,
                        comentario: true
                    }
                }
            }
        });

        const lista = atividades.map((atividade) => {
            const resposta = atividade.respostas[0] ?? null;
            const nota = atividade.notas[0] ?? null;
            const destinatario = atividade.destinatarios[0];

            return {
                id_atividade: atividade.id_atividade,
                titulo: atividade.titulo,
                descricao: atividade.descricao,
                tipo: atividade.tipo,
                etapa: atividade.etapa,
                data_entrega: atividade.data_entrega,
                conteudo: atividade.conteudo,
                sala: atividade.tutor_sala.sala,
                tutor: {
                    nome: atividade.tutor_sala.tutor.aluno.nome
                },
                status: calcularStatusEntrega(atividade.data_entrega, resposta?.data_envio ?? null),
                // valor é Decimal no Prisma e iria para o JSON como texto ("8.5"); convertemos para número
                nota: nota ? { valor: Number(nota.valor), comentario: nota.comentario } : null,
                // mesmo critério do POST /atividades/:id/respostas: tutoria ativa e ainda sem resposta
                // (o prazo não bloqueia: depois dele a entrega fica como entregue_com_atraso)
                pode_responder: destinatario?.tutoria.status === "ativa" && !resposta
            };
        });

        // status não é coluna do banco (é calculado acima), então não dá para filtrar no where;
        // a lista já contém só as atividades deste aluno, por isso filtrar aqui é simples e barato
        if (status !== undefined) {
            return lista.filter((atividade) => atividade.status === status);
        }

        return lista;
    }
}

export { ListAtividadesAlunoService };
