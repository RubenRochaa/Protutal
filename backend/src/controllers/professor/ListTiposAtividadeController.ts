import { Request, Response } from "express";
import { ListTiposAtividadeService } from "../../services/professor/ListTiposAtividadeService";

class ListTiposAtividadeController {
    async handle(req: Request, res: Response) {
        const listTiposAtividadeService = new ListTiposAtividadeService();

        const tipos = await listTiposAtividadeService.execute();

        res.json(tipos);
    }
}

export { ListTiposAtividadeController };
