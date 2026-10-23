import { Request, Response } from "express";
import { UpdateMetaTutoriaService } from "../../services/professor/UpdateMetaTutoriaService";

class UpdateMetaTutoriaController {
    async handle(req: Request, res: Response) {
        // id da tutoria vem da URL: /tutorias/:id/meta
        const id_tutoria = Number(req.params.id);

        const { meta_aprendizagem } = req.body;

        // o professor vem do token (preenchido pelo isAuthenticated),
        // nunca do corpo da requisição
        const id_professor = Number(req.user_id);

        const updateMetaTutoriaService = new UpdateMetaTutoriaService();

        const tutoria = await updateMetaTutoriaService.execute({
            id_tutoria,
            id_professor,
            meta_aprendizagem
        });

        res.json(tutoria);
    }
}

export { UpdateMetaTutoriaController };
