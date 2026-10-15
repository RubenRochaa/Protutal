import { Request, Response } from "express";
import { AceitarPedidoTutoriaService } from "../../services/professor/AceitarPedidoTutoriaService";

class AceitarPedidoTutoriaController {
    async handle(req: Request, res: Response) {
        // id do pedido vem da URL: /pedidos-tutoria/:id/aceitar
        const id_pedido = Number(req.params.id);

        const { id_sala } = req.body;

        // o professor vem do token (preenchido pelo isAuthenticated),
        // nunca do corpo da requisição
        const id_professor = Number(req.user_id);

        const aceitarPedidoTutoriaService = new AceitarPedidoTutoriaService();

        const resultado = await aceitarPedidoTutoriaService.execute({
            id_pedido,
            id_sala,
            id_professor
        });

        res.json(resultado);
    }
}

export { AceitarPedidoTutoriaController };
