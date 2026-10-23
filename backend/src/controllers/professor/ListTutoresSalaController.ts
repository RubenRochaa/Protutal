import { Request, Response } from "express";
import { ListTutoresSalaService } from "../../services/professor/ListTutoresSalaService";

class ListTutoresSalaController {
    async handle(req: Request, res: Response) {
        // id da sala vem da URL: /salas/:id/tutores
        const id_sala = Number(req.params.id);

        // o professor vem do token (preenchido pelo isAuthenticated)
        const id_professor = Number(req.user_id);

        const listTutoresSalaService = new ListTutoresSalaService();

        const tutores = await listTutoresSalaService.execute({
            id_sala,
            id_professor
        });

        res.json(tutores);
    }
}

export { ListTutoresSalaController };
