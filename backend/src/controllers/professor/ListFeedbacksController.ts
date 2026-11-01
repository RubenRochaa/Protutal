import { Request, Response } from "express";
import { ListFeedbacksService } from "../../services/professor/ListFeedbacksService";

class ListFeedbacksController {
    async handle(req: Request, res: Response) {
        // o usuário (professor ou tutor) vem do token, preenchido pelo isAuthenticated
        const id_usuario = Number(req.user_id);
        const email = req.user_email;

        // ?etapa=, ?ano=, ?id_aluno=, ?id_sala= e ?id_tutor_sala= são opcionais. se vierem repetidos
        // o Express entrega um array; juntamos em texto para o service recusar com 400
        const { etapa, ano, id_aluno, id_sala, id_tutor_sala } = req.query;

        const listFeedbacksService = new ListFeedbacksService();

        const feedbacks = await listFeedbacksService.execute({
            id_usuario,
            email,
            etapa: etapa === undefined ? undefined : String(etapa),
            ano: ano === undefined ? undefined : String(ano),
            id_aluno: id_aluno === undefined ? undefined : String(id_aluno),
            id_sala: id_sala === undefined ? undefined : String(id_sala),
            id_tutor_sala: id_tutor_sala === undefined ? undefined : String(id_tutor_sala)
        });

        res.json(feedbacks);
    }
}

export { ListFeedbacksController };
