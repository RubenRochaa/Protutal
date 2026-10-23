import prismaClient from "../../prisma";
import { AppError } from "../../errors/AppError";
import { StatusTutoria } from "../../generated/prisma";

interface ListTutoriasAlunoRequest {
    id_aluno: number;
    status?: string;
}

class ListTutoriasAlunoService {
    async execute({ id_aluno, status }: ListTutoriasAlunoRequest) {

        // ?status= é opcional, mas se vier precisa ser um dos valores do enum StatusTutoria
        // (a lista vem do client gerado pelo Prisma, então acompanha o schema)
        const statusValidos = Object.values(StatusTutoria) as string[];

        if (status !== undefined && !statusValidos.includes(status)) {
            throw new AppError(`O status deve ser ${statusValidos.join(" ou ")}`, 400);
        }

        // tutorias em que o aluno logado é o TUTORADO (Tutoria.id_aluno).
        // as que ele conduz como tutor não entram: nelas o id dele está em Tutor.id_aluno,
        // e Tutoria.id_aluno é o do outro aluno.
        // entram também as tutorias de vínculos Tutor_sala revogados (histórico do aluno);
        // sem filtro, status fica undefined e o Prisma ignora o campo (traz todas);
        // select explícito: do tutor sai só o nome (sem email, senha ou tokens);
        // se o aluno não tiver tutorias, volta lista vazia e isso não é erro
        const tutorias = await prismaClient.tutoria.findMany({
            where: {
                id_aluno: id_aluno,
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
                        },
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
            // no PostgreSQL o enum é ordenado pela ordem em que foi declarado no schema
            // (ativa, finalizada), então "asc" coloca as ativas primeiro
            orderBy: [
                { status: "asc" },
                { data_inicio: "asc" }
            ]
        });

        // achata tutor_sala.tutor.aluno para tutor e tutor_sala.sala para sala,
        // deixando a resposta mais simples para o front
        return tutorias.map((tutoria) => ({
            id_tutoria: tutoria.id_tutoria,
            status: tutoria.status,
            meta_aprendizagem: tutoria.meta_aprendizagem,
            data_inicio: tutoria.data_inicio,
            data_fim: tutoria.data_fim,
            tutor: {
                nome: tutoria.tutor_sala.tutor.aluno.nome
            },
            sala: tutoria.tutor_sala.sala
        }));
    }
}

export { ListTutoriasAlunoService };
