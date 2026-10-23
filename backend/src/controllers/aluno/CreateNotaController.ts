import { Request, Response } from "express";
import { CreateNotaService } from "../../services/aluno/CreateNotaService";

class CreateNotaController {
    async handle(req: Request, res: Response) {
        // id da atividade vem da URL: /atividades/:id/notas
        const id_atividade = Number(req.params.id);

        const { id_aluno, valor, comentario } = req.body;

        // o tutor vem do token (preenchido pelo isAuthenticated), nunca do corpo da requisição
        const id_usuario = Number(req.user_id);
        const email = req.user_email;

        const createNotaService = new CreateNotaService();

        const nota = await createNotaService.execute({
            id_atividade,
            id_usuario,
            email,
            id_aluno,
            valor,
            comentario
        });

        res.status(201).json(nota);
    }
}

export { CreateNotaController };
