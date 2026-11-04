import prismaClient from "../../prisma";
import { AppError } from "../../errors/AppError";
import { IMPEDIMENTOS_PEDIDO_TUTORIA, buscarImpedimentosPorSala } from "../../helpers/verificarPedidoTutoria";

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

        // já é tutor nesta sala -> revogado nesta sala -> pedido pendente -> recusa há menos de 2h nesta sala
        // (todos 409): regras compartilhadas com o GET /alunos/me/salas
        const situacaoDaSala = await buscarImpedimentosPorSala(id_aluno, idSala);
        const { impedimento, liberado_em } = situacaoDaSala(idSala);

        if (impedimento) {
            // na recusa recente, o front recebe também quando o aluno pode pedir de novo
            const dados = liberado_em
                ? { codigo: impedimento.codigo, liberado_em: liberado_em.toISOString() }
                : { codigo: impedimento.codigo };

            throw new AppError(impedimento.mensagem, impedimento.status, dados);
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
