import { Request, Response } from "express";
import { RecusarPedidoTutoriaService } from "../../services/professor/RecusarPedidoTutoriaService";

class RecusarPedidoTutoriaController {
    async handle(req: Request, res: Response) {
        // id do pedido vem da URL: /pedidos-tutoria/:id/recusar
        const id_pedido = Number(req.params.id);

        // o professor vem do token (preenchido pelo isAuthenticated),
        // nunca do corpo da requisição
        const id_professor = Number(req.user_id);

        const recusarPedidoTutoriaService = new RecusarPedidoTutoriaService();

        const resultado = await recusarPedidoTutoriaService.execute({
            id_pedido,
            id_professor
        });

        res.json(resultado);
    }
}

export { RecusarPedidoTutoriaController };
