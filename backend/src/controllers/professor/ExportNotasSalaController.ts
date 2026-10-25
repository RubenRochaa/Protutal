import { Request, Response } from "express";
import { ExportNotasSalaService } from "../../services/professor/ExportNotasSalaService";

class ExportNotasSalaController {
    async handle(req: Request, res: Response) {
        // id da sala vem da URL: /salas/:id/notas/exportar
        const id_sala = Number(req.params.id);

        // o professor vem do token (preenchido pelo isAuthenticated)
        const id_professor = Number(req.user_id);

        // mesmos filtros opcionais da P14 (GET /salas/:id/notas); repetidos viram texto para o service recusar com 400
        const { etapa, id_conteudo, id_aluno, id_tutor_sala } = req.query;

        const exportNotasSalaService = new ExportNotasSalaService();

        const { buffer, nomeArquivo } = await exportNotasSalaService.execute({
            id_sala,
            id_professor,
            etapa: etapa === undefined ? undefined : String(etapa),
            id_conteudo: id_conteudo === undefined ? undefined : String(id_conteudo),
            id_aluno: id_aluno === undefined ? undefined : String(id_aluno),
            id_tutor_sala: id_tutor_sala === undefined ? undefined : String(id_tutor_sala)
        });

        // devolve o arquivo .xlsx para download (attachment), não JSON
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", `attachment; filename="${nomeArquivo}"`);

        res.send(buffer);
    }
}

export { ExportNotasSalaController };
