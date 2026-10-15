import prismaClient from "../../prisma";
import { AppError } from "../../errors/AppError";

interface PermissaoAtividadesSalaRequest {
    id_sala: number;
    pode_criar_ativ: boolean;
    id_professor: number;
}

class PermissaoAtividadesSalaService {
    async execute({ id_sala, pode_criar_ativ, id_professor }: PermissaoAtividadesSalaRequest) {

        // o id da sala vem da URL (/salas/:id/permissao-atividades) e precisa ser um inteiro positivo
        if (!Number.isInteger(id_sala) || id_sala <= 0) {
            throw new AppError("O id da sala deve ser um número inteiro", 400);
        }

        // pode_criar_ativ é obrigatório e precisa ser booleano de verdade
        // ("true" em texto, 1 ou null são recusados)
        if (typeof pode_criar_ativ !== "boolean") {
            throw new AppError("O campo pode_criar_ativ é obrigatório e deve ser true ou false", 400);
        }

        const sala = await prismaClient.sala.findUnique({
            where: {
                id_sala: id_sala
            },
            select: {
                id_sala: true,
                id_professor: true
            }
        });

        if (!sala) {
            throw new AppError("Sala não encontrada", 404);
        }

        // o professor só pode alterar a permissão dos tutores das próprias salas
        if (sala.id_professor !== id_professor) {
            throw new AppError("Você não tem permissão para acessar esta sala", 403);
        }

        // atualiza todos os tutores ativos da sala (data_revogacao nula = vínculo não revogado);
        // se a sala não tiver tutor ativo, count volta 0 e isso não é erro
        const atualizados = await prismaClient.tutor_sala.updateMany({
            where: {
                id_sala: id_sala,
                data_revogacao: null
            },
            data: {
                pode_criar_ativ: pode_criar_ativ
            }
        });

        return {
            id_sala: id_sala,
            pode_criar_ativ: pode_criar_ativ,
            quantidade_atualizada: atualizados.count
        };
    }
}

export { PermissaoAtividadesSalaService };
