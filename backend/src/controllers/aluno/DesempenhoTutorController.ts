import { Request, Response } from "express";
import { DesempenhoTutorService } from "../../services/aluno/DesempenhoTutorService";

class DesempenhoTutorController {
    async handle(req: Request, res: Response) {
        // o tutor é o aluno do token (preenchido pelo isAuthenticated), nunca da URL nem do corpo
        const id_aluno = Number(req.user_id);
        const email = req.user_email;

        // ?id_sala= é opcional. se vier repetido (?id_sala=1&id_sala=2)
        // o Express entrega um array; juntamos em texto para o service recusar com 400
        const { id_sala } = req.query;

        const desempenhoTutorService = new DesempenhoTutorService();

        const desempenho = await desempenhoTutorService.execute({
            id_aluno,
            email,
            id_sala: id_sala === undefined ? undefined : String(id_sala)
        });

        res.json(desempenho);
    }
}

export { DesempenhoTutorController };
