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

    // Professor e Aluno são tabelas separadas e os ids podem se repetir,
    // então sempre conferimos o par id + email (mesmo critério do isProfessor/isAluno).

    // 1) professor dono da sala
    const professor = await prismaClient.professor.findFirst({
        where: {
            id_professor: id_usuario,
            email: req.user_email
        },
        select: {
            id_professor: true
        }
    });

    if (professor && sala.id_professor === professor.id_professor) {
        return next();
    }

    // 2) aluno que é tutor ativo desta sala (data_revogacao nula = vínculo não revogado)
    const tutorSala = await prismaClient.tutor_sala.findFirst({
        where: {
            id_sala: id_sala,
            data_revogacao: null,
            tutor: {
                aluno: {
                    id_aluno: id_usuario,
                    email: req.user_email
                }
            }
        },
        select: {
            id_tutor_sala: true
        }
    });

    if (tutorSala) {
        return next();
    }

    throw new AppError("Você não tem permissão para acessar esta sala", 403);
}
