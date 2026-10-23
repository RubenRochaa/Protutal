import { Request, Response } from "express";
import { CreateRespostaService } from "../../services/aluno/CreateRespostaService";

class CreateRespostaController {
    async handle(req: Request, res: Response) {
        // id da atividade vem da URL: /atividades/:id/respostas
        const id_atividade = Number(req.params.id);

        // a requisição é multipart (form-data): o express-fileupload coloca
        // os campos de texto em req.body e os arquivos em req.files
        const { texto } = req.body;
        const file = req.files?.["file"];

        // o aluno (tutorado) vem do token (preenchido pelo isAuthenticated),
        // nunca do corpo da requisição
        const id_aluno = Number(req.user_id);

        const createRespostaService = new CreateRespostaService();

        const resposta = await createRespostaService.execute({
            id_aluno,
            id_atividade,
            texto,
            file
        });

        res.status(201).json(resposta);
    }
}

export { CreateRespostaController };
