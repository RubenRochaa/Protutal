import { Request, Response } from "express";
import { CreateAvisoService } from "../../services/professor/CreateAvisoService";

class CreateAvisoController {
    async handle(req: Request, res: Response) {
        // id da sala vem da URL: /salas/:id/avisos
        const id_sala = Number(req.params.id);

        const { titulo, conteudo } = req.body;

        // o professor vem do token (preenchido pelo isAuthenticated),
        // nunca do corpo da requisição
        const id_professor = Number(req.user_id);

        const createAvisoService = new CreateAvisoService();

        const aviso = await createAvisoService.execute({
            id_sala,
            id_professor,
            titulo,
            conteudo
        });

        res.status(201).json(aviso);
    }
}

export { CreateAvisoController };
