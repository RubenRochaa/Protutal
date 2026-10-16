import prismaClient from "../../prisma";
import { AppError } from "../../errors/AppError";

interface RecusarPedidoTutoriaRequest {
    id_pedido: number;
    id_professor: number;
}

class RecusarPedidoTutoriaService {
    async execute({ id_pedido, id_professor }: RecusarPedidoTutoriaRequest) {

        // o id do pedido vem da URL (/pedidos-tutoria/:id/recusar) e precisa ser um inteiro positivo
        if (!Number.isInteger(id_pedido) || id_pedido <= 0) {
            throw new AppError("O id do pedido deve ser um número inteiro", 400);
        }

        const pedido = await prismaClient.pedido_tutoria.findUnique({
            where: {
                id_pedido: id_pedido
            },
            select: {
                id_pedido: true,
                id_sala: true,
                status: true
            }
        });

        if (!pedido) {
            throw new AppError("Pedido de tutoria não encontrado", 404);
        }

        // só pedido pendente pode ser recusado (aceito/recusado já foi decidido)
        if (pedido.status !== "pendente") {
            throw new AppError("Este pedido já foi decidido", 409);
        }

        // a sala é a que o aluno escolheu no pedido
        const sala = await prismaClient.sala.findUnique({
            where: {
                id_sala: pedido.id_sala
            },
            select: {
                id_sala: true,
                id_professor: true
            }
        });

        if (!sala) {
            throw new AppError("Sala não encontrada", 404);
        }

        // o professor só pode recusar pedidos nas próprias salas
        if (sala.id_professor !== id_professor) {
            throw new AppError("Você não tem permissão para acessar esta sala", 403);
        }

        // o filtro status: "pendente" evita que dois professores decidam
        // o mesmo pedido ao mesmo tempo: o segundo não atualiza nenhuma linha
        // recusar NÃO cria Tutor nem Tutor_sala: só muda o pedido
        const atualizados = await prismaClient.pedido_tutoria.updateMany({
            where: {
                id_pedido: pedido.id_pedido,
                status: "pendente"
            },
            data: {
                status: "recusado",
                data_decisao: new Date(),
                id_professor: id_professor
            }
        });

        if (atualizados.count === 0) {
            throw new AppError("Este pedido já foi decidido", 409);
        }

        const pedidoAtualizado = await prismaClient.pedido_tutoria.findUnique({
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
            pedido: pedidoAtualizado
        };
    }
}

export { RecusarPedidoTutoriaService };
