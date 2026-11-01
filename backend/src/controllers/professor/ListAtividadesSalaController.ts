import { Request, Response } from "express";
import { ListAtividadesSalaService } from "../../services/professor/ListAtividadesSalaService";

class ListAtividadesSalaController {
    async handle(req: Request, res: Response) {
        // id da sala vem da URL: /salas/:id/atividades
        const id_sala = Number(req.params.id);

        // o professor vem do token (preenchido pelo isAuthenticated)
        const id_professor = Number(req.user_id);

        // ?etapa=, ?id_conteudo= e ?id_tutor_sala= são opcionais. se vierem repetidos (?etapa=1&etapa=2)
        // o Express entrega um array; juntamos em texto para o service recusar com 400
        const { etapa, id_conteudo, id_tutor_sala } = req.query;

        const listAtividadesSalaService = new ListAtividadesSalaService();

        const atividades = await listAtividadesSalaService.execute({
            id_sala,
            id_professor,
            etapa: etapa === undefined ? undefined : String(etapa),
            id_conteudo: id_conteudo === undefined ? undefined : String(id_conteudo),
            id_tutor_sala: id_tutor_sala === undefined ? undefined : String(id_tutor_sala)
        });

        res.json(atividades);
    }
}

export { ListAtividadesSalaController };
