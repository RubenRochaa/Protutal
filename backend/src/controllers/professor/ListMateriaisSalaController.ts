import { Request, Response } from "express";
import { ListMateriaisSalaService } from "../../services/professor/ListMateriaisSalaService";

class ListMateriaisSalaController {
    async handle(req: Request, res: Response) {
        // id da sala vem da URL: /salas/:id/materiais
        const id_sala = Number(req.params.id);

        // o usuário (professor ou aluno) vem do token, preenchido pelo isAuthenticated
        const id_usuario = Number(req.user_id);
        const email = req.user_email;

        const listMateriaisSalaService = new ListMateriaisSalaService();

        const materiais = await listMateriaisSalaService.execute({
            id_sala,
            id_usuario,
            email
        });

        res.json(materiais);
    }
}

export { ListMateriaisSalaController };
