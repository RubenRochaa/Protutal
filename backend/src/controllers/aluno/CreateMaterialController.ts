import { Request, Response } from "express";
import { CreateMaterialService } from "../../services/aluno/CreateMaterialService";

class CreateMaterialController {
    async handle(req: Request, res: Response) {
        // id da sala vem da URL: /salas/:id/materiais
        const id_sala = Number(req.params.id);

        // a requisição é multipart (form-data): o express-fileupload coloca
        // os campos de texto em req.body e os arquivos em req.files
        const { titulo, descricao } = req.body;
        const file = req.files?.["file"];

        // o tutor vem do token (preenchido pelo isAuthenticated), nunca do corpo
        const id_aluno = Number(req.user_id);
        const email = req.user_email;

        const createMaterialService = new CreateMaterialService();

        const material = await createMaterialService.execute({
            id_aluno,
            email,
            id_sala,
            titulo,
            descricao,
            file
        });

        res.status(201).json(material);
    }
}

export { CreateMaterialController };
