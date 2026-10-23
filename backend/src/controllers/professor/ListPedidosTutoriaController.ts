import { Request, Response } from "express";
import { ListPedidosTutoriaService } from "../../services/professor/ListPedidosTutoriaService";

class ListPedidosTutoriaController {
    async handle(req: Request, res: Response) {
        // o professor vem do token (preenchido pelo isAuthenticated)
        const id_professor = Number(req.user_id);

        const listPedidosTutoriaService = new ListPedidosTutoriaService();

        const pedidos = await listPedidosTutoriaService.execute({
            id_professor
        });

        res.json(pedidos);
    }
}

export { ListPedidosTutoriaController };
