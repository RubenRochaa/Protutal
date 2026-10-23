import { Request, Response } from "express";
import { ListTutoriasTutorService } from "../../services/aluno/ListTutoriasTutorService";

class ListTutoriasTutorController {
    async handle(req: Request, res: Response) {
        // o tutor é o aluno do token (preenchido pelo isAuthenticated), nunca da URL nem do corpo
        const id_aluno = Number(req.user_id);

        // ?status= é opcional. se vier repetido (?status=ativa&status=finalizada)
        // o Express entrega um array; juntamos em texto para o service recusar com 400
        const { status } = req.query;

        const listTutoriasTutorService = new ListTutoriasTutorService();

        const tutorias = await listTutoriasTutorService.execute({
            id_aluno,
            status: status === undefined ? undefined : String(status)
        });

        res.json(tutorias);
    }
}

export { ListTutoriasTutorController };
