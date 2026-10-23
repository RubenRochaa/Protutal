import { Request, Response } from "express";
import { ListTutoriasAlunoService } from "../../services/aluno/ListTutoriasAlunoService";

class ListTutoriasAlunoController {
    async handle(req: Request, res: Response) {
        // o aluno tutorado vem do token (preenchido pelo isAuthenticated), nunca da URL nem do corpo
        const id_aluno = Number(req.user_id);

        // ?status= é opcional. se vier repetido (?status=ativa&status=finalizada)
        // o Express entrega um array; juntamos em texto para o service recusar com 400
        const { status } = req.query;

        const listTutoriasAlunoService = new ListTutoriasAlunoService();

        const tutorias = await listTutoriasAlunoService.execute({
            id_aluno,
            status: status === undefined ? undefined : String(status)
        });

        res.json(tutorias);
    }
}

export { ListTutoriasAlunoController };
