import prismaClient from "../../prisma";
import { AppError } from "../../errors/AppError";
import { buscarSalaDoProfessor } from "../../helpers/buscarSalaDoProfessor";
import { validarId } from "../../helpers/validarId";
import { StatusTutoria } from "../../generated/prisma";

interface ListTutoriasSalaRequest {
    id_sala: number;
    id_professor: number;
    status?: string;
}

class ListTutoriasSalaService {
    async execute({ id_sala, id_professor, status }: ListTutoriasSalaRequest) {

        // o id da sala vem da URL (/salas/:id/tutorias) e precisa ser um inteiro positivo
        validarId(id_sala, "O id da sala deve ser um número inteiro");

        // ?status= é opcional, mas se vier precisa ser um dos valores do enum StatusTutoria
        // (a lista vem do client gerado pelo Prisma, então acompanha o schema)
        const statusValidos = Object.values(StatusTutoria) as string[];

        if (status !== undefined && !statusValidos.includes(status)) {
            throw new AppError(`O status deve ser ${statusValidos.join(" ou ")}`, 400);
        }

        // o professor só pode ver as tutorias das próprias salas
        await buscarSalaDoProfessor(id_sala, id_professor);

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
