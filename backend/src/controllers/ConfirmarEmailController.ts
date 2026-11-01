import { Request, Response } from "express";
import { ConfirmarEmailService } from "../services/ConfirmarEmailService";
import { AppError } from "../errors/AppError";
// página HTML com o visual do Protutal: o link é aberto pelo navegador, então a resposta não é JSON
import { paginaConfirmacao } from "../templates/email/paginaConfirmacao";

class ConfirmarEmailController {
    async handle(req: Request, res: Response) {
        // token vem da URL: /confirmacao-email/:token
        const token = String(req.params.token);

        const confirmarEmailService = new ConfirmarEmailService();

        // o handler global do server.ts responde JSON; aqui os erros esperados (400 e 410)
        // viram página HTML. Qualquer outro erro segue para o handler global (500)
        try {
            const { mensagem } = await confirmarEmailService.execute({ token });

            res.status(200).type("html").send(paginaConfirmacao(mensagem, true));
        } catch (err) {
            if (err instanceof AppError) {
                res.status(err.statusCode).type("html").send(paginaConfirmacao(err.message, false));
                return;
            }

            throw err;
        }
    }
}

export { ConfirmarEmailController };
