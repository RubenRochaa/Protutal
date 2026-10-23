import { Request, Response } from "express";
import { CreateAtividadeService } from "../../services/aluno/CreateAtividadeService";

class CreateAtividadeController {
    async handle(req: Request, res: Response) {
        const { titulo, descricao, prazo, tipo, etapa, id_conteudo, id_tutoria } = req.body;

        // o aluno (tutor) vem do token (preenchido pelo isAuthenticated),
        // nunca do corpo da requisição
        const id_aluno = Number(req.user_id);

        const createAtividadeService = new CreateAtividadeService();

        const atividade = await createAtividadeService.execute({
            id_aluno,
            id_tutoria,
            id_conteudo,
            titulo,
            descricao,
            tipo,
            etapa,
            prazo
        });

        res.status(201).json(atividade);
    }
}

export { CreateAtividadeController };
