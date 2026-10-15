import { Request, Response } from "express";
import { CreateMatriculaService } from "../../services/professor/CreateMatriculaService";

class CreateMatriculaController {
    async handle(req: Request, res: Response) {
        // id da sala vem da URL: /salas/:id/matriculas
        const id_sala = Number(req.params.id);

        const { id_aluno } = req.body;

        // o professor vem do token (preenchido pelo isAuthenticated),
        // nunca do corpo da requisição
        const id_professor = Number(req.user_id);

        const createMatriculaService = new CreateMatriculaService();

        const matricula = await createMatriculaService.execute({
            id_sala,
            id_aluno,
            id_professor
        });

        res.status(201).json(matricula);
    }
}

export { CreateMatriculaController };
