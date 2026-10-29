import { Request, Response } from "express";
import { DesempenhoAlunoService } from "../../services/aluno/DesempenhoAlunoService";

class DesempenhoAlunoController {
    async handle(req: Request, res: Response) {
        // o aluno vem do token (preenchido pelo isAuthenticated), nunca da URL nem do corpo
        const id_aluno = Number(req.user_id);

        // ?id_sala= e ?etapa= são opcionais. se vierem repetidos (?etapa=1&etapa=2)
        // o Express entrega um array; juntamos em texto para o service recusar com 400
        const { id_sala, etapa } = req.query;

        const desempenhoAlunoService = new DesempenhoAlunoService();

        const desempenho = await desempenhoAlunoService.execute({
            id_aluno,
            id_sala: id_sala === undefined ? undefined : String(id_sala),
            etapa: etapa === undefined ? undefined : String(etapa)
        });

        res.json(desempenho);
    }
}

export { DesempenhoAlunoController };
