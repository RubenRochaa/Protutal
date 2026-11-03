import { Request, Response } from "express";
import { SolicitarRedefinicaoSenhaService } from "../services/SolicitarRedefinicaoSenhaService";

class SolicitarRedefinicaoSenhaController {
    async handle(req: Request, res: Response) {
        const { email } = req.body;

        const solicitarRedefinicaoSenhaService = new SolicitarRedefinicaoSenhaService();

        const resultado = await solicitarRedefinicaoSenhaService.execute({ email });

        res.status(200).json(resultado);
    }
}

export { SolicitarRedefinicaoSenhaController };
