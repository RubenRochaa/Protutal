import { Request, Response } from 'express';
import { AuthAlunoService } from '../../services/aluno/AuthAlunoService';

class AuthAlunoController {
    async handle(req: Request, res: Response) {
        const { email, senha } = req.body;

        const authAlunoService = new AuthAlunoService();

        const auth = await authAlunoService.execute({
            email,
            senha
        });

        res.json(auth);
    }
}

export { AuthAlunoController };
