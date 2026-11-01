import { Request, Response } from "express";
import { ListAtividadesTutorService } from "../../services/aluno/ListAtividadesTutorService";

class ListAtividadesTutorController {
    async handle(req: Request, res: Response) {
        // o tutor é o aluno do token (preenchido pelo isAuthenticated), nunca da URL nem do corpo
        const id_aluno = Number(req.user_id);
        const email = req.user_email;

        // ?id_sala=, ?id_conteudo= e ?etapa= são opcionais. se vierem repetidos (?etapa=1&etapa=2)
        // o Express entrega um array; juntamos em texto para o service recusar com 400
        const { id_sala, id_conteudo, etapa } = req.query;

        const listAtividadesTutorService = new ListAtividadesTutorService();

        const atividades = await listAtividadesTutorService.execute({
            id_aluno,
            email,
            id_sala: id_sala === undefined ? undefined : String(id_sala),
            id_conteudo: id_conteudo === undefined ? undefined : String(id_conteudo),
            etapa: etapa === undefined ? undefined : String(etapa)
        });

        res.json(atividades);
    }
}

export { ListAtividadesTutorController };
