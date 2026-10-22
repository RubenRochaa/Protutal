import { Request, Response } from "express";
import { ListConteudosSalaService } from "../../services/professor/ListConteudosSalaService";

class ListConteudosSalaController {
    async handle(req: Request, res: Response) {
        // id da sala vem da URL: /salas/:id/conteudos
        const id_sala = Number(req.params.id);

        const listConteudosSalaService = new ListConteudosSalaService();

        const conteudos = await listConteudosSalaService.execute({
            id_sala
        });

        res.json(conteudos);
    }
}

export { ListConteudosSalaController };
