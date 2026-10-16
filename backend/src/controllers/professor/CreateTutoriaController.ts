import { Request, Response } from "express";
import { CreateTutoriaService } from "../../services/professor/CreateTutoriaService";

class CreateTutoriaController {
    async handle(req: Request, res: Response) {
        const { id_tutor_sala, id_aluno, meta_aprendizagem } = req.body;

        // o professor vem do token (preenchido pelo isAuthenticated),
        // nunca do corpo da requisição
        const id_professor = Number(req.user_id);

        const createTutoriaService = new CreateTutoriaService();

        const tutoria = await createTutoriaService.execute({
            id_tutor_sala,
            id_aluno,
            meta_aprendizagem,
            id_professor
        });

        res.status(201).json(tutoria);
    }
}

export { CreateTutoriaController };
