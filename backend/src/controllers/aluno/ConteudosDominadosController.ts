import { Request, Response } from "express";
import { ConteudosDominadosService } from "../../services/aluno/ConteudosDominadosService";

class ConteudosDominadosController {
    async handle(req: Request, res: Response) {
        // o aluno vem do token (preenchido pelo isAuthenticated), nunca da URL nem do corpo
        const id_aluno = Number(req.user_id);

        // ?id_sala= é opcional. se vier repetido (?id_sala=1&id_sala=2) o Express
        // entrega um array; juntamos em texto para o service recusar com 400
        const { id_sala } = req.query;

        const conteudosDominadosService = new ConteudosDominadosService();

        const conteudos = await conteudosDominadosService.execute({
            id_aluno,
            id_sala: id_sala === undefined ? undefined : String(id_sala)
        });

        res.json(conteudos);
    }
}

export { ConteudosDominadosController };
