import { Request, Response } from "express";
import { ResolverContestacaoService } from "../../services/professor/ResolverContestacaoService";

class ResolverContestacaoController {
    async handle(req: Request, res: Response) {
        // id da contestação vem da URL: /contestacoes/:id/resolver
        const id_contestacao = Number(req.params.id);

        // o usuário (professor ou tutor) vem do token, preenchido pelo isAuthenticated
        const id_usuario = Number(req.user_id);
        const email = req.user_email;

        // os tipos do corpo são conferidos no service
        const { status, decisao, valor } = req.body ?? {};

        const resolverContestacaoService = new ResolverContestacaoService();

        const contestacao = await resolverContestacaoService.execute({
            id_contestacao,
            id_usuario,
            email,
            status,
            decisao,
            valor
        });

        res.json(contestacao);
    }
}

export { ResolverContestacaoController };
