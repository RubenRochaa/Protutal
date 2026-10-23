import { Request, Response } from "express";
import { CreateAvaliacaoTutorService } from "../../services/professor/CreateAvaliacaoTutorService";

class CreateAvaliacaoTutorController {
    async handle(req: Request, res: Response) {
        // id do vínculo Tutor_sala vem da URL: /tutores-sala/:id/avaliacoes
        const id_tutor_sala = Number(req.params.id);

        const { nota, comentario } = req.body;

        // o professor vem do token (preenchido pelo isAuthenticated),
        // nunca do corpo da requisição
        const id_professor = Number(req.user_id);

        const createAvaliacaoTutorService = new CreateAvaliacaoTutorService();

        const avaliacao = await createAvaliacaoTutorService.execute({
            id_tutor_sala,
            id_professor,
            nota,
            comentario
        });

        res.status(201).json(avaliacao);
    }
}

export { CreateAvaliacaoTutorController };
