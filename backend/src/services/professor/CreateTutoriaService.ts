import prismaClient from "../../prisma";
import { AppError } from "../../errors/AppError";

interface TutoriaRequest {
    id_tutor_sala: number;
    id_aluno: number;
    meta_aprendizagem: string;
    id_professor: number;
}

class CreateTutoriaService {
    async execute({ id_tutor_sala, id_aluno, meta_aprendizagem, id_professor }: TutoriaRequest) {

        // id_tutor_sala é obrigatório: identifica o tutor e a sala da tutoria
        if (id_tutor_sala === undefined || id_tutor_sala === null || !Number.isInteger(Number(id_tutor_sala)) || Number(id_tutor_sala) <= 0) {
            throw new AppError("O campo id_tutor_sala é obrigatório e deve ser um número inteiro", 400);
        }

        // id_aluno é obrigatório: é o aluno que será tutorado
        if (id_aluno === undefined || id_aluno === null || !Number.isInteger(Number(id_aluno)) || Number(id_aluno) <= 0) {
            throw new AppError("O campo id_aluno é obrigatório e deve ser um número inteiro", 400);
        }

        // no schema a coluna é opcional, mas a regra da rota exige a meta
        if (typeof meta_aprendizagem !== "string" || meta_aprendizagem.trim() === "") {
            throw new AppError("O campo meta_aprendizagem é obrigatório", 400);
        }

        const idTutorSala = Number(id_tutor_sala);
        const idAluno = Number(id_aluno);

        // busca o vínculo tutor-sala junto com o aluno do tutor e o professor da sala
        const tutorSala = await prismaClient.tutor_sala.findUnique({
            where: {
                id_tutor_sala: idTutorSala
            },
            select: {
                id_tutor_sala: true,
                id_sala: true,
                data_revogacao: true,
                tutor: {
                    select: {
                        id_aluno: true
                    }
                },
                sala: {
                    select: {
                        id_professor: true
                    }
                }
            }
        });

        // vínculo revogado (data_revogacao preenchida) conta como não encontrado
        if (!tutorSala || tutorSala.data_revogacao !== null) {
            throw new AppError("Tutor da sala não encontrado ou revogado", 404);
        }

        // o professor só pode criar tutorias nas próprias salas
        if (tutorSala.sala.id_professor !== id_professor) {
            throw new AppError("Você não tem permissão para acessar esta sala", 403);
        }

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

        // o tutor não pode ser tutor de si mesmo
        if (tutorSala.tutor.id_aluno === idAluno) {
            throw new AppError("O tutor não pode ser tutor de si mesmo", 400);
        }

        // o aluno precisa estar matriculado na MESMA sala do Tutor_sala
        // (usa a chave composta gerada pelo @@unique([id_aluno, id_sala]) de Matricula)
        const matricula = await prismaClient.matricula.findUnique({
            where: {
                id_aluno_id_sala: {
                    id_aluno: idAluno,
                    id_sala: tutorSala.id_sala
                }
            },
            select: {
                id_matricula: true
            }
        });

        if (!matricula) {
            throw new AppError("O aluno não está matriculado nesta sala", 400);
        }

        // só pode existir uma tutoria ativa para o mesmo tutor_sala e o mesmo aluno
        const tutoriaAtiva = await prismaClient.tutoria.findFirst({
            where: {
                id_tutor_sala: idTutorSala,
                id_aluno: idAluno,
                status: "ativa"
            },
            select: {
                id_tutoria: true
            }
        });

        if (tutoriaAtiva) {
            throw new AppError("Já existe uma tutoria ativa entre este tutor e este aluno", 409);
        }

        const tutoria = await prismaClient.tutoria.create({
            data: {
                id_tutor_sala: idTutorSala,
                id_aluno: idAluno,
                meta_aprendizagem: meta_aprendizagem.trim(),
                status: "ativa"
            },
            select: {
                id_tutoria: true,
                id_tutor_sala: true,
                id_aluno: true,
                meta_aprendizagem: true,
                status: true,
                data_inicio: true
            }
        });

        return tutoria;
    }
}

export { CreateTutoriaService };
