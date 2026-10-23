import prismaClient from "../../prisma";
import { AppError } from "../../errors/AppError";
import { StatusTutoria } from "../../generated/prisma";

interface ListTutoriasSalaRequest {
    id_sala: number;
    id_professor: number;
    status?: string;
}

class ListTutoriasSalaService {
    async execute({ id_sala, id_professor, status }: ListTutoriasSalaRequest) {

        // o id da sala vem da URL (/salas/:id/tutorias) e precisa ser um inteiro positivo
        if (!Number.isInteger(id_sala) || id_sala <= 0) {
            throw new AppError("O id da sala deve ser um número inteiro", 400);
        }

        // ?status= é opcional, mas se vier precisa ser um dos valores do enum StatusTutoria
        // (a lista vem do client gerado pelo Prisma, então acompanha o schema)
        const statusValidos = Object.values(StatusTutoria) as string[];

        if (status !== undefined && !statusValidos.includes(status)) {
            throw new AppError(`O status deve ser ${statusValidos.join(" ou ")}`, 400);
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

        // o professor só pode ver as tutorias das próprias salas
        if (sala.id_professor !== id_professor) {
            throw new AppError("Você não tem permissão para acessar esta sala", 403);
        }

        // tutorias cujo vínculo Tutor_sala é desta sala (Tutoria -> Tutor_sala -> Sala);
        // sem filtro, status fica undefined e o Prisma ignora o campo (traz todas);
        // select explícito: senha (hash) e tokens de confirmação nunca saem na resposta;
        // se a sala não tiver tutorias, volta lista vazia e isso não é erro
        const tutorias = await prismaClient.tutoria.findMany({
            where: {
                tutor_sala: {
                    id_sala: id_sala
                },
                status: status as StatusTutoria | undefined
            },
            select: {
                id_tutoria: true,
                status: true,
                meta_aprendizagem: true,
                data_inicio: true,
                data_fim: true,
                tutor_sala: {
                    select: {
                        tutor: {
                            select: {
                                aluno: {
                                    select: {
                                        nome: true
                                    }
                                }
                            }
                        }
                    }
                },
                aluno: {
                    select: {
                        nome: true
                    }
                }
            },
            orderBy: {
                data_inicio: "asc"
            }
        });

        // achata tutor_sala.tutor.aluno para tutor, deixando a resposta mais simples para o front
        return tutorias.map((tutoria) => ({
            id_tutoria: tutoria.id_tutoria,
            status: tutoria.status,
            meta_aprendizagem: tutoria.meta_aprendizagem,
            data_inicio: tutoria.data_inicio,
            data_fim: tutoria.data_fim,
            tutor: {
                nome: tutoria.tutor_sala.tutor.aluno.nome
            },
            aluno: tutoria.aluno
        }));
    }
}

export { ListTutoriasSalaService };
