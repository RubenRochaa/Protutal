import { Request, Response } from "express";
import { CreateFeedbackService } from "../../services/aluno/CreateFeedbackService";

class CreateFeedbackController {
    async handle(req: Request, res: Response) {
        // id da tutoria vem da URL: /tutorias/:id/feedbacks
        const id_tutoria = Number(req.params.id);

        // a requisição é multipart (form-data): o express-fileupload coloca
        // os campos de texto em req.body e os arquivos em req.files
        const { etapa, nota, comentario } = req.body;
        const file = req.files?.["file"];

        // o aluno tutorado vem do token (preenchido pelo isAuthenticated), nunca do corpo
        const id_aluno = Number(req.user_id);

        const createFeedbackService = new CreateFeedbackService();

        const feedback = await createFeedbackService.execute({
            id_tutoria,
            id_aluno,
            etapa,
            nota,
            comentario,
            file
        });

        res.status(201).json(feedback);
    }
}

export { CreateFeedbackController };
