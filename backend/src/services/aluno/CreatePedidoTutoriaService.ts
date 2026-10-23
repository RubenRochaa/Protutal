import prismaClient from "../../prisma";
import { AppError } from "../../errors/AppError";

interface PedidoTutoriaRequest {
    id_aluno: number;
    id_sala: number;
}

class CreatePedidoTutoriaService {
    async execute({ id_aluno, id_sala }: PedidoTutoriaRequest) {

        // id_sala é obrigatório: o pedido é analisado pelo professor da sala escolhida
        if (id_sala === undefined || id_sala === null || !Number.isInteger(Number(id_sala)) || Number(id_sala) <= 0) {
            throw new AppError("O campo id_sala é obrigatório e deve ser um número inteiro", 400);
        }

        const idSala = Number(id_sala);

        const sala = await prismaClient.sala.findUnique({
            where: {
                id_sala: idSala
            },
            select: {
                id_sala: true
            }
        });

        if (!sala) {
            throw new AppError("Sala não encontrada", 404);
        }

        // o aluno só pode pedir tutoria numa sala em que está matriculado
        // (usa a chave composta gerada pelo @@unique([id_aluno, id_sala]) de Matricula)
        const matricula = await prismaClient.matricula.findUnique({
            where: {
                id_aluno_id_sala: {
                    id_aluno: id_aluno,
                    id_sala: idSala
                }
            },
            select: {
                id_matricula: true
            }
        });

        if (!matricula) {
            throw new AppError("Você não está matriculado nesta sala", 400);
        }

        // Tutor.id_aluno é único: quem já é tutor não pode pedir de novo
        const tutor = await prismaClient.tutor.findUnique({
            where: {
                id_aluno: id_aluno
            },
            select: {
                id_tutor: true
            }
        });

        if (tutor) {
            throw new AppError("Você já é tutor", 409);
        }

        // só pode existir um pedido pendente por aluno
        const pedidoPendente = await prismaClient.pedido_tutoria.findFirst({
            where: {
                id_aluno: id_aluno,
                status: "pendente"
            },
            select: {
                id_pedido: true
            }
        });

        if (pedidoPendente) {
            throw new AppError("Você já tem um pedido de tutoria pendente", 409);
        }

        const pedido = await prismaClient.pedido_tutoria.create({
            data: {
                id_aluno: id_aluno,
                id_sala: idSala,
                status: "pendente"
            },
            select: {
                id_pedido: true,
                id_aluno: true,
                id_sala: true,
                status: true,
                data_solicitacao: true
            }
        });

        return pedido;
    }
}

export { CreatePedidoTutoriaService };
