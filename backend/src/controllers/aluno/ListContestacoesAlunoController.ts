import { Request, Response } from "express";
import { ListContestacoesAlunoService } from "../../services/aluno/ListContestacoesAlunoService";

class ListContestacoesAlunoController {
    async handle(req: Request, res: Response) {
        // o aluno vem do token (preenchido pelo isAuthenticated), nunca da URL nem do corpo
        const id_aluno = Number(req.user_id);

        // ?status= é opcional. se vier repetido (?status=pendente&status=aceita)
        // o Express entrega um array; juntamos em texto para o service recusar com 400
        const { status } = req.query;

        const listContestacoesAlunoService = new ListContestacoesAlunoService();

        const contestacoes = await listContestacoesAlunoService.execute({
            id_aluno,
            status: status === undefined ? undefined : String(status)
        });

        res.json(contestacoes);
    }
}

export { ListContestacoesAlunoController };
