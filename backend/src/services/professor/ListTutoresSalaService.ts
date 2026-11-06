import prismaClient from "../../prisma";
import { buscarSalaDoProfessor } from "../../helpers/buscarSalaDoProfessor";
import { validarId } from "../../helpers/validarId";

interface ListTutoresSalaRequest {
    id_sala: number;
    id_professor: number;
}

class ListTutoresSalaService {
    async execute({ id_sala, id_professor }: ListTutoresSalaRequest) {

        // o id da sala vem da URL (/salas/:id/tutores) e precisa ser um inteiro positivo
        validarId(id_sala, "O id da sala deve ser um número inteiro");

        // o professor só pode ver os tutores das próprias salas
        await buscarSalaDoProfessor(id_sala, id_professor);

        // tutores ativos da sala (data_revogacao nula = vínculo não revogado);
        // select explícito: senha (hash) e tokens de confirmação nunca saem na resposta;
        // se a sala não tiver tutor ativo, volta lista vazia e isso não é erro
        const tutores = await prismaClient.tutor_sala.findMany({
            where: {
                id_sala: id_sala,
                data_revogacao: null
            },
            select: {
                id_tutor_sala: true,
                id_tutor: true,
                pode_criar_ativ: true,
                data_definicao: true,
                tutor: {
                    select: {
                        aluno: {
                            select: {
                                id_aluno: true,
                                nome: true,
                                email: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                data_definicao: "asc"
            }
        });

        // achata tutor.aluno para aluno, deixando a resposta mais simples para o front
        return tutores.map((tutorSala) => ({
            id_tutor_sala: tutorSala.id_tutor_sala,
            id_tutor: tutorSala.id_tutor,
            pode_criar_ativ: tutorSala.pode_criar_ativ,
            data_definicao: tutorSala.data_definicao,
            aluno: tutorSala.tutor.aluno
        }));
    }
}

export { ListTutoresSalaService };
