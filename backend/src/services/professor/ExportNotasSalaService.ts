import ExcelJS from "exceljs";
import prismaClient from "../../prisma";
import { ListNotasSalaService } from "./ListNotasSalaService";
import { ROTULOS_TIPO_ATIVIDADE } from "../../helpers/rotulosTipoAtividade";

interface ExportNotasSalaRequest {
    id_sala: number;
    id_professor: number;
    etapa?: string;
    id_conteudo?: string;
    id_aluno?: string;
    id_tutor_sala?: string;
}

// exporta para Excel (RF14 / RNF10) as mesmas notas de GET /salas/:id/notas (P14).
// fora por enquanto: rubrica, desempenho do tutor (P13) e escolha de campos (UC08, passo 02)
class ExportNotasSalaService {
    async execute({ id_sala, id_professor, etapa, id_conteudo, id_aluno, id_tutor_sala }: ExportNotasSalaRequest) {

        // reaproveita a P14: validações (400 -> 404 -> 403), filtros, ordem e a consulta das notas ficam lá
        const listNotasSalaService = new ListNotasSalaService();

        const notas = await listNotasSalaService.execute({
            id_sala,
            id_professor,
            etapa,
            id_conteudo,
            id_aluno,
            id_tutor_sala
        });

        // a sala já foi validada acima; aqui só buscamos o nome e o ano letivo para o nome do arquivo
        const sala = await prismaClient.sala.findUnique({
            where: {
                id_sala: id_sala
            },
            select: {
                nome: true,
                ano_letivo: true
            }
        });

        // nome do arquivo sem acentos nem espaços: "1º Ano A" -> "1_Ano_A"
        const nomeSala = sala.nome
            .normalize("NFD")
            .replace(/[̀-ͯ]/g, "")
            .trim()
            .replace(/\s+/g, "_")
            .replace(/[^A-Za-z0-9_-]/g, "");

        const nomeArquivo = `notas_${nomeSala}_${sala.ano_letivo}.xlsx`;

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Notas");

        // numFmt define como o Excel exibe a célula; o valor continua sendo número/data (não texto)
        worksheet.columns = [
            { header: "Aluno", key: "aluno", width: 30 },
            { header: "Atividade", key: "atividade", width: 30 },
            { header: "Tipo", key: "tipo", width: 25 },
            { header: "Etapa", key: "etapa", width: 8 },
            { header: "Conteúdo", key: "conteudo", width: 25 },
            { header: "Tutor", key: "tutor", width: 30 },
            { header: "Prazo", key: "prazo", width: 12, style: { numFmt: "dd/mm/yyyy" } },
            { header: "Nota", key: "nota", width: 8, style: { numFmt: "0.00" } },
            { header: "Comentário", key: "comentario", width: 40 },
            { header: "Data de lançamento", key: "data_lancamento", width: 20, style: { numFmt: "dd/mm/yyyy" } },
            { header: "Contestação pendente", key: "contestacao_pendente", width: 22 }
        ];

        worksheet.getRow(1).font = { bold: true };

        // uma linha por nota, na mesma ordem da P14 (aluno -> etapa -> prazo);
        // sem notas, a planilha fica só com o cabeçalho
        notas.forEach((nota) => {
            worksheet.addRow({
                aluno: nota.aluno.nome,
                atividade: nota.atividade.titulo,
                tipo: ROTULOS_TIPO_ATIVIDADE[nota.atividade.tipo],
                etapa: nota.atividade.etapa,
                conteudo: nota.conteudo.nome,
                tutor: nota.tutor.nome,
                prazo: nota.atividade.data_entrega,
                nota: nota.valor,
                comentario: nota.comentario ?? "",
                data_lancamento: nota.data_lancamento,
                contestacao_pendente: nota.contestacao_pendente ? "Sim" : "Não"
            });
        });

        const buffer = Buffer.from(await workbook.xlsx.writeBuffer());

        return { buffer, nomeArquivo };
    }
}

export { ExportNotasSalaService };
