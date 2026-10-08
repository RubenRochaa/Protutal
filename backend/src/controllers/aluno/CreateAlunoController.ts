import { Request, Response } from "express";
import { CreateAlunoService } from "../../services/aluno/CreateAlunoService";


class CreateAlunoController {
    async handle(req: Request, res: Response) {
        const { nome, email, senha } = req.body;

        const createAlunoService = new CreateAlunoService();

        const aluno = await createAlunoService.execute({
            nome,
            email,
            senha
        });

        res.status(201).json(aluno)
    }
}

export { CreateAlunoController }
