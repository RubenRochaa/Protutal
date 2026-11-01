import { Request, Response } from "express";
import { DesempenhoTutoresSalaService } from "../../services/professor/DesempenhoTutoresSalaService";

class DesempenhoTutoresSalaController {
    async handle(req: Request, res: Response) {
        // id da sala vem da URL: /salas/:id/desempenho-tutores
        const id_sala = Number(req.params.id);

        // o professor vem do token (preenchido pelo isAuthenticated)
        const id_professor = Number(req.user_id);

        const desempenhoTutoresSalaService = new DesempenhoTutoresSalaService();

        const desempenho = await desempenhoTutoresSalaService.execute({
            id_sala,
            id_professor
        });

        res.json(desempenho);
    }
}

export { DesempenhoTutoresSalaController };
