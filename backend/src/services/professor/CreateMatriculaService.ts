import prismaClient from "../../prisma";
import { Prisma } from "../../generated/prisma";
import { AppError } from "../../errors/AppError";

interface MatriculaRequest {
    id_sala: number;
    id_aluno: number;
    id_professor: number;
}

class CreateMatriculaService {
    async execute({ id_sala, id_aluno, id_professor }: MatriculaRequest) {

        // o id da sala vem da URL (/salas/:id/matriculas) e precisa ser um inteiro positivo
        if (!Number.isInteger(id_sala) || id_sala <= 0) {
            throw new AppError("O id da sala deve ser um número inteiro", 400);
        }

        const sala = await prismaClient.sala.findUnique({
            where: {
                id_sala: id_sala
            },
            select: {
                id_sala: true,
                id_professor: true,
                ano_letivo: true
            }
        });

        if (!sala) {
            throw new AppError("Sala não encontrada", 404);
        }

        // o professor só pode matricular alunos nas próprias salas
        if (sala.id_professor !== id_professor) {
            throw new AppError("Você não tem permissão para acessar esta sala", 403);
        }

        // id_aluno é obrigatório e precisa ser um número inteiro
        if (id_aluno === undefined || id_aluno === null || !Number.isInteger(Number(id_aluno)) || Number(id_aluno) <= 0) {
            throw new AppError("O campo id_aluno é obrigatório e deve ser um número inteiro", 400);
        }

        const idAluno = Number(id_aluno);

        const aluno = await prismaClient.aluno.findUnique({
            where: {
                id_aluno: idAluno
            },
            select: {
                id_aluno: true
            }
        });

        if (!aluno) {
            throw new AppError("Aluno não encontrado", 404);
        }

        // usa a chave composta gerada pelo @@unique([id_aluno, id_sala]) de Matricula
        const jaMatriculadoNaSala = await prismaClient.matricula.findUnique({
            where: {
                id_aluno_id_sala: {
                    id_aluno: idAluno,
                    id_sala: id_sala
                }
            },
            select: {
                id_matricula: true
            }
        });

        if (jaMatriculadoNaSala) {
            throw new AppError("Aluno já matriculado nesta sala", 409);
        }

        // Matricula não tem ano_letivo: cruzamos com o ano_letivo da Sala.
        // como a checagem acima já descartou esta sala, qualquer resultado aqui é de outra sala
        const matriculaMesmoAno = await prismaClient.matricula.findFirst({
            where: {
                id_aluno: idAluno,
                sala: {
                    ano_letivo: sala.ano_letivo
                }
            },
            select: {
                id_matricula: true
            }
        });

        if (matriculaMesmoAno) {
            throw new AppError(`Aluno já matriculado em outra sala no ano letivo ${sala.ano_letivo}`, 409);
        }

        try {
            const matricula = await prismaClient.matricula.create({
                data: {
                    id_aluno: idAluno,
                    id_sala: id_sala
                },
                select: {
                    id_matricula: true,
                    id_aluno: true,
                    id_sala: true
                }
            });

            return matricula;
        } catch (err) {
            // P2002 = violação de UNIQUE: duas requisições iguais chegaram ao mesmo tempo
            if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
                throw new AppError("Aluno já matriculado nesta sala", 409);
            }

            throw err;
        }
    }
}

export { CreateMatriculaService };
