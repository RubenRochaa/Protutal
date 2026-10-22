import { Request, Response } from "express";
import { ListRespostasAtividadeService } from "../../services/professor/ListRespostasAtividadeService";

class ListRespostasAtividadeController {
    async handle(req: Request, res: Response) {
        // id da atividade vem da URL: /atividades/:id/respostas
        const id_atividade = Number(req.params.id);

        const listRespostasAtividadeService = new ListRespostasAtividadeService();

        const respostas = await listRespostasAtividadeService.execute({
            id_atividade
        });

        res.json(respostas);
    }
}

export { ListRespostasAtividadeController };
