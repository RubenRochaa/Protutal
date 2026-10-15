import { NextFunction, Request, Response } from "express";
import prismaClient from "../prisma";
import { AppError } from "../errors/AppError";

// Deve ser usado sempre DEPOIS do isAuthenticated, que preenche req.user_id e req.user_email
export async function isAluno(
    req: Request,
    res: Response,
    next: NextFunction
){

    // sem email no token não dá para conferir (e o Prisma ignoraria o filtro email: undefined)
    if(!req.user_email) {
        throw new AppError("Acesso permitido somente para alunos", 403);
    }

    // Professor e Aluno são tabelas separadas e os ids podem se repetir,
    // então conferimos no banco se o par id + email pertence a um aluno.
    // o token de professor nunca bate, porque o email do professor é de outro domínio.
    const aluno = await prismaClient.aluno.findFirst({
        where: {
            id_aluno: Number(req.user_id),
            email: req.user_email
        },
        select: {
            id_aluno: true
        }
    });

    if(!aluno) {
        throw new AppError("Acesso permitido somente para alunos", 403);
    }

    next();
}
