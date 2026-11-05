import { Request, Response } from "express"
import { CreateOrderService } from "../../exemplo_service/order/CreateOrderService"

class CreateOrderController {
    async handle(req: Request, res: Response) {

        const { table, name } = req.body;

        const createOrderService = new CreateOrderService();

        const order = await createOrderService.execute({ table, name, });

        return res.json(order)
    }
}

export { CreateOrderController }