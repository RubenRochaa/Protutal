import { Request, Response } from "express"
import { RemoveOrderService } from "../../services/order/RemoveOrderService"

class RemoveOrderController {
    async handle(req: Request, res: Response) {
        // const order_id = req.query.order_id as string;

        const order_id = (req.params.order_id ?? req.query.order_id ?? req.body.order_id) as string; // fiz essa alteração pois o id não estava sendo identificado, mesmo sendo colocado da maneira correta. Erro: "`where` of type OrderWhereUniqueInput needs at least one of `id` arguments. Available options are marked with"

        const removeOrder = new RemoveOrderService();

        const order = await removeOrder.execute({ order_id });

        res.json(order);
    }
}

export { RemoveOrderController }