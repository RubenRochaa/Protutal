import { Request, Response } from "express";
import { ListTutoriasSalaService } from "../../services/professor/ListTutoriasSalaService";

class ListTutoriasSalaController {
    async handle(req: Request, res: Response) {
        // id da sala vem da URL: /salas/:id/tutorias
        const id_sala = Number(req.params.id);

        // o professor vem do token (preenchido pelo isAuthenticated)
        const id_professor = Number(req.user_id);

        // ?status= é opcional. se vier repetido (?status=ativa&status=finalizada)
        // o Express entrega um array; juntamos em texto para o service recusar com 400
        const { status } = req.query;

        const listTutoriasSalaService = new ListTutoriasSalaService();

        const tutorias = await listTutoriasSalaService.execute({
            id_sala,
            id_professor,
            status: status === undefined ? undefined : String(status)
        });

        res.json(tutorias);
    }
}

export { ListTutoriasSalaController };
