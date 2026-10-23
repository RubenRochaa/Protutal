import { Request, Response } from "express";
import { FinalizarTutoriaService } from "../../services/professor/FinalizarTutoriaService";

class FinalizarTutoriaController {
    async handle(req: Request, res: Response) {
        // id da tutoria vem da URL: /tutorias/:id/finalizar (a rota não tem corpo)
        const id_tutoria = Number(req.params.id);

        // o professor vem do token (preenchido pelo isAuthenticated),
        // nunca do corpo da requisição
        const id_professor = Number(req.user_id);

        const finalizarTutoriaService = new FinalizarTutoriaService();

        const tutoria = await finalizarTutoriaService.execute({
            id_tutoria,
            id_professor
        });

        res.json(tutoria);
    }
}

export { FinalizarTutoriaController };
