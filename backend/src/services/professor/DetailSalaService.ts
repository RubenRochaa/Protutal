import prismaClient from "../../prisma";
import { AppError } from "../../errors/AppError";

interface DetailSalaRequest {
    id_sala: number;
    id_professor: number;
}

class DetailSalaService {
    async execute({ id_sala, id_professor }: DetailSalaRequest) {

        // o id da sala vem da URL (/salas/:id) e precisa ser um inteiro positivo
        if (!Number.isInteger(id_sala) || id_sala <= 0) {
            throw new AppError("O id da sala deve ser um número inteiro", 400);
        }

        // select explícito: do professor saem só id e nome (senha, email e tokens nunca saem);
        // alunos, tutores e conteúdos da sala não entram aqui, porque já têm rotas próprias
        const sala = await prismaClient.sala.findUnique({
            where: {
                id_sala: id_sala
            },
            select: {
                id_sala: true,
                nome: true,
                serie: true,
                ano_letivo: true,
                id_professor: true,
                professor: {
                    select: {
                        id_professor: true,
                        nome: true
                    }
                }
            }
        });

        if (!sala) {
            throw new AppError("Sala não encontrada", 404);
        }

        // o professor só pode ver os detalhes das próprias salas (RN07)
        if (sala.id_professor !== id_professor) {
            throw new AppError("Você não tem permissão para acessar esta sala", 403);
        }

        // o id_professor já vem dentro de "professor", então não repetimos ele solto
        return {
            id_sala: sala.id_sala,
            nome: sala.nome,
            serie: sala.serie,
            ano_letivo: sala.ano_letivo,
            professor: sala.professor
        };
    }
}

export { DetailSalaService };
