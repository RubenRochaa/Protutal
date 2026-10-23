import { Request, Response } from "express";
import { ListSalaService } from "../../services/professor/ListSalaService";

class ListSalaController {
    async handle(req: Request, res: Response) {
        // o professor vem do token (preenchido pelo isAuthenticated)
        const id_professor = Number(req.user_id);

        const listSalaService = new ListSalaService();

        const salas = await listSalaService.execute({
            id_professor
        });

        res.json(salas);
    }
}

export { ListSalaController };
