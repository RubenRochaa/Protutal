import prismaClient from "../../prisma";
import { AppError } from "../../errors/AppError";
import { buscarSalaDoProfessor } from "../../helpers/buscarSalaDoProfessor";
import { validarId } from "../../helpers/validarId";

interface PermissaoAtividadesSalaRequest {
    id_sala: number;
    pode_criar_ativ: boolean;
    id_professor: number;
}

class PermissaoAtividadesSalaService {
    async execute({ id_sala, pode_criar_ativ, id_professor }: PermissaoAtividadesSalaRequest) {

        // o id da sala vem da URL (/salas/:id/permissao-atividades) e precisa ser um inteiro positivo
        validarId(id_sala, "O id da sala deve ser um número inteiro");

        // pode_criar_ativ é obrigatório e precisa ser booleano de verdade
        // ("true" em texto, 1 ou null são recusados)
        if (typeof pode_criar_ativ !== "boolean") {
            throw new AppError("O campo pode_criar_ativ é obrigatório e deve ser true ou false", 400);
        }

        // o professor só pode alterar a permissão dos tutores das próprias salas
        await buscarSalaDoProfessor(id_sala, id_professor);

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
