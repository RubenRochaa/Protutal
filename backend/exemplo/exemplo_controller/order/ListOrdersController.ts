import { Request, Response } from "express"
import { ListOrdersService } from "../../exemplo_service/order/ListOrdersService";

class ListOrdersController {
    async handle(req: Request, res: Response) {
        const listOrderService = new ListOrdersService();

        const orders = await listOrderService.execute();

        res.json(orders);
    }
}

export { ListOrdersController }