import prismaClient from "../prisma";
import { AppError } from "../errors/AppError";

// mensagem do 403 de sala, usada em vários services e middlewares
const MENSAGEM_SEM_PERMISSAO_SALA = "Você não tem permissão para acessar esta sala";

// busca a sala e confere se ela é do professor logado:
// sala não existe -> 404; sala de outro professor -> 403.
// a validação do id (validarId) fica em quem chama, porque a ordem muda de service para service
async function buscarSalaDoProfessor(id_sala: number, id_professor: number) {
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

    if (sala.id_professor !== id_professor) {
        throw new AppError(MENSAGEM_SEM_PERMISSAO_SALA, 403);
    }

    return sala;
}

export { buscarSalaDoProfessor, MENSAGEM_SEM_PERMISSAO_SALA };
