import { Request, Response } from "express";
import { ListAlunoService } from "../../services/professor/ListAlunoService";

class ListAlunoController {
    async handle(req: Request, res: Response) {
        // ?busca= é opcional; se vier repetido (?busca=a&busca=b) o Express entrega um array, que ignoramos
        const busca = typeof req.query.busca === "string" ? req.query.busca : undefined;

        const listAlunoService = new ListAlunoService();

        const alunos = await listAlunoService.execute({
            busca
        });

        res.json(alunos);
    }
}

export { ListAlunoController };
