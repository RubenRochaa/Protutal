import { Request, Response } from "express";
import { ListContestacoesService } from "../../services/professor/ListContestacoesService";

class ListContestacoesController {
    async handle(req: Request, res: Response) {
        // o usuário (professor ou tutor) vem do token, preenchido pelo isAuthenticated
        const id_usuario = Number(req.user_id);
        const email = req.user_email;

        // ?status= e ?id_sala= são opcionais. se vierem repetidos o Express entrega um array;
        // juntamos em texto para o service recusar com 400
        const { status, id_sala } = req.query;

        const listContestacoesService = new ListContestacoesService();

        const contestacoes = await listContestacoesService.execute({
            id_usuario,
            email,
            status: status === undefined ? undefined : String(status),
            id_sala: id_sala === undefined ? undefined : String(id_sala)
        });

        res.json(contestacoes);
    }
}

export { ListContestacoesController };
