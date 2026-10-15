import prismaClient from "../../prisma";
import { Prisma } from "../../generated/prisma";
import { AppError } from "../../errors/AppError";

interface AceitarPedidoTutoriaRequest {
    id_pedido: number;
    id_sala: number;
    id_professor: number;
}

class AceitarPedidoTutoriaService {
    async execute({ id_pedido, id_sala, id_professor }: AceitarPedidoTutoriaRequest) {

        // o id do pedido vem da URL (/pedidos-tutoria/:id/aceitar) e precisa ser um inteiro positivo
        if (!Number.isInteger(id_pedido) || id_pedido <= 0) {
            throw new AppError("O id do pedido deve ser um número inteiro", 400);
        }

        // id_sala é obrigatório e precisa ser um número inteiro
        if (id_sala === undefined || id_sala === null || !Number.isInteger(Number(id_sala)) || Number(id_sala) <= 0) {
            throw new AppError("O campo id_sala é obrigatório e deve ser um número inteiro", 400);
        }

        const idSala = Number(id_sala);

        const pedido = await prismaClient.pedido_tutoria.findUnique({
            where: {
                id_pedido: id_pedido
            },
            select: {
                id_pedido: true,
                id_aluno: true,
                id_sala: true,
                status: true
            }
        });

        if (!pedido) {
            throw new AppError("Pedido de tutoria não encontrado", 404);
        }

        // só pedido pendente pode ser aceito (aceito/recusado já foi decidido)
        if (pedido.status !== "pendente") {
            throw new AppError("Este pedido já foi decidido", 409);
        }

        const sala = await prismaClient.sala.findUnique({
            where: {
                id_sala: idSala
            },
            select: {
                id_sala: true,
                id_professor: true
            }
        });

        if (!sala) {
            throw new AppError("Sala não encontrada", 404);
        }

        // o professor só pode aceitar pedidos nas próprias salas
        if (sala.id_professor !== id_professor) {
            throw new AppError("Você não tem permissão para acessar esta sala", 403);
        }

        // o aluno escolheu a sala no pedido: o professor aceita para essa mesma sala
        if (pedido.id_sala !== idSala) {
            throw new AppError("Este pedido foi feito para outra sala", 400);
        }

        // usa a chave composta gerada pelo @@unique([id_aluno, id_sala]) de Matricula
        const matricula = await prismaClient.matricula.findUnique({
            where: {
                id_aluno_id_sala: {
                    id_aluno: pedido.id_aluno,
                    id_sala: idSala
                }
            },
            select: {
                id_matricula: true
            }
        });

        if (!matricula) {
            throw new AppError("O aluno não está matriculado nesta sala", 400);
        }

        try {
            // as três operações acontecem juntas: se uma falhar, nenhuma é gravada
            const resultado = await prismaClient.$transaction(async (tx) => {

                // o filtro status: "pendente" evita que dois professores aceitem
                // o mesmo pedido ao mesmo tempo: o segundo não atualiza nenhuma linha
                const atualizados = await tx.pedido_tutoria.updateMany({
                    where: {
                        id_pedido: pedido.id_pedido,
                        status: "pendente"
                    },
                    data: {
                        status: "aceito",
                        data_decisao: new Date(),
                        id_professor: id_professor
                    }
                });

                if (atualizados.count === 0) {
                    throw new AppError("Este pedido já foi decidido", 409);
                }

                const tutor = await tx.tutor.create({
                    data: {
                        id_aluno: pedido.id_aluno,
                        id_pedido: pedido.id_pedido
                    },
                    select: {
                        id_tutor: true
                    }
                });

                const tutorSala = await tx.tutor_sala.create({
                    data: {
                        id_tutor: tutor.id_tutor,
                        id_sala: idSala,
                        pode_criar_ativ: false
                    },
                    select: {
                        id_tutor_sala: true,
                        id_tutor: true,
                        id_sala: true,
                        data_definicao: true,
                        pode_criar_ativ: true
                    }
                });

                const pedidoAtualizado = await tx.pedido_tutoria.findUnique({
                    where: {
                        id_pedido: pedido.id_pedido
                    },
                    select: {
                        id_pedido: true,
                        id_aluno: true,
                        id_sala: true,
                        status: true,
                        data_solicitacao: true,
                        data_decisao: true,
                        id_professor: true
                    }
                });

                return {
                    pedido: pedidoAtualizado,
                    tutor_sala: tutorSala
                };
            });

            return resultado;
        } catch (err) {
            // P2002 = violação de UNIQUE em Tutor (id_aluno ou id_pedido): o aluno já virou tutor
            if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
                throw new AppError("Este aluno já é tutor", 409);
            }

            throw err;
        }
    }
}

export { AceitarPedidoTutoriaService };
