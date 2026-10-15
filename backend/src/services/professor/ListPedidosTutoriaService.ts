import prismaClient from "../../prisma";

interface ListPedidosTutoriaRequest {
    id_professor: number;
}

class ListPedidosTutoriaService {
    async execute({ id_professor }: ListPedidosTutoriaRequest) {

        // pedidos pendentes feitos para alguma sala deste professor;
        // select explícito: senha (hash) e tokens do aluno nunca saem na resposta
        const pedidos = await prismaClient.pedido_tutoria.findMany({
            where: {
                status: "pendente",
                sala: {
                    id_professor: id_professor
                }
            },
            select: {
                id_pedido: true,
                data_solicitacao: true,
                // sala escolhida pelo aluno no pedido
                sala: {
                    select: {
                        id_sala: true,
                        nome: true
                    }
                },
                aluno: {
                    select: {
                        id_aluno: true,
                        nome: true,
                        // salas deste professor em que o aluno está matriculado
                        matriculas: {
                            where: {
                                sala: {
                                    id_professor: id_professor
                                }
                            },
                            select: {
                                sala: {
                                    select: {
                                        id_sala: true,
                                        nome: true
                                    }
                                }
                            }
                        }
                    }
                }
            },
            orderBy: {
                data_solicitacao: "asc"
            }
        });

        // achata matriculas[].sala em uma lista simples de salas
        return pedidos.map((pedido) => ({
            id_pedido: pedido.id_pedido,
            data_solicitacao: pedido.data_solicitacao,
            sala_pedido: pedido.sala,
            aluno: {
                id_aluno: pedido.aluno.id_aluno,
                nome: pedido.aluno.nome
            },
            salas_matriculado: pedido.aluno.matriculas.map((matricula) => matricula.sala)
        }));
    }
}

export { ListPedidosTutoriaService };
