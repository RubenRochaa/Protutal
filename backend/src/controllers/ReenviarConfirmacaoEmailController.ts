import { Request, Response } from "express";
import { ReenviarConfirmacaoEmailService } from "../services/ReenviarConfirmacaoEmailService";

class ReenviarConfirmacaoEmailController {
    async handle(req: Request, res: Response) {
        const { email } = req.body;

        const reenviarConfirmacaoEmailService = new ReenviarConfirmacaoEmailService();

        const resultado = await reenviarConfirmacaoEmailService.execute({ email });

        res.status(200).json(resultado);
    }
}

export { ReenviarConfirmacaoEmailController };
