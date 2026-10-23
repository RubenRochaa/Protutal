import { Request, Response } from "express";
import { DetailAtividadeService } from "../../services/aluno/DetailAtividadeService";

class DetailAtividadeController {
    async handle(req: Request, res: Response) {
        // id da atividade vem da URL: /atividades/:id
        const id_atividade = Number(req.params.id);

        // o usuário vem do token (preenchido pelo isAuthenticated), nunca da URL nem do corpo
        const id_usuario = Number(req.user_id);
        const email = req.user_email;

        const detailAtividadeService = new DetailAtividadeService();

        const atividade = await detailAtividadeService.execute({
            id_atividade,
            id_usuario,
            email
        });

        res.json(atividade);
    }
}

export { DetailAtividadeController };
