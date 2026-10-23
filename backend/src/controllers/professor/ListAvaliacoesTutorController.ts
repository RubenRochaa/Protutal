import { Request, Response } from "express";
import { ListAvaliacoesTutorService } from "../../services/professor/ListAvaliacoesTutorService";

class ListAvaliacoesTutorController {
    async handle(req: Request, res: Response) {
        // id do vínculo Tutor_sala vem da URL: /tutores-sala/:id/avaliacoes
        const id_tutor_sala = Number(req.params.id);

        // o professor vem do token (preenchido pelo isAuthenticated)
        const id_professor = Number(req.user_id);

        const listAvaliacoesTutorService = new ListAvaliacoesTutorService();

        const avaliacoes = await listAvaliacoesTutorService.execute({
            id_tutor_sala,
            id_professor
        });

        res.json(avaliacoes);
    }
}

export { ListAvaliacoesTutorController };
