import prismaClient from "../../prisma";
import { AppError } from "../../errors/AppError";

interface ListAvisosSalaRequest {
    id_sala: number;
    id_usuario: number;
    email: string;
}

class ListAvisosSalaService {
    async execute({ id_sala, id_usuario, email }: ListAvisosSalaRequest) {

        // a rota usa só o isAuthenticated: a permissão é conferida aqui,
        // porque a rota é acessada tanto pelo aluno quanto pelo professor
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

        // sem email no token não dá para conferir (e o Prisma ignoraria o filtro email: undefined)
        if (!email) {
            throw new AppError("Você não tem permissão para acessar esta sala", 403);
        }

        // Professor e Aluno são tabelas separadas e os ids podem se repetir,
        // então sempre conferimos o par id + email (mesmo critério do isProfessor/isAluno)
        const professor = await prismaClient.professor.findFirst({
            where: {
                id_professor: id_usuario,
                email: email
            },
            select: {
                id_professor: true
            }
        });

        if (professor) {
            // o professor só vê os avisos das próprias salas
            if (sala.id_professor !== professor.id_professor) {
                throw new AppError("Você não tem permissão para acessar esta sala", 403);
            }
        } else {
            // o aviso é visível a todos os alunos da sala (RN10), inclusive o tutor, que também é matriculado.
            // sem filtro de tutoria ativa nem de ano letivo: avisos antigos ficam como histórico (RN14)
            const matricula = await prismaClient.matricula.findFirst({
                where: {
                    id_sala: id_sala,
                    aluno: {
                        id_aluno: id_usuario,
                        email: email
                    }
                },
                select: {
                    id_matricula: true
                }
            });

            if (!matricula) {
                throw new AppError("Você não tem permissão para acessar esta sala", 403);
            }
        }

        // mesmo formato de retorno da publicação (P3), sem email nem senha do professor
        const avisos = await prismaClient.aviso.findMany({
            where: {
                id_sala: id_sala
            },
            orderBy: {
                data_publicacao: "desc"
            },
            select: {
                id_aviso: true,
                titulo: true,
                conteudo: true,
                data_publicacao: true,
                professor: {
                    select: {
                        id_professor: true,
                        nome: true
                    }
                }
            }
        });

        return avisos;
    }
}

export { ListAvisosSalaService };
