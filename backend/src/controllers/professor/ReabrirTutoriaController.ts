import { Request, Response } from "express";
import { ReabrirTutoriaService } from "../../services/professor/ReabrirTutoriaService";

class ReabrirTutoriaController {
    async handle(req: Request, res: Response) {
        // id da tutoria vem da URL: /tutorias/:id/reabrir (a rota não tem corpo)
        const id_tutoria = Number(req.params.id);

        // o professor vem do token (preenchido pelo isAuthenticated),
        // nunca do corpo da requisição
        const id_professor = Number(req.user_id);

        const reabrirTutoriaService = new ReabrirTutoriaService();

        const tutoria = await reabrirTutoriaService.execute({
            id_tutoria,
            id_professor
        });

        res.json(tutoria);
    }
}

export { ReabrirTutoriaController };
