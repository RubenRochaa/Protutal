import { Request, Response } from "express";
import { ListAlunosSalaService } from "../../services/professor/ListAlunosSalaService";

class ListAlunosSalaController {
    async handle(req: Request, res: Response) {
        // id da sala vem da URL: /salas/:id/alunos
        const id_sala = Number(req.params.id);

        // o professor vem do token (preenchido pelo isAuthenticated)
        const id_professor = Number(req.user_id);

        const listAlunosSalaService = new ListAlunosSalaService();

        const alunos = await listAlunosSalaService.execute({
            id_sala,
            id_professor
        });

        res.json(alunos);
    }
}

export { ListAlunosSalaController };
