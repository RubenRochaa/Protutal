import { Request, Response } from "express";
import { CreateConteudoService } from "../../services/professor/CreateConteudoService";

class CreateConteudoController {
    async handle(req: Request, res: Response) {
        // id da sala vem da URL: /salas/:id/conteudos
        const id_sala = Number(req.params.id);

        const { nome } = req.body;

        // o professor vem do token (preenchido pelo isAuthenticated),
        // nunca do corpo da requisição
        const id_professor = Number(req.user_id);

        const createConteudoService = new CreateConteudoService();

        const salaConteudo = await createConteudoService.execute({
            id_sala,
            nome,
            id_professor
        });

        res.status(201).json(salaConteudo);
    }
}

export { CreateConteudoController };
