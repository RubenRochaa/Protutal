import { describe, it, expect, jest, afterEach } from "@jest/globals";
import ExcelJS from "exceljs";
import { prismaMock } from "../../mocks/prisma";
import { esperaAppErrorAsync } from "../../utils";
import { Prisma } from "../../../generated/prisma";
import { MENSAGEM_SEM_PERMISSAO_SALA } from "../../../helpers/buscarSalaDoProfessor";
import { CreateAvaliacaoTutorService } from "../../../services/professor/CreateAvaliacaoTutorService";
import { ListTutoriasSalaService } from "../../../services/professor/ListTutoriasSalaService";
import { UpdateMetaTutoriaService } from "../../../services/professor/UpdateMetaTutoriaService";
import { ExportNotasSalaService } from "../../../services/professor/ExportNotasSalaService";
import { FinalizarTutoriaService } from "../../../services/professor/FinalizarTutoriaService";
import { ListAvisosSalaService } from "../../../services/professor/ListAvisosSalaService";
import { CreateConteudoService } from "../../../services/professor/CreateConteudoService";
import { ListRespostasAtividadeService } from "../../../services/professor/ListRespostasAtividadeService";
import { ListNotasSalaService } from "../../../services/professor/ListNotasSalaService";

jest.mock("../../../services/professor/ListNotasSalaService");

const ID_PROFESSOR = 10;
const AGORA = new Date("2026-11-06T12:00:00Z");

function salaDoProfessor(id_professor = ID_PROFESSOR) {
    prismaMock.sala.findUnique.mockResolvedValue({ id_sala: 1, id_professor } as any);
}

afterEach(() => jest.useRealTimers());

describe("CreateAvaliacaoTutorService", () => {
    const executar = (dados: any = {}) => new CreateAvaliacaoTutorService().execute({ id_tutor_sala: 3, id_professor: ID_PROFESSOR, nota: 8.5, comentario: "Bom", ...dados });
    const tutorSala = { id_tutor_sala: 3, sala: { id_professor: ID_PROFESSOR } };

    it.each([
        [{ id_tutor_sala: 0 }, "O id do tutor da sala deve ser um número inteiro"],
        [{ nota: "8" }, "O campo nota é obrigatório e deve ser um número"],
        [{ nota: NaN }, "O campo nota é obrigatório e deve ser um número"],
        [{ nota: 11 }, "A nota deve estar entre 0 e 10"],
        [{ nota: 7.123 }, "A nota deve ter no máximo 2 casas decimais"],
        [{ comentario: " " }, "O campo comentario é obrigatório e não pode ser vazio"],
    ])("400 com %p", async (dados, mensagem) => {
        await esperaAppErrorAsync(executar(dados), mensagem, 400);
    });

    it("404 / 403", async () => {
        prismaMock.tutor_sala.findUnique.mockResolvedValue(null);
        await esperaAppErrorAsync(executar(), "Tutor da sala não encontrado", 404);
        prismaMock.tutor_sala.findUnique.mockResolvedValue({ ...tutorSala, sala: { id_professor: 99 } } as any);
        await esperaAppErrorAsync(executar(), MENSAGEM_SEM_PERMISSAO_SALA, 403);
    });

    it("cria a avaliação e devolve a nota como número", async () => {
        prismaMock.tutor_sala.findUnique.mockResolvedValue(tutorSala as any);
        prismaMock.avaliacao_tutor.create.mockResolvedValue({ id_avaliacao: 1, nota: new Prisma.Decimal("8.5") } as any);

        const resultado = await executar({ comentario: " Bom " });
        expect(resultado.nota).toBe(8.5);
        expect(prismaMock.avaliacao_tutor.create).toHaveBeenCalledWith(expect.objectContaining({
            data: { id_tutor_sala: 3, id_professor: ID_PROFESSOR, nota: 8.5, comentario: "Bom" }
        }));
    });
});

describe("ListTutoriasSalaService", () => {
    const executar = (dados: any = {}) => new ListTutoriasSalaService().execute({ id_sala: 1, id_professor: ID_PROFESSOR, ...dados });

    it("400 com status inválido (só ativa ou finalizada)", async () => {
        await esperaAppErrorAsync(executar({ status: "pausada" }), "O status deve ser ativa ou finalizada", 400);
    });

    it("400 / 404 / 403 da sala", async () => {
        await esperaAppErrorAsync(executar({ id_sala: 0 }), "O id da sala deve ser um número inteiro", 400);
        prismaMock.sala.findUnique.mockResolvedValue(null);
        await esperaAppErrorAsync(executar(), "Sala não encontrada", 404);
        salaDoProfessor(99);
        await esperaAppErrorAsync(executar(), MENSAGEM_SEM_PERMISSAO_SALA, 403);
    });

    it("lista com filtro de status e achata o tutor", async () => {
        salaDoProfessor();
        prismaMock.tutoria.findMany.mockResolvedValue([{
            id_tutoria: 1, status: "ativa", meta_aprendizagem: "M", data_inicio: AGORA, data_fim: null,
            tutor_sala: { tutor: { aluno: { nome: "Tutor" } } }, aluno: { nome: "Aluno" }
        }] as any);

        await expect(executar({ status: "ativa" })).resolves.toEqual([{
            id_tutoria: 1, status: "ativa", meta_aprendizagem: "M", data_inicio: AGORA, data_fim: null, tutor: { nome: "Tutor" }, aluno: { nome: "Aluno" }
        }]);
        expect(prismaMock.tutoria.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { tutor_sala: { id_sala: 1 }, status: "ativa" } }));
    });
});

describe("UpdateMetaTutoriaService", () => {
    const executar = (dados: any = {}) => new UpdateMetaTutoriaService().execute({ id_tutoria: 2, id_professor: ID_PROFESSOR, meta_aprendizagem: "Nova meta", ...dados });
    const tutoria = (status = "ativa", id_professor = ID_PROFESSOR) => ({ id_tutoria: 2, status, tutor_sala: { sala: { id_professor } } });
    const FINALIZADA = "Esta tutoria está finalizada. É preciso reabrir a tutoria antes de alterar a meta";

    it("400 / 404 / 403", async () => {
        await esperaAppErrorAsync(executar({ id_tutoria: 0 }), "O id da tutoria deve ser um número inteiro", 400);
        prismaMock.tutoria.findUnique.mockResolvedValue(null);
        await esperaAppErrorAsync(executar(), "Tutoria não encontrada", 404);
        prismaMock.tutoria.findUnique.mockResolvedValue(tutoria("ativa", 99) as any);
        await esperaAppErrorAsync(executar(), MENSAGEM_SEM_PERMISSAO_SALA, 403);
    });

    it("400 com meta vazia", async () => {
        prismaMock.tutoria.findUnique.mockResolvedValue(tutoria() as any);
        await esperaAppErrorAsync(executar({ meta_aprendizagem: " " }), "O campo meta_aprendizagem é obrigatório", 400);
    });

    it("409 com tutoria finalizada (antes e durante a atualização)", async () => {
        prismaMock.tutoria.findUnique.mockResolvedValue(tutoria("finalizada") as any);
        await esperaAppErrorAsync(executar(), FINALIZADA, 409);

        prismaMock.tutoria.findUnique.mockResolvedValue(tutoria() as any);
        prismaMock.tutoria.updateMany.mockResolvedValue({ count: 0 });
        await esperaAppErrorAsync(executar(), FINALIZADA, 409);
    });

    it("atualiza a meta sem espaços extras", async () => {
        prismaMock.tutoria.findUnique
            .mockResolvedValueOnce(tutoria() as any)
            .mockResolvedValueOnce({ id_tutoria: 2, status: "ativa", meta_aprendizagem: "Nova meta" } as any);
        prismaMock.tutoria.updateMany.mockResolvedValue({ count: 1 });

        await expect(executar({ meta_aprendizagem: "  Nova meta " })).resolves.toEqual({ id_tutoria: 2, status: "ativa", meta_aprendizagem: "Nova meta" });
        expect(prismaMock.tutoria.updateMany).toHaveBeenCalledWith({ where: { id_tutoria: 2, status: "ativa" }, data: { meta_aprendizagem: "Nova meta" } });
    });
});

describe("FinalizarTutoriaService", () => {
    const executar = (id_tutoria = 2) => new FinalizarTutoriaService().execute({ id_tutoria, id_professor: ID_PROFESSOR });
    const tutoria = (status = "ativa", id_professor = ID_PROFESSOR) => ({ id_tutoria: 2, status, id_aluno: 20, id_tutor_sala: 3, tutor_sala: { sala: { id_professor } } });

    it("400 / 404 / 403 / 409 já finalizada", async () => {
        await esperaAppErrorAsync(executar(0), "O id da tutoria deve ser um número inteiro", 400);
        prismaMock.tutoria.findUnique.mockResolvedValue(null);
        await esperaAppErrorAsync(executar(), "Tutoria não encontrada", 404);
        prismaMock.tutoria.findUnique.mockResolvedValue(tutoria("ativa", 99) as any);
        await esperaAppErrorAsync(executar(), MENSAGEM_SEM_PERMISSAO_SALA, 403);
        prismaMock.tutoria.findUnique.mockResolvedValue(tutoria("finalizada") as any);
        await esperaAppErrorAsync(executar(), "Esta tutoria já está finalizada", 409);
    });

    it("409 com contestações pendentes (singular e plural)", async () => {
        prismaMock.tutoria.findUnique.mockResolvedValue(tutoria() as any);
        prismaMock.contestacao_nota.count.mockResolvedValue(1);
        await esperaAppErrorAsync(executar(), "Não é possível finalizar a tutoria: há 1 contestação de nota pendente", 409);
        prismaMock.contestacao_nota.count.mockResolvedValue(3);
        await esperaAppErrorAsync(executar(), "Não é possível finalizar a tutoria: há 3 contestações de nota pendentes", 409);
    });

    it("409 se finalizada ao mesmo tempo por outra requisição", async () => {
        prismaMock.tutoria.findUnique.mockResolvedValue(tutoria() as any);
        prismaMock.contestacao_nota.count.mockResolvedValue(0);
        prismaMock.tutoria.updateMany.mockResolvedValue({ count: 0 });
        await esperaAppErrorAsync(executar(), "Esta tutoria já está finalizada", 409);
    });

    it("finaliza com data_fim = agora", async () => {
        jest.useFakeTimers().setSystemTime(AGORA);
        prismaMock.tutoria.findUnique
            .mockResolvedValueOnce(tutoria() as any)
            .mockResolvedValueOnce({ id_tutoria: 2, status: "finalizada", data_fim: AGORA } as any);
        prismaMock.contestacao_nota.count.mockResolvedValue(0);
        prismaMock.tutoria.updateMany.mockResolvedValue({ count: 1 });

        await expect(executar()).resolves.toEqual({ id_tutoria: 2, status: "finalizada", data_fim: AGORA });
        expect(prismaMock.tutoria.updateMany).toHaveBeenCalledWith({ where: { id_tutoria: 2, status: "ativa" }, data: { status: "finalizada", data_fim: AGORA } });
    });
});

describe("ListAvisosSalaService", () => {
    const executar = (dados: any = {}) => new ListAvisosSalaService().execute({ id_sala: 1, id_usuario: 10, email: "u@x", ...dados });

    it("400 / 404 / 403 sem e-mail", async () => {
        await esperaAppErrorAsync(executar({ id_sala: 0 }), "O id da sala deve ser um número inteiro", 400);
        prismaMock.sala.findUnique.mockResolvedValue(null);
        await esperaAppErrorAsync(executar(), "Sala não encontrada", 404);
        salaDoProfessor();
        await esperaAppErrorAsync(executar({ email: "" }), MENSAGEM_SEM_PERMISSAO_SALA, 403);
    });

    it("professor dono vê os avisos", async () => {
        salaDoProfessor();
        prismaMock.professor.findFirst.mockResolvedValue({ id_professor: ID_PROFESSOR } as any);
        prismaMock.aviso.findMany.mockResolvedValue([{ id_aviso: 1 }] as any);
        await expect(executar()).resolves.toEqual([{ id_aviso: 1 }]);
    });

    it("403 para professor que não é dono", async () => {
        salaDoProfessor(99);
        prismaMock.professor.findFirst.mockResolvedValue({ id_professor: ID_PROFESSOR } as any);
        await esperaAppErrorAsync(executar(), MENSAGEM_SEM_PERMISSAO_SALA, 403);
    });

    it("aluno matriculado vê; não matriculado recebe 403", async () => {
        salaDoProfessor();
        prismaMock.professor.findFirst.mockResolvedValue(null);
        prismaMock.matricula.findFirst.mockResolvedValue({ id_matricula: 1 } as any);
        prismaMock.aviso.findMany.mockResolvedValue([]);
        await expect(executar()).resolves.toEqual([]);

        prismaMock.matricula.findFirst.mockResolvedValue(null);
        await esperaAppErrorAsync(executar(), MENSAGEM_SEM_PERMISSAO_SALA, 403);
    });
});

describe("CreateConteudoService", () => {
    const executar = (nome: any = "Clima", id_sala = 1) => new CreateConteudoService().execute({ id_sala, nome, id_professor: ID_PROFESSOR });

    it("400 / 404 / 403 da sala", async () => {
        await esperaAppErrorAsync(executar("Clima", 0), "O id da sala deve ser um número inteiro", 400);
        prismaMock.sala.findUnique.mockResolvedValue(null);
        await esperaAppErrorAsync(executar(), "Sala não encontrada", 404);
        salaDoProfessor(99);
        await esperaAppErrorAsync(executar(), MENSAGEM_SEM_PERMISSAO_SALA, 403);
    });

    it("400 com nome vazio ou longo", async () => {
        salaDoProfessor();
        await esperaAppErrorAsync(executar(" "), "O campo nome é obrigatório", 400);
        await esperaAppErrorAsync(executar("a".repeat(101)), "O nome deve ter no máximo 100 caracteres", 400);
    });

    it("cria conteúdo novo quando o nome não existe", async () => {
        salaDoProfessor();
        prismaMock.conteudo.findFirst.mockResolvedValue(null);
        prismaMock.sala_conteudo.create.mockResolvedValue({ id_sala_conteudo: 1 } as any);

        await expect(executar(" Clima ")).resolves.toEqual({ id_sala_conteudo: 1 });
        expect((prismaMock.sala_conteudo.create.mock.calls[0] as any)[0].data.conteudo).toEqual({ create: { nome: "Clima" } });
    });

    it("reaproveita conteúdo existente (busca sem diferenciar maiúsculas)", async () => {
        salaDoProfessor();
        prismaMock.conteudo.findFirst.mockResolvedValue({ id_conteudo: 7 } as any);
        prismaMock.sala_conteudo.findUnique.mockResolvedValue(null);
        prismaMock.sala_conteudo.create.mockResolvedValue({ id_sala_conteudo: 2 } as any);

        await executar("clima");
        expect(prismaMock.conteudo.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { nome: { equals: "clima", mode: "insensitive" } } }));
        expect((prismaMock.sala_conteudo.create.mock.calls[0] as any)[0].data.conteudo).toEqual({ connect: { id_conteudo: 7 } });
    });

    it("409 quando já está na sala", async () => {
        salaDoProfessor();
        prismaMock.conteudo.findFirst.mockResolvedValue({ id_conteudo: 7 } as any);
        prismaMock.sala_conteudo.findUnique.mockResolvedValue({ id_sala_conteudo: 1 } as any);
        await esperaAppErrorAsync(executar(), "Conteúdo já cadastrado nesta sala", 409);
    });

    it("409 quando o banco acusa duplicidade (P2002); outros erros sobem", async () => {
        salaDoProfessor();
        prismaMock.conteudo.findFirst.mockResolvedValue(null);
        prismaMock.sala_conteudo.create.mockRejectedValue(new Prisma.PrismaClientKnownRequestError("dup", { code: "P2002", clientVersion: "6" }));
        await esperaAppErrorAsync(executar(), "Conteúdo já cadastrado nesta sala", 409);

        prismaMock.sala_conteudo.create.mockRejectedValue(new Error("banco fora"));
        await expect(executar()).rejects.toThrow("banco fora");
    });
});

describe("ListRespostasAtividadeService", () => {
    const executar = (id_atividade = 4) => new ListRespostasAtividadeService().execute({ id_atividade });
    const prazo = new Date("2026-11-10T00:00:00Z");

    it("400 / 404", async () => {
        await esperaAppErrorAsync(executar(0), "O id da atividade deve ser um número inteiro", 400);
        prismaMock.atividade.findUnique.mockResolvedValue(null);
        await esperaAppErrorAsync(executar(), "Atividade não encontrada", 404);
    });

    it("monta status, resposta e nota de cada destinatário", async () => {
        prismaMock.atividade.findUnique.mockResolvedValue({
            id_atividade: 4, titulo: "T", tipo: "projeto", data_entrega: prazo,
            destinatarios: [
                { tutoria: { aluno: { id_aluno: 1, nome: "Ana", respostas: [{ id_resposta: 9, data_envio: new Date("2026-11-09") }], notas: [{ id_nota: 3, valor: new Prisma.Decimal("7.5"), comentario: null }] } } },
                { tutoria: { aluno: { id_aluno: 2, nome: "Bia", respostas: [], notas: [] } } },
                { tutoria: { aluno: { id_aluno: 3, nome: "Caio", respostas: [{ id_resposta: 10, data_envio: new Date("2026-11-12") }], notas: [] } } }
            ]
        } as any);

        const { alunos } = await executar();

        expect(alunos[0]).toEqual({ aluno: { id_aluno: 1, nome: "Ana" }, resposta: expect.objectContaining({ id_resposta: 9 }), nota: { id_nota: 3, valor: 7.5, comentario: null }, status: "entregue" });
        expect(alunos[1]).toEqual({ aluno: { id_aluno: 2, nome: "Bia" }, resposta: null, nota: null, status: "pendente" });
        expect(alunos[2]!.status).toBe("entregue_com_atraso");
    });
});

describe("ExportNotasSalaService", () => {
    it("gera a planilha com o nome do arquivo sem acentos e uma linha por nota", async () => {
        (ListNotasSalaService.prototype.execute as jest.Mock<any>).mockResolvedValue([{
            aluno: { nome: "Ana" },
            atividade: { titulo: "Relevo", tipo: "mapa_mental", etapa: 1, data_entrega: new Date("2026-11-10T00:00:00Z") },
            conteudo: { nome: "Relevo" },
            tutor: { nome: "Bia" },
            valor: 8.5,
            comentario: null,
            data_lancamento: new Date("2026-11-11T00:00:00Z"),
            contestacao_pendente: true
        }]);
        prismaMock.sala.findUnique.mockResolvedValue({ nome: "2º Ano Ação", ano_letivo: 2026 } as any);

        const { buffer, nomeArquivo } = await new ExportNotasSalaService().execute({ id_sala: 1, id_professor: ID_PROFESSOR, etapa: "1" });

        expect(nomeArquivo).toBe("notas_2_Ano_Acao_2026.xlsx");
        expect(ListNotasSalaService.prototype.execute).toHaveBeenCalledWith(expect.objectContaining({ id_sala: 1, id_professor: ID_PROFESSOR, etapa: "1" }));

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer as any);
        const planilha = workbook.getWorksheet("Notas")!;
        expect(planilha.rowCount).toBe(2);
        expect(planilha.getRow(1).getCell(1).value).toBe("Aluno");
        const linha = planilha.getRow(2);
        expect(linha.getCell(1).value).toBe("Ana");
        expect(linha.getCell(3).value).toBe("Mapa mental");
        expect(linha.getCell(8).value).toBe(8.5);
        expect(linha.getCell(9).value).toBe("");
        expect(linha.getCell(11).value).toBe("Sim");
    });

    it("propaga o erro de permissão do ListNotasSalaService", async () => {
        (ListNotasSalaService.prototype.execute as jest.Mock<any>).mockRejectedValue(new Error("403"));
        await expect(new ExportNotasSalaService().execute({ id_sala: 1, id_professor: ID_PROFESSOR })).rejects.toThrow("403");
        expect(prismaMock.sala.findUnique).not.toHaveBeenCalled();
    });
});
