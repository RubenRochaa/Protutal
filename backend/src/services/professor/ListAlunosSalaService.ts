import prismaClient from "../../prisma";
import { AppError } from "../../errors/AppError";

interface ListAlunosSalaRequest {
    id_sala: number;
    id_professor: number;
}

class ListAlunosSalaService {
    async execute({ id_sala, id_professor }: ListAlunosSalaRequest) {

        // o id da sala vem da URL (/salas/:id/alunos) e precisa ser um inteiro positivo
        if (!Number.isInteger(id_sala) || id_sala <= 0) {
            throw new AppError("O id da sala deve ser um número inteiro", 400);
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

        // o professor só pode ver os alunos das próprias salas
        if (sala.id_professor !== id_professor) {
            throw new AppError("Você não tem permissão para acessar esta sala", 403);
        }

        // alunos que têm pelo menos uma matrícula nesta sala;
        // select explícito: senha (hash) e tokens de confirmação nunca saem na resposta
        const alunos = await prismaClient.aluno.findMany({
            where: {
                matriculas: {
                    some: {
                        id_sala: id_sala
                    }
                }
            },
            select: {
                id_aluno: true,
                nome: true,
                email: true,
                email_confirmado: true
            },
            orderBy: {
                nome: "asc"
            }
        });

        return alunos;
    }
}

export { ListAlunosSalaService };
