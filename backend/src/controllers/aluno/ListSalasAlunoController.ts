import { Request, Response } from "express";
import { ListSalasAlunoService } from "../../services/aluno/ListSalasAlunoService";

class ListSalasAlunoController {
    async handle(req: Request, res: Response) {
        // o aluno vem do token (preenchido pelo isAuthenticated), nunca da URL nem do corpo
        const id_aluno = Number(req.user_id);

        // ?ano_letivo= é opcional. se vier repetido o Express entrega um array;
        // juntamos em texto para o service recusar com 400
        const { ano_letivo } = req.query;

        const listSalasAlunoService = new ListSalasAlunoService();

        const salas = await listSalasAlunoService.execute({
            id_aluno,
            ano_letivo: ano_letivo === undefined ? undefined : String(ano_letivo)
        });

        res.json(salas);
    }
}

export { ListSalasAlunoController };
