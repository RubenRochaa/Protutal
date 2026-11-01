import { Request, Response } from "express";
import { ListAvisosSalaService } from "../../services/professor/ListAvisosSalaService";

class ListAvisosSalaController {
    async handle(req: Request, res: Response) {
        // id da sala vem da URL: /salas/:id/avisos
        const id_sala = Number(req.params.id);

        // o usuário (professor ou aluno) vem do token, preenchido pelo isAuthenticated
        const id_usuario = Number(req.user_id);
        const email = req.user_email;

        const listAvisosSalaService = new ListAvisosSalaService();

        const avisos = await listAvisosSalaService.execute({
            id_sala,
            id_usuario,
            email
        });

        res.json(avisos);
    }
}

export { ListAvisosSalaController };
