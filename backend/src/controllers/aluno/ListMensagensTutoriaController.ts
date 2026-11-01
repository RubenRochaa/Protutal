import { Request, Response } from "express";
import { ListMensagensTutoriaService } from "../../services/aluno/ListMensagensTutoriaService";

class ListMensagensTutoriaController {
    async handle(req: Request, res: Response) {
        // id da tutoria vem da URL: /tutorias/:id/mensagens
        const id_tutoria = Number(req.params.id);

        // o aluno vem do token (preenchido pelo isAuthenticated), nunca da URL nem do corpo
        const id_aluno = Number(req.user_id);

        // ?tipo= é opcional (só "comunicado"). se vier repetido (?tipo=a&tipo=b)
        // o Express entrega um array; juntamos em texto para o service recusar com 400
        const { tipo } = req.query;

        const listMensagensTutoriaService = new ListMensagensTutoriaService();

        const mensagens = await listMensagensTutoriaService.execute({
            id_tutoria,
            id_aluno,
            tipo: tipo === undefined ? undefined : String(tipo)
        });

        res.json(mensagens);
    }
}

export { ListMensagensTutoriaController };
