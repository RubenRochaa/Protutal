import prismaClient from "../../prisma";
import { AppError } from "../../errors/AppError";
import { IMPEDIMENTOS_PEDIDO_TUTORIA, buscarImpedimentoAluno } from "../../helpers/verificarPedidoTutoria";

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
            const { mensagem, status } = IMPEDIMENTOS_PEDIDO_TUTORIA.nao_matriculado;
            throw new AppError(mensagem, status);
        }

        // já é tutor (409) -> pedido pendente (409): regras compartilhadas com o GET /alunos/me/salas
        const impedimento = await buscarImpedimentoAluno(id_aluno);

        if (impedimento) {
            throw new AppError(impedimento.mensagem, impedimento.status);
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
