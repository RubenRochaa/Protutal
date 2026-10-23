import { NextFunction, Request, Response } from "express";
import prismaClient from "../prisma";
import { AppError } from "../errors/AppError";

// Deve ser usado sempre DEPOIS do isAuthenticated, que preenche req.user_id e req.user_email.
// Serve para as rotas do tutor sem id na URL (/tutores/me/...).
// Deixa passar: aluno com pelo menos um vínculo de tutor ativo (Tutor_sala sem data_revogacao),
// em qualquer sala. O tutor não tem login próprio: ele entra pelo login de aluno.
export async function isTutor(
    req: Request,
    res: Response,
    next: NextFunction
){

    // sem email no token não dá para conferir (e o Prisma ignoraria o filtro email: undefined)
    if(!req.user_email) {
        throw new AppError("Acesso permitido somente para tutores com vínculo ativo", 403);
    }

    // Professor e Aluno são tabelas separadas e os ids podem se repetir,
    // então conferimos o par id + email do aluno (mesmo critério do isAluno/isTutorAtivo).
    // o token de professor nunca bate, porque o email do professor é de outro domínio.
    const tutorSala = await prismaClient.tutor_sala.findFirst({
        where: {
            data_revogacao: null,
            tutor: {
                aluno: {
                    id_aluno: Number(req.user_id),
                    email: req.user_email
                }
            }
        },
        select: {
            id_tutor_sala: true
        }
    });

    if(!tutorSala) {
        throw new AppError("Acesso permitido somente para tutores com vínculo ativo", 403);
    }

    next();
}
