import { NextFunction, Request, Response } from "express";
import prismaClient from "../prisma";
import { AppError } from "../errors/AppError";

// Deve ser usado sempre DEPOIS do isAuthenticated, que preenche req.user_id e req.user_email.
// Serve para rotas com o id da sala na URL (/salas/:id/...).
// Deixa passar: o professor dono da sala OU um aluno que seja tutor ativo dessa sala.
export async function isTutorAtivoSala(
    req: Request,
    res: Response,
    next: NextFunction
){

    // o id da sala vem da URL e precisa ser um inteiro positivo
    const id_sala = Number(req.params.id);

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
    if (!req.user_email) {
        throw new AppError("Você não tem permissão para acessar esta sala", 403);
    }

    const id_usuario = Number(req.user_id);

    // 1) professor dono da sala
    if (await isProfessorDonoSala(sala.id_professor, id_usuario, req.user_email)) {
        return next();
    }

    // 2) aluno que é tutor ativo desta sala
    if (await isTutorAtivo({ id_usuario, email: req.user_email, id_sala })) {
        return next();
    }

    throw new AppError("Você não tem permissão para acessar esta sala", 403);
}

// As duas funções abaixo também são usadas por outros middlewares
// (ex.: isTutorCriadorOuProfessorAtividade), para a regra ficar num lugar só.
// Professor e Aluno são tabelas separadas e os ids podem se repetir,
// então sempre conferimos o par id + email (mesmo critério do isProfessor/isAluno).

// o usuário logado é o professor cujo id é id_professor_sala (dono da sala)?
export async function isProfessorDonoSala(
    id_professor_sala: number,
    id_usuario: number,
    email: string
) {
    const professor = await prismaClient.professor.findFirst({
        where: {
            id_professor: id_usuario,
            email: email
        },
        select: {
            id_professor: true
        }
    });

    return !!professor && professor.id_professor === id_professor_sala;
}

interface TutorAtivoRequest {
    id_usuario: number;
    email: string;
    id_sala?: number;       // tutor ativo de qualquer vínculo nesta sala
    id_tutor_sala?: number; // tutor ativo deste vínculo específico
}

// o usuário logado é um aluno com vínculo de tutor ativo (data_revogacao nula = não revogado)?
export async function isTutorAtivo({ id_usuario, email, id_sala, id_tutor_sala }: TutorAtivoRequest) {

    // sem nenhum dos dois filtros o Prisma ignoraria os campos undefined
    // e aceitaria qualquer vínculo ativo do aluno
    if (id_sala === undefined && id_tutor_sala === undefined) {
        return false;
    }

    const tutorSala = await prismaClient.tutor_sala.findFirst({
        where: {
            id_sala: id_sala,
            id_tutor_sala: id_tutor_sala,
            data_revogacao: null,
            tutor: {
                aluno: {
                    id_aluno: id_usuario,
                    email: email
                }
            }
        },
        select: {
            id_tutor_sala: true
        }
    });

    return !!tutorSala;
}
