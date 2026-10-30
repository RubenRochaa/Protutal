import { Request, Response } from "express";
import { RedefinirSenhaService } from "../services/RedefinirSenhaService";

class RedefinirSenhaController {
    async handle(req: Request, res: Response) {
        const { token, senha } = req.body;

        const redefinirSenhaService = new RedefinirSenhaService();

        const resultado = await redefinirSenhaService.execute({ token, senha });

        res.status(200).json(resultado);
    }
}

export { RedefinirSenhaController };
