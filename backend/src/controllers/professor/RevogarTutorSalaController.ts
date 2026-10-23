import { Request, Response } from "express";
import { RevogarTutorSalaService } from "../../services/professor/RevogarTutorSalaService";

class RevogarTutorSalaController {
    async handle(req: Request, res: Response) {
        // id do vínculo Tutor_sala vem da URL: /tutores-sala/:id/revogar (a rota não tem corpo)
        const id_tutor_sala = Number(req.params.id);

        // o professor vem do token (preenchido pelo isAuthenticated),
        // nunca do corpo da requisição
        const id_professor = Number(req.user_id);

        const revogarTutorSalaService = new RevogarTutorSalaService();

        const resultado = await revogarTutorSalaService.execute({
            id_tutor_sala,
            id_professor
        });

        res.json(resultado);
    }
}

export { RevogarTutorSalaController };
