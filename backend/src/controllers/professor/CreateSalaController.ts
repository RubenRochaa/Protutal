import { Request, Response } from "express";
import { CreateSalaService } from "../../services/professor/CreateSalaService";

class CreateSalaController {
    async handle(req: Request, res: Response) {
        const { nome, serie, ano_letivo } = req.body;

        // o professor da sala vem do token (preenchido pelo isAuthenticated),
        // nunca do corpo da requisição
        const id_professor = Number(req.user_id);

        const createSalaService = new CreateSalaService();

        const sala = await createSalaService.execute({
            nome,
            serie,
            ano_letivo,
            id_professor
        });

        res.status(201).json(sala);
    }
}

export { CreateSalaController };
