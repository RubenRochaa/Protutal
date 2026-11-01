import { Request, Response } from "express";
import { CreateContestacaoNotaService } from "../../services/aluno/CreateContestacaoNotaService";

class CreateContestacaoNotaController {
    async handle(req: Request, res: Response) {
        // id da nota vem da URL: /notas/:id/contestacoes
        const id_nota = Number(req.params.id);

        const { comentario } = req.body;

        // o aluno vem do token (preenchido pelo isAuthenticated), nunca do corpo da requisição
        const id_usuario = Number(req.user_id);

        const createContestacaoNotaService = new CreateContestacaoNotaService();

        const contestacao = await createContestacaoNotaService.execute({
            id_nota,
            id_usuario,
            comentario
        });

        res.status(201).json(contestacao);
    }
}

export { CreateContestacaoNotaController };
