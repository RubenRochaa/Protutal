import { Request, Response } from "express";
import { ListAtividadesAlunoService } from "../../services/aluno/ListAtividadesAlunoService";

class ListAtividadesAlunoController {
    async handle(req: Request, res: Response) {
        // o aluno vem do token (preenchido pelo isAuthenticated), nunca da URL nem do corpo
        const id_aluno = Number(req.user_id);

        // ?status= e ?etapa= são opcionais. se vierem repetidos (?etapa=1&etapa=2)
        // o Express entrega um array; juntamos em texto para o service recusar com 400
        const { status, etapa } = req.query;

        const listAtividadesAlunoService = new ListAtividadesAlunoService();

        const atividades = await listAtividadesAlunoService.execute({
            id_aluno,
            status: status === undefined ? undefined : String(status),
            etapa: etapa === undefined ? undefined : String(etapa)
        });

        res.json(atividades);
    }
}

export { ListAtividadesAlunoController };
