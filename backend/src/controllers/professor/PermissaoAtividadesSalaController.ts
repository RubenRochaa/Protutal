import { Request, Response } from "express";
import { PermissaoAtividadesSalaService } from "../../services/professor/PermissaoAtividadesSalaService";

class PermissaoAtividadesSalaController {
    async handle(req: Request, res: Response) {
        // id da sala vem da URL: /salas/:id/permissao-atividades
        const id_sala = Number(req.params.id);

        const { pode_criar_ativ } = req.body;

        // o professor vem do token (preenchido pelo isAuthenticated),
        // nunca do corpo da requisição
        const id_professor = Number(req.user_id);

        const permissaoAtividadesSalaService = new PermissaoAtividadesSalaService();

        const resultado = await permissaoAtividadesSalaService.execute({
            id_sala,
            pode_criar_ativ,
            id_professor
        });

        res.json(resultado);
    }
}

export { PermissaoAtividadesSalaController };
