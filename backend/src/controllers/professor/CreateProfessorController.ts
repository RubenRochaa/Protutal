import { Request, Response } from "express";
import { CreateProfessorService } from "../../services/professor/CreateProfessorService";


class CreateProfessorController {
    async handle(req: Request, res: Response) {
        const { nome, email, senha } = req.body;

        const createProfessorService = new CreateProfessorService();

        const professor = await createProfessorService.execute({
            nome,
            email,
            senha
        });

        res.status(201).json(professor)
    }
}

export { CreateProfessorController }
