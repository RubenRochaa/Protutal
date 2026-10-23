import { Request, Response } from "express";
import { DetailSalaService } from "../../services/professor/DetailSalaService";

class DetailSalaController {
    async handle(req: Request, res: Response) {
        // id da sala vem da URL: /salas/:id
        const id_sala = Number(req.params.id);

        // o professor vem do token (preenchido pelo isAuthenticated)
        const id_professor = Number(req.user_id);

        const detailSalaService = new DetailSalaService();

        const sala = await detailSalaService.execute({
            id_sala,
            id_professor
        });

        res.json(sala);
    }
}

export { DetailSalaController };
