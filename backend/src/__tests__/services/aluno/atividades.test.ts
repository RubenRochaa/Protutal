import { describe, it, expect, jest, beforeEach, afterEach } from "@jest/globals";
import { prismaMock } from "../../mocks/prisma";
import { simularUpload } from "../../mocks/cloudinary";
import { esperaAppErrorAsync } from "../../utils";
import { Prisma } from "../../../generated/prisma";
import { ListAtividadesAlunoService } from "../../../services/aluno/ListAtividadesAlunoService";
import { CreateFeedbackService } from "../../../services/aluno/CreateFeedbackService";
import { CreateNotaService } from "../../../services/aluno/CreateNotaService";
import { DetailAtividadeService } from "../../../services/aluno/DetailAtividadeService";
import { CreateAtividadeService } from "../../../services/aluno/CreateAtividadeService";

jest.mock("cloudinary", () => ({ v2: { config: jest.fn(), uploader: { upload_stream: jest.fn() } } }));

const AGORA = new Date("2026-11-06T12:00:00Z");
const PRAZO = new Date("2026-11-10T23:59:00Z");
const ID_ALUNO = 20;
const ID_TUTOR = 30;

afterEach(() => jest.useRealTimers());

describe("ListAtividadesAlunoService", () => {
    const atividade = (id: number, dados: any = {}) => ({
        id_atividade: id, titulo: "T", descricao: null, tipo: "projeto", etapa: 1, data_entrega: PRAZO,
        conteudo: { id_conteudo: 1, nome: "C" }, tutor_sala: { sala: { id_sala: 1, nome: "2A" }, tutor: { aluno: { nome: "Bia" } } },
        destinatarios: [{ tutoria: { status: "ativa" } }], respostas: [], notas: [],
        ...dados
    });

    it("400 com etapa ou status inválidos", async () => {
        await esperaAppErrorAsync(new ListAtividadesAlunoService().execute({ id_aluno: ID_ALUNO, etapa: "0" }), "A etapa deve ser 1, 2 ou 3", 400);
        await esperaAppErrorAsync(new ListAtividadesAlunoService().execute({ id_aluno: ID_ALUNO, status: "x" }), "O status deve ser pendente, entregue ou entregue_com_atraso", 400);
    });

    it("calcula status, nota e se ainda pode responder", async () => {
        prismaMock.atividade.findMany.mockResolvedValue([
            atividade(1),
            atividade(2, { respostas: [{ data_envio: new Date("2026-11-09") }], notas: [{ valor: new Prisma.Decimal("9"), comentario: "Ótimo" }] }),
            atividade(3, { destinatarios: [{ tutoria: { status: "finalizada" } }] })
        ] as any);

        const lista = await new ListAtividadesAlunoService().execute({ id_aluno: ID_ALUNO });

        expect(lista[0]).toEqual(expect.objectContaining({ status: "pendente", nota: null, pode_responder: true, tutor: { nome: "Bia" }, sala: { id_sala: 1, nome: "2A" } }));
        expect(lista[1]).toEqual(expect.objectContaining({ status: "entregue", nota: { valor: 9, comentario: "Ótimo" }, pode_responder: false }));
        expect(lista[2]!.pode_responder).toBe(false);
    });

    it("filtra pelo status calculado", async () => {
        prismaMock.atividade.findMany.mockResolvedValue([atividade(1), atividade(2, { respostas: [{ data_envio: new Date("2026-11-09") }] })] as any);

        const lista = await new ListAtividadesAlunoService().execute({ id_aluno: ID_ALUNO, status: "entregue", etapa: "1" });
        expect(lista.map((a) => a.id_atividade)).toEqual([2]);
        expect(prismaMock.atividade.findMany).toHaveBeenCalledWith(expect.objectContaining({
            where: { destinatarios: { some: { tutoria: { id_aluno: ID_ALUNO } } }, etapa: 1 }
        }));
    });
});

describe("CreateFeedbackService", () => {
    const arquivo = (name = "rubrica.pdf") => ({ name, size: 1000, data: Buffer.from("x") } as any);
    const executar = (dados: any = {}) => new CreateFeedbackService().execute({ id_tutoria: 5, id_aluno: ID_ALUNO, etapa: "1", nota: "8.5", file: arquivo(), ...dados });
    const tutoria = (status = "ativa") => ({ id_tutoria: 5, id_aluno: ID_ALUNO, status, tutor_sala: { data_revogacao: null, tutor: { id_aluno: ID_TUTOR } } });

    beforeEach(() => {
        prismaMock.tutoria.findUnique.mockResolvedValue(tutoria() as any);
    });

    it("403 quando quem envia é o tutor; 409 com tutoria finalizada", async () => {
        await esperaAppErrorAsync(executar({ id_aluno: ID_TUTOR }), "Somente o aluno tutorado pode enviar feedback ao tutor", 403);
        prismaMock.tutoria.findUnique.mockResolvedValue(tutoria("finalizada") as any);
        await esperaAppErrorAsync(executar(), "Esta tutoria está finalizada e não aceita novos feedbacks", 409);
    });

    it.each([
        [{ etapa: undefined }, "O campo etapa é obrigatório e deve ser 1, 2 ou 3"],
        [{ etapa: "4" }, "O campo etapa é obrigatório e deve ser 1, 2 ou 3"],
        [{ nota: "" }, "O campo nota é obrigatório e deve ser um número"],
        [{ nota: "abc" }, "O campo nota é obrigatório e deve ser um número"],
        [{ nota: "10.5" }, "A nota deve estar entre 0 e 10"],
        [{ comentario: " " }, "O campo comentario não pode ser vazio"],
        [{ file: undefined }, "O arquivo da rubrica é obrigatório (campo file)"],
        [{ file: arquivo("rubrica.png") }, "Formato não aceito. Envie um arquivo .pdf, .doc, .docx, .xls, .xlsx ou .csv"],
    ])("400 com %p", async (dados, mensagem) => {
        await esperaAppErrorAsync(executar(dados), mensagem, 400);
    });

    it("409 quando a etapa já tem feedback (antes e na corrida P2002)", async () => {
        prismaMock.feedback.findUnique.mockResolvedValue({ id_feedback: 1 } as any);
        await esperaAppErrorAsync(executar({ etapa: "2" }), "Já foi enviado um feedback nesta tutoria para a 2ª etapa", 409);

        prismaMock.feedback.findUnique.mockResolvedValue(null);
        simularUpload({ secure_url: "https://cdn/r.pdf" });
        prismaMock.feedback.create.mockRejectedValue(new Prisma.PrismaClientKnownRequestError("dup", { code: "P2002", clientVersion: "6" }));
        await esperaAppErrorAsync(executar(), "Já foi enviado um feedback nesta tutoria para a 1ª etapa", 409);

        prismaMock.feedback.create.mockRejectedValue(new Error("banco fora"));
        await expect(executar()).rejects.toThrow("banco fora");
    });

    it("falha no upload da rubrica não grava o feedback", async () => {
        prismaMock.feedback.findUnique.mockResolvedValue(null);
        simularUpload({ erro: new Error("cloudinary fora") });

        await expect(executar()).rejects.toThrow("cloudinary fora");
        expect(prismaMock.feedback.create).not.toHaveBeenCalled();
    });

    it("cria o feedback com a rubrica enviada e nota numérica", async () => {
        prismaMock.feedback.findUnique.mockResolvedValue(null);
        simularUpload({ secure_url: "https://cdn/rubrica.pdf" });
        prismaMock.feedback.create.mockResolvedValue({ id_feedback: 3, nota: new Prisma.Decimal("8.5") } as any);

        await expect(executar({ comentario: " Ajudou " })).resolves.toEqual({ id_feedback: 3, nota: 8.5 });
        expect(prismaMock.feedback.create).toHaveBeenCalledWith(expect.objectContaining({
            data: { id_tutoria: 5, etapa: 1, nota: 8.5, comentario: "Ajudou", rubrica_file: "https://cdn/rubrica.pdf" }
        }));
    });
});

describe("CreateNotaService", () => {
    const executar = (dados: any = {}) => new CreateNotaService().execute({ id_atividade: 4, id_usuario: ID_TUTOR, email: "tutor@x", id_aluno: ID_ALUNO, valor: 8, ...dados });

    // atividade 4 do tutor_sala 3, tutor com vínculo ativo, aluno destinatário com tutoria ativa
    function prepararValido() {
        prismaMock.atividade.findUnique.mockResolvedValue({ id_atividade: 4, id_tutor_sala: 3, data_entrega: PRAZO } as any);
        prismaMock.tutor_sala.findFirst.mockResolvedValue({ id_tutor_sala: 3 } as any);
        prismaMock.atividade_destinatario.findFirst.mockResolvedValue({ tutoria: { status: "ativa" } } as any);
        prismaMock.resposta.findUnique.mockResolvedValue({ id_resposta: 1 } as any);
        prismaMock.nota.findUnique.mockResolvedValue(null);
    }

    it.each([
        [{ id_atividade: 0 }, "O id da atividade deve ser um número inteiro"],
        [{ id_aluno: true }, "O campo id_aluno é obrigatório e deve ser um número inteiro"],
        [{ id_aluno: -1 }, "O campo id_aluno é obrigatório e deve ser um número inteiro"],
        [{ valor: "8" }, "O campo valor é obrigatório e deve ser um número"],
        [{ valor: -1 }, "O valor deve estar entre 0 e 10"],
        [{ comentario: 3 }, "O campo comentario deve ser um texto"],
    ])("400 com %p", async (dados, mensagem) => {
        await esperaAppErrorAsync(executar(dados), mensagem, 400);
    });

    it("404 atividade; 403 sem e-mail ou não é o tutor ativo da atividade", async () => {
        prismaMock.atividade.findUnique.mockResolvedValue(null);
        await esperaAppErrorAsync(executar(), "Atividade não encontrada", 404);

        prismaMock.atividade.findUnique.mockResolvedValue({ id_atividade: 4, id_tutor_sala: 3, data_entrega: PRAZO } as any);
        await esperaAppErrorAsync(executar({ email: "" }), "Você não tem permissão para lançar notas nesta atividade", 403);

        prismaMock.tutor_sala.findFirst.mockResolvedValue(null);
        await esperaAppErrorAsync(executar(), "Você não tem permissão para lançar notas nesta atividade", 403);
    });

    it("400 aluno não destinatário / tutoria finalizada / sem resposta antes do prazo; 409 nota já lançada", async () => {
        jest.useFakeTimers().setSystemTime(AGORA);
        prepararValido();

        prismaMock.atividade_destinatario.findFirst.mockResolvedValue(null);
        await esperaAppErrorAsync(executar(), "O aluno informado não é destinatário desta atividade", 400);

        prismaMock.atividade_destinatario.findFirst.mockResolvedValue({ tutoria: { status: "finalizada" } } as any);
        await esperaAppErrorAsync(executar(), "A tutoria deste aluno foi finalizada e não aceita alterações", 400);

        prismaMock.atividade_destinatario.findFirst.mockResolvedValue({ tutoria: { status: "ativa" } } as any);
        prismaMock.resposta.findUnique.mockResolvedValue(null);
        await esperaAppErrorAsync(executar(), "O aluno ainda não enviou resposta e o prazo de entrega não venceu", 400);

        prismaMock.resposta.findUnique.mockResolvedValue({ id_resposta: 1 } as any);
        prismaMock.nota.findUnique.mockResolvedValue({ id_nota: 1 } as any);
        await esperaAppErrorAsync(executar(), "Já existe nota lançada para este aluno nesta atividade", 409);
    });

    it("lança nota sem resposta quando o prazo já venceu", async () => {
        jest.useFakeTimers().setSystemTime(new Date("2026-11-20T00:00:00Z"));
        prepararValido();
        prismaMock.resposta.findUnique.mockResolvedValue(null);
        prismaMock.nota.create.mockResolvedValue({ id_nota: 9, valor: new Prisma.Decimal("0") } as any);

        await expect(executar({ valor: 0 })).resolves.toEqual({ id_nota: 9, valor: 0 });
    });

    it("cria a nota (comentário vazio vira null) e trata P2002", async () => {
        prepararValido();
        prismaMock.nota.create.mockResolvedValue({ id_nota: 9, valor: new Prisma.Decimal("8") } as any);

        await expect(executar({ id_aluno: "20", comentario: " " })).resolves.toEqual({ id_nota: 9, valor: 8 });
        expect(prismaMock.nota.create).toHaveBeenCalledWith(expect.objectContaining({ data: { id_atividade: 4, id_aluno: 20, valor: 8, comentario: null } }));

        prismaMock.nota.create.mockRejectedValue(new Prisma.PrismaClientKnownRequestError("dup", { code: "P2002", clientVersion: "6" }));
        await esperaAppErrorAsync(executar(), "Já existe nota lançada para este aluno nesta atividade", 409);

        prismaMock.nota.create.mockRejectedValue(new Error("banco fora"));
        await expect(executar()).rejects.toThrow("banco fora");
    });
});

describe("DetailAtividadeService", () => {
    const executar = (dados: any = {}) => new DetailAtividadeService().execute({ id_atividade: 4, id_usuario: ID_ALUNO, email: "a@x", ...dados });
    const atividade = (dados: any = {}) => ({
        id_atividade: 4, id_tutor_sala: 3, titulo: "T", descricao: null, tipo: "projeto", etapa: 1, data_entrega: PRAZO,
        conteudo: { nome: "C" }, tutor_sala: { sala: { id_sala: 1 }, tutor: { aluno: { nome: "Bia" } } },
        destinatarios: [
            { id_att_destinatario: 2, tutoria: { status: "ativa", aluno: { id_aluno: ID_ALUNO, nome: "Ana" } } },
            { id_att_destinatario: 1, tutoria: { status: "finalizada", aluno: { id_aluno: 40, nome: "Caio" } } }
        ],
        respostas: [], notas: [],
        ...dados
    });

    it("400 / 404 / 403 sem e-mail", async () => {
        await esperaAppErrorAsync(executar({ id_atividade: 0 }), "O id da atividade deve ser um número inteiro", 400);
        prismaMock.atividade.findUnique.mockResolvedValue(null);
        await esperaAppErrorAsync(executar(), "Atividade não encontrada", 404);
        prismaMock.atividade.findUnique.mockResolvedValue(atividade() as any);
        await esperaAppErrorAsync(executar({ email: "" }), "Você não tem permissão para acessar esta atividade", 403);
    });

    it("perfil aluno: status, pode_responder, resposta e nota", async () => {
        prismaMock.atividade.findUnique.mockResolvedValue(atividade({ notas: [{ id_nota: 1, valor: new Prisma.Decimal("7"), comentario: null }] }) as any);

        const detalhe: any = await executar();

        expect(detalhe).toEqual(expect.objectContaining({ perfil: "aluno", status: "pendente", pode_responder: true, resposta: null, nota: { id_nota: 1, valor: 7, comentario: null }, tutor: { nome: "Bia" } }));
    });

    it("aluno destinatário por duas tutorias: usa o destinatário mais antigo", async () => {
        prismaMock.atividade.findUnique.mockResolvedValue(atividade({
            destinatarios: [
                { id_att_destinatario: 5, tutoria: { status: "finalizada", aluno: { id_aluno: ID_ALUNO, nome: "Ana" } } },
                { id_att_destinatario: 2, tutoria: { status: "ativa", aluno: { id_aluno: ID_ALUNO, nome: "Ana" } } }
            ]
        }) as any);

        const detalhe: any = await executar();
        expect(detalhe.pode_responder).toBe(true);
    });

    it("perfil tutor: lista os destinatários", async () => {
        prismaMock.atividade.findUnique.mockResolvedValue(atividade() as any);
        prismaMock.tutor_sala.findFirst.mockResolvedValue({ id_tutor_sala: 3 } as any);

        const detalhe: any = await executar({ id_usuario: ID_TUTOR, email: "tutor@x" });

        expect(detalhe.perfil).toBe("tutor");
        expect(detalhe.destinatarios).toEqual([{ id_aluno: ID_ALUNO, nome: "Ana" }, { id_aluno: 40, nome: "Caio" }]);
    });

    it("403 para quem não é destinatário nem tutor ativo", async () => {
        prismaMock.atividade.findUnique.mockResolvedValue(atividade() as any);
        prismaMock.tutor_sala.findFirst.mockResolvedValue(null);
        await esperaAppErrorAsync(executar({ id_usuario: 99 }), "Você não tem permissão para acessar esta atividade", 403);
    });
});

describe("CreateAtividadeService", () => {
    const executar = (dados: any = {}) => new CreateAtividadeService().execute({
        id_aluno: ID_TUTOR, id_tutoria: 5, id_conteudo: 2, titulo: "Relevo", tipo: "mapa_mental", etapa: 1, prazo: "2026-11-10T23:59:00Z", ...dados
    });
    const tutoria = (dados: any = {}, tutorSala: any = {}) => ({
        status: "ativa",
        tutor_sala: { id_tutor_sala: 3, id_sala: 1, data_revogacao: null, pode_criar_ativ: true, tutor: { id_aluno: ID_TUTOR }, ...tutorSala },
        ...dados
    });

    beforeEach(() => jest.useFakeTimers().setSystemTime(AGORA));

    it.each([
        [{ id_tutoria: undefined }, "O campo id_tutoria é obrigatório e deve ser um número inteiro"],
        [{ id_conteudo: 0 }, "O campo id_conteudo é obrigatório e deve ser um número inteiro"],
        [{ titulo: "" }, "O campo titulo é obrigatório"],
        [{ titulo: "a".repeat(151) }, "O titulo deve ter no máximo 150 caracteres"],
        [{ descricao: 1 }, "O campo descricao deve ser um texto"],
        [{ tipo: "" }, "O campo tipo é obrigatório"],
        [{ etapa: 4 }, "O campo etapa é obrigatório e deve ser 1, 2 ou 3"],
        [{ etapa: true }, "O campo etapa é obrigatório e deve ser 1, 2 ou 3"],
        [{ prazo: "" }, "O campo prazo é obrigatório"],
        [{ prazo: "amanhã" }, "O campo prazo deve ser uma data válida"],
        [{ prazo: "2026-11-01T00:00:00Z" }, "O prazo deve ser uma data futura"],
    ])("400 com %p", async (dados, mensagem) => {
        await esperaAppErrorAsync(executar(dados), mensagem, 400);
    });

    it("400 com tipo fora do enum TipoAtividade", async () => {
        await expect(executar({ tipo: "redacao" })).rejects.toMatchObject({ statusCode: 400, message: expect.stringContaining("Tipo inválido. Valores aceitos: aula_invertida") });
    });

    it.each([
        ["tutoria inexistente", null],
        ["tutoria finalizada", tutoria({ status: "finalizada" })],
        ["tutor revogado", tutoria({}, { data_revogacao: AGORA })],
        ["outro tutor", tutoria({}, { tutor: { id_aluno: 99 } })],
    ])("403 quando %s", async (_caso, valor) => {
        prismaMock.tutoria.findUnique.mockResolvedValue(valor as any);
        await esperaAppErrorAsync(executar(), "Você não é tutor desta tutoria ou ela não está ativa", 403);
    });

    it("403 sem permissão do professor; 404 conteúdo; 400 conteúdo de outra sala", async () => {
        prismaMock.tutoria.findUnique.mockResolvedValue(tutoria({}, { pode_criar_ativ: false }) as any);
        await esperaAppErrorAsync(executar(), "O professor não liberou a criação de atividades", 403);

        prismaMock.tutoria.findUnique.mockResolvedValue(tutoria() as any);
        prismaMock.conteudo.findUnique.mockResolvedValue(null);
        await esperaAppErrorAsync(executar(), "Conteúdo não encontrado", 404);

        prismaMock.conteudo.findUnique.mockResolvedValue({ id_conteudo: 2 } as any);
        prismaMock.sala_conteudo.findUnique.mockResolvedValue(null);
        await esperaAppErrorAsync(executar(), "O conteúdo não pertence à sala desta tutoria", 400);
    });

    it("cria a atividade direcionada ao aluno da tutoria", async () => {
        prismaMock.tutoria.findUnique.mockResolvedValue(tutoria() as any);
        prismaMock.conteudo.findUnique.mockResolvedValue({ id_conteudo: 2 } as any);
        prismaMock.sala_conteudo.findUnique.mockResolvedValue({ id_sala_conteudo: 1 } as any);
        prismaMock.atividade.create.mockResolvedValue({ id_atividade: 9 } as any);

        await expect(executar({ titulo: " Relevo ", descricao: " ", tipo: " mapa_mental ", etapa: "2" })).resolves.toEqual({ id_atividade: 9 });
        expect(prismaMock.atividade.create).toHaveBeenCalledWith(expect.objectContaining({
            data: {
                id_tutor_sala: 3, id_conteudo: 2, titulo: "Relevo", descricao: null, tipo: "mapa_mental", etapa: 2,
                data_entrega: new Date("2026-11-10T23:59:00Z"),
                destinatarios: { create: { id_tutoria: 5 } }
            }
        }));
    });
});
