import { Request, Response } from "express";
import { CreateMensagemService } from "../../services/aluno/CreateMensagemService";

class CreateMensagemController {
    async handle(req: Request, res: Response) {
        // id da tutoria vem da URL: /tutorias/:id/mensagens
        const id_tutoria = Number(req.params.id);

        // texto é obrigatório; assunto é opcional (preenchido = comunicado do tutor)
        const { texto, assunto } = req.body;

        // o remetente vem do token (preenchido pelo isAuthenticated),
        // nunca do corpo da requisição
        const id_aluno = Number(req.user_id);

        const createMensagemService = new CreateMensagemService();

        const mensagem = await createMensagemService.execute({
            id_tutoria,
            id_aluno,
            texto,
            assunto
        });

        res.status(201).json(mensagem);
    }
}

export { CreateMensagemController };
