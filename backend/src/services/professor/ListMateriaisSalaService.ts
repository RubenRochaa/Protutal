import prismaClient from "../../prisma";
import { AppError } from "../../errors/AppError";
import { Prisma } from "../../generated/prisma";

interface ListMateriaisSalaRequest {
    id_sala: number;
    id_usuario: number;
    email: string;
}

class ListMateriaisSalaService {
    async execute({ id_sala, id_usuario, email }: ListMateriaisSalaRequest) {

        // a rota usa só o isAuthenticated: a permissão é conferida aqui,
        // porque o isTutorAtivoSala barraria o professor que não é dono e o aluno tutorado
        if (!Number.isInteger(id_sala) || id_sala <= 0) {
            throw new AppError("O id da sala deve ser um número inteiro", 400);
        }

        const sala = await prismaClient.sala.findUnique({
            where: {
                id_sala: id_sala
            },
            select: {
                id_sala: true
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

        let filtro: Prisma.MaterialWhereInput;

        if (professor) {
            // qualquer professor cadastrado vê todos os materiais da sala
            filtro = {
                tutor_sala: {
                    id_sala: id_sala
                }
            };
        } else {
            // vínculos Tutor_sala desta sala cujos materiais o aluno pode ver.
            // o OR junta os dois casos, então o aluno que é tutor e tutorado recebe as duas listas
            const tutorSalas = await prismaClient.tutor_sala.findMany({
                where: {
                    id_sala: id_sala,
                    OR: [
                        // 1) ele é o tutor ativo deste vínculo (vê o que ele mesmo anexou)
                        {
                            data_revogacao: null,
                            tutor: {
                                aluno: {
                                    id_aluno: id_usuario,
                                    email: email
                                }
                            }
                        },
                        // 2) ele tem ou teve tutoria com este tutor
                        // (sem filtro de status: ativa e finalizada são os dois únicos status)
                        {
                            tutorias: {
                                some: {
                                    aluno: {
                                        id_aluno: id_usuario,
                                        email: email
                                    }
                                }
                            }
                        }
                    ]
                },
                select: {
                    id_tutor_sala: true
                }
            });

            if (tutorSalas.length === 0) {
                throw new AppError("Você não tem permissão para acessar esta sala", 403);
            }

            // cada material pertence a um único Tutor_sala, então não há material repetido
            filtro = {
                id_tutor_sala: {
                    in: tutorSalas.map((tutorSala) => tutorSala.id_tutor_sala)
                }
            };
        }

        // uma única consulta traz os materiais e o tutor que anexou cada um;
        // o Prisma resolve as relações em lote, então não há uma consulta por tutor (sem N+1)
        const materiais = await prismaClient.material.findMany({
            where: filtro,
            orderBy: {
                data_envio: "desc"
            },
            select: {
                id_material: true,
                titulo: true,
                descricao: true,
                arquivo: true,
                data_envio: true,
                tutor_sala: {
                    select: {
                        id_tutor_sala: true,
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
                }
            }
        });

        return materiais.map(({ tutor_sala, ...material }) => ({
            ...material,
            tutor: {
                id_tutor_sala: tutor_sala.id_tutor_sala,
                nome: tutor_sala.tutor.aluno.nome
            }
        }));
    }
}

export { ListMateriaisSalaService };
