import { Request, Response } from 'express';
import { AuthProfessorService } from '../../services/professor/AuthProfessorService';

class AuthProfessorController {
    async handle(req: Request, res: Response) {
        const { email, senha } = req.body;

        const authProfessorService = new AuthProfessorService();

        const auth = await authProfessorService.execute({
            email,
            senha
        });

        res.json(auth);
    }
}

export { AuthProfessorController };
