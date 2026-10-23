import { Request, Response } from "express";
import { CreatePedidoTutoriaService } from "../../services/aluno/CreatePedidoTutoriaService";

class CreatePedidoTutoriaController {
    async handle(req: Request, res: Response) {
        const { id_sala } = req.body;

        // o aluno vem do token (preenchido pelo isAuthenticated),
        // nunca do corpo da requisição
        const id_aluno = Number(req.user_id);

        const createPedidoTutoriaService = new CreatePedidoTutoriaService();

        const pedido = await createPedidoTutoriaService.execute({
            id_aluno,
            id_sala
        });

        res.status(201).json(pedido);
    }
}

export { CreatePedidoTutoriaController };
