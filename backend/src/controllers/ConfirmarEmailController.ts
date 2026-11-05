import { Request, Response } from "express";
import { ConfirmarEmailService } from "../services/ConfirmarEmailService";
import { AppError } from "../errors/AppError";

// página HTML simples: o link é aberto pelo navegador, então a resposta não é JSON.
// as mensagens são fixas (vêm do service), sem dado digitado pelo usuário
function paginaConfirmacao(mensagem: string) {
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Protutal</title>
</head>
<body style="font-family: Arial, sans-serif; text-align: center; padding: 40px 16px;">
    <h1>Protutal</h1>
    <p>${mensagem}</p>
</body>
</html>`;
}

class ConfirmarEmailController {
    async handle(req: Request, res: Response) {
        // token vem da URL: /confirmacao-email/:token
        const token = String(req.params.token);

        const confirmarEmailService = new ConfirmarEmailService();

        // o handler global do server.ts responde JSON; aqui os erros esperados (400 e 410)
        // viram página HTML. Qualquer outro erro segue para o handler global (500)
        try {
            const { mensagem } = await confirmarEmailService.execute({ token });

            res.status(200).type("html").send(paginaConfirmacao(mensagem));
        } catch (err) {
            if (err instanceof AppError) {
                res.status(err.statusCode).type("html").send(paginaConfirmacao(err.message));
                return;
            }

            throw err;
        }
    }
}

export { ConfirmarEmailController };
