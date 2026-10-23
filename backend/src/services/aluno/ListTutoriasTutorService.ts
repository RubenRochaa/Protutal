import prismaClient from "../../prisma";
import { AppError } from "../../errors/AppError";
import { StatusTutoria } from "../../generated/prisma";

interface ListTutoriasTutorRequest {
    id_aluno: number;
    status?: string;
}

class ListTutoriasTutorService {
    async execute({ id_aluno, status }: ListTutoriasTutorRequest) {

        // ?status= é opcional, mas se vier precisa ser um dos valores do enum StatusTutoria
        // (a lista vem do client gerado pelo Prisma, então acompanha o schema)
        const statusValidos = Object.values(StatusTutoria) as string[];

        if (status !== undefined && !statusValidos.includes(status)) {
            throw new AppError(`O status deve ser ${statusValidos.join(" ou ")}`, 400);
        }

        // o tutor já foi conferido no middleware isTutor (tem pelo menos um Tutor_sala ativo).
        // tutorias dos vínculos ativos deste aluno (Tutoria -> Tutor_sala -> Tutor -> Aluno);
        // o mesmo aluno pode ser tutor em mais de uma sala, então entram todos os vínculos ativos.
        // sem filtro, status fica undefined e o Prisma ignora o campo (traz todas);
        // select explícito: senha (hash), email e tokens do aluno tutorado nunca saem na resposta;
        // se o tutor não tiver tutorados, volta lista vazia e isso não é erro
        const tutorias = await prismaClient.tutoria.findMany({
            where: {
                tutor_sala: {
                    data_revogacao: null,
                    tutor: {
                        id_aluno: id_aluno
                    }
                },
                status: status as StatusTutoria | undefined
            },
            select: {
                id_tutoria: true,
                status: true,
                meta_aprendizagem: true,
                data_inicio: true,
                data_fim: true,
                aluno: {
                    select: {
                        nome: true
                    }
                },
                tutor_sala: {
                    select: {
                        sala: {
                            select: {
                                id_sala: true,
                                nome: true,
                                serie: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                data_inicio: "asc"
            }
        });

        // achata tutor_sala.sala para sala, deixando a resposta mais simples para o front
        return tutorias.map((tutoria) => ({
            id_tutoria: tutoria.id_tutoria,
            status: tutoria.status,
            meta_aprendizagem: tutoria.meta_aprendizagem,
            data_inicio: tutoria.data_inicio,
            data_fim: tutoria.data_fim,
            aluno: tutoria.aluno,
            sala: tutoria.tutor_sala.sala
        }));
    }
}

export { ListTutoriasTutorService };
