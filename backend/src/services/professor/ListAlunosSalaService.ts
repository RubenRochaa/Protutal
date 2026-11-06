import prismaClient from "../../prisma";
import { buscarSalaDoProfessor } from "../../helpers/buscarSalaDoProfessor";
import { validarId } from "../../helpers/validarId";

interface ListAlunosSalaRequest {
    id_sala: number;
    id_professor: number;
}

class ListAlunosSalaService {
    async execute({ id_sala, id_professor }: ListAlunosSalaRequest) {

        // o id da sala vem da URL (/salas/:id/alunos) e precisa ser um inteiro positivo
        validarId(id_sala, "O id da sala deve ser um número inteiro");

        // o professor só pode ver os alunos das próprias salas
        await buscarSalaDoProfessor(id_sala, id_professor);

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
