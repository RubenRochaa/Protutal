import { NextFunction, Request, Response } from "express";
import prismaClient from "../prisma";

// Deve ser usado sempre DEPOIS do isAuthenticated, que preenche req.user_id e req.user_email
export async function isProfessor(
    req: Request,
    res: Response,
    next: NextFunction
){

    // sem email no token não dá para conferir (e o Prisma ignoraria o filtro email: undefined)
    if(!req.user_email) {
        res.status(403).json({ error: "Acesso permitido somente para professores" });
        return;
    }

    // o token de professor e o de aluno têm o mesmo formato (sub = id),
    // então conferimos no banco se o par id + email pertence a um professor.
    // o token de aluno nunca bate, porque o email do aluno é de outro domínio.
    const professor = await prismaClient.professor.findFirst({
        where: {
            id_professor: Number(req.user_id),
            email: req.user_email
        },
        select: {
            id_professor: true
        }
    });

    if(!professor) {
        res.status(403).json({ error: "Acesso permitido somente para professores" });
        return;
    }

    next();
}
