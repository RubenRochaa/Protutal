import { NextFunction, Request, Response } from "express";
import prismaClient from "../prisma";
import { AppError } from "../errors/AppError";
import { isProfessorDonoSala, isTutorAtivo } from "./isTutorAtivoSala";

// Deve ser usado sempre DEPOIS do isAuthenticated, que preenche req.user_id e req.user_email.
// Serve para rotas com o id da atividade na URL (/atividades/:id/...).
// Deixa passar: o professor dono da sala da atividade OU o tutor que criou a atividade,
// desde que o vínculo Tutor_sala usado na criação ainda esteja ativo.
export async function isTutorCriadorOuProfessorAtividade(
    req: Request,
    res: Response,
    next: NextFunction
){

    // o id da atividade vem da URL e precisa ser um inteiro positivo
    const id_atividade = Number(req.params.id);

    if (!Number.isInteger(id_atividade) || id_atividade <= 0) {
        throw new AppError("O id da atividade deve ser um número inteiro", 400);
    }

    // atividade -> tutor_sala -> sala, para saber o vínculo criador e o professor dono
    const atividade = await prismaClient.atividade.findUnique({
        where: {
            id_atividade: id_atividade
        },
        select: {
            id_tutor_sala: true,
            tutor_sala: {
                select: {
                    sala: {
                        select: {
                            id_professor: true
                        }
                    }
                }
            }
        }
    });

    if (!atividade) {
        throw new AppError("Atividade não encontrada", 404);
    }

    // sem email no token não dá para conferir (e o Prisma ignoraria o filtro email: undefined)
    if (!req.user_email) {
        throw new AppError("Você não tem permissão para acessar esta atividade", 403);
    }

    const id_usuario = Number(req.user_id);

    // 1) professor dono da sala da atividade
    if (await isProfessorDonoSala(atividade.tutor_sala.sala.id_professor, id_usuario, req.user_email)) {
        return next();
    }

    // 2) tutor que criou a atividade (o Tutor_sala da atividade é dele e não foi revogado)
    if (await isTutorAtivo({ id_usuario, email: req.user_email, id_tutor_sala: atividade.id_tutor_sala })) {
        return next();
    }

    throw new AppError("Você não tem permissão para acessar esta atividade", 403);
}
