import { describe, it, expect, jest } from "@jest/globals";
import { v2 as cloudinary } from "cloudinary";
import { prismaMock } from "../../mocks/prisma";
import { simularUpload } from "../../mocks/cloudinary";
import { esperaAppErrorAsync } from "../../utils";
import { Prisma } from "../../../generated/prisma";
import { MENSAGEM_SEM_PERMISSAO_SALA } from "../../../helpers/buscarSalaDoProfessor";
import { buscarImpedimentosPorSala, IMPEDIMENTOS_PEDIDO_TUTORIA } from "../../../helpers/verificarPedidoTutoria";
import { ListAtividadesTutorService } from "../../../services/aluno/ListAtividadesTutorService";
import { CreatePedidoTutoriaService } from "../../../services/aluno/CreatePedidoTutoriaService";
import { CreateContestacaoNotaService } from "../../../services/aluno/CreateContestacaoNotaService";
import { CreateMaterialService } from "../../../services/aluno/CreateMaterialService";
import { DesempenhoAlunoService } from "../../../services/aluno/DesempenhoAlunoService";
import { CreateRespostaService } from "../../../services/aluno/CreateRespostaService";

jest.mock("cloudinary", () => ({ v2: { config: jest.fn(), uploader: { upload_stream: jest.fn() } } }));
jest.mock("../../../helpers/verificarPedidoTutoria", () => ({
    ...(jest.requireActual("../../../helpers/verificarPedidoTutoria") as object),
    buscarImpedimentosPorSala: jest.fn()
}));

const ID_ALUNO = 20;
const AGORA = new Date("2026-11-06T12:00:00Z");
const arquivo = (name = "material.pdf", size = 1000) => ({ name, size, data: Buffer.from("x") } as any);

describe("ListAtividadesTutorService", () => {
    const executar = (dados: any = {}) => new ListAtividadesTutorService().execute({ id_aluno: ID_ALUNO, email: "a@x", ...dados });

    it("400 com filtros inválidos; 403 sem e-mail", async () => {
        await esperaAppErrorAsync(executar({ etapa: "4" }), "A etapa deve ser 1, 2 ou 3", 400);
        await esperaAppErrorAsync(executar({ id_sala: "x" }), "O id da sala deve ser um número inteiro", 400);
        await esperaAppErrorAsync(executar({ id_conteudo: "x" }), "O id do conteúdo deve ser um número inteiro", 400);
        await esperaAppErrorAsync(executar({ email: "" }), "Acesso permitido somente para tutores com vínculo ativo", 403);
    });

    it("lista só atividades de vínculos ativos do tutor", async () => {
        prismaMock.atividade.findMany.mockResolvedValue([{
            id_atividade: 1, titulo: "T", tipo: "projeto", etapa: 1, data_entrega: AGORA, conteudo: { id_conteudo: 2, nome: "C" },
            _count: { destinatarios: 2, respostas: 1, notas: 0 }, tutor_sala: { sala: { id_sala: 1, nome: "2A" } }
        }] as any);

        const [atividade] = await executar({ id_sala: "1" });

        expect(atividade).toEqual(expect.objectContaining({ sala: { id_sala: 1, nome: "2A" }, total_destinatarios: 2, total_entregues: 1, total_com_nota: 0 }));
        expect(prismaMock.atividade.findMany).toHaveBeenCalledWith(expect.objectContaining({
            where: { etapa: undefined, id_conteudo: undefined, tutor_sala: { data_revogacao: null, id_sala: 1, tutor: { aluno: { id_aluno: ID_ALUNO, email: "a@x" } } } }
        }));
    });
});

describe("CreatePedidoTutoriaService", () => {
    const executar = (id_sala: any = 1) => new CreatePedidoTutoriaService().execute({ id_aluno: ID_ALUNO, id_sala });
    const buscarMock = buscarImpedimentosPorSala as jest.MockedFunction<typeof buscarImpedimentosPorSala>;

    it("400 sem sala; 404 sala inexistente; 400 não matriculado", async () => {
        await esperaAppErrorAsync(executar(null), "O campo id_sala é obrigatório e deve ser um número inteiro", 400);
        prismaMock.sala.findUnique.mockResolvedValue(null);
        await esperaAppErrorAsync(executar(), "Sala não encontrada", 404);
        prismaMock.sala.findUnique.mockResolvedValue({ id_sala: 1 } as any);
        prismaMock.matricula.findUnique.mockResolvedValue(null);
        await esperaAppErrorAsync(executar(), "Você não está matriculado nesta sala", 400);
    });

    it("409 com o código do impedimento (e liberado_em na recusa recente)", async () => {
        prismaMock.sala.findUnique.mockResolvedValue({ id_sala: 1 } as any);
        prismaMock.matricula.findUnique.mockResolvedValue({ id_matricula: 1 } as any);

        buscarMock.mockResolvedValue(() => ({ impedimento: IMPEDIMENTOS_PEDIDO_TUTORIA.ja_e_tutor, liberado_em: null }));
        await expect(executar()).rejects.toMatchObject({ statusCode: 409, message: "Você já é tutor nesta sala", dados: { codigo: "ja_e_tutor" } });

        buscarMock.mockResolvedValue(() => ({ impedimento: IMPEDIMENTOS_PEDIDO_TUTORIA.recusa_recente, liberado_em: AGORA }));
        await expect(executar()).rejects.toMatchObject({ statusCode: 409, dados: { codigo: "recusa_recente", liberado_em: AGORA.toISOString() } });
    });

    it("cria o pedido pendente (ainda sem registro em Tutor)", async () => {
        prismaMock.sala.findUnique.mockResolvedValue({ id_sala: 1 } as any);
        prismaMock.matricula.findUnique.mockResolvedValue({ id_matricula: 1 } as any);
        buscarMock.mockResolvedValue(() => ({ impedimento: null, liberado_em: null }));
        prismaMock.pedido_tutoria.create.mockResolvedValue({ id_pedido: 9, status: "pendente" } as any);

        await expect(executar("1")).resolves.toEqual({ id_pedido: 9, status: "pendente" });
        expect(prismaMock.pedido_tutoria.create).toHaveBeenCalledWith(expect.objectContaining({ data: { id_aluno: ID_ALUNO, id_sala: 1, status: "pendente" } }));
        expect(prismaMock.tutor.create).not.toHaveBeenCalled();
    });
});

describe("CreateContestacaoNotaService", () => {
    const executar = (dados: any = {}) => new CreateContestacaoNotaService().execute({ id_nota: 7, id_usuario: ID_ALUNO, comentario: "Revisar", ...dados });

    it("400 / 404 / 403 nota de outro aluno / 403 tutoria finalizada / 409 já contestada", async () => {
        await esperaAppErrorAsync(executar({ id_nota: 0 }), "O id da nota deve ser um número inteiro", 400);
        await esperaAppErrorAsync(executar({ comentario: " " }), "O campo comentario é obrigatório", 400);

        prismaMock.nota.findUnique.mockResolvedValue(null);
        await esperaAppErrorAsync(executar(), "Nota não encontrada", 404);

        prismaMock.nota.findUnique.mockResolvedValue({ id_nota: 7, id_aluno: 99, id_atividade: 3 } as any);
        await esperaAppErrorAsync(executar(), "Você não tem permissão para contestar esta nota", 403);

        prismaMock.nota.findUnique.mockResolvedValue({ id_nota: 7, id_aluno: ID_ALUNO, id_atividade: 3 } as any);
        prismaMock.atividade_destinatario.findFirst.mockResolvedValue({ tutoria: { status: "finalizada" } } as any);
        await esperaAppErrorAsync(executar(), "A tutoria foi finalizada e não aceita contestação de nota", 403);

        prismaMock.atividade_destinatario.findFirst.mockResolvedValue({ tutoria: { status: "ativa" } } as any);
        prismaMock.contestacao_nota.findFirst.mockResolvedValue({ id_contestacao: 1 } as any);
        await esperaAppErrorAsync(executar(), "Esta nota já foi contestada", 409);
    });

    it("cria a contestação", async () => {
        prismaMock.nota.findUnique.mockResolvedValue({ id_nota: 7, id_aluno: ID_ALUNO, id_atividade: 3 } as any);
        prismaMock.atividade_destinatario.findFirst.mockResolvedValue({ tutoria: { status: "ativa" } } as any);
        prismaMock.contestacao_nota.findFirst.mockResolvedValue(null);
        prismaMock.contestacao_nota.create.mockResolvedValue({ id_contestacao: 2 } as any);

        await expect(executar({ comentario: " Revisar " })).resolves.toEqual({ id_contestacao: 2 });
        expect(prismaMock.contestacao_nota.create).toHaveBeenCalledWith(expect.objectContaining({ data: { id_nota: 7, comentario: "Revisar" } }));
    });
});

describe("CreateMaterialService", () => {
    const executar = (dados: any = {}) => new CreateMaterialService().execute({ id_aluno: ID_ALUNO, email: "a@x", id_sala: 1, titulo: "Mapa", file: arquivo(), ...dados });

    it.each([
        [{ titulo: "" }, "O título do material é obrigatório"],
        [{ titulo: "a".repeat(151) }, "O título do material deve ter no máximo 150 caracteres"],
        [{ descricao: 5 }, "O campo descricao deve ser um texto"],
        [{ file: undefined }, "O arquivo do material é obrigatório (campo file)"],
        [{ file: arquivo("foto.png") }, "Formato não aceito. Envie um arquivo .pdf, .doc, .docx, .xls, .xlsx ou .csv"],
    ])("400 com %p", async (dados, mensagem) => {
        await esperaAppErrorAsync(executar(dados), mensagem, 400);
    });

    it("403 sem vínculo ativo de tutor ou sem tutoria ativa", async () => {
        prismaMock.tutor_sala.findFirst.mockResolvedValue(null);
        await esperaAppErrorAsync(executar(), MENSAGEM_SEM_PERMISSAO_SALA, 403);

        prismaMock.tutor_sala.findFirst.mockResolvedValue({ id_tutor_sala: 3 } as any);
        prismaMock.tutoria.findFirst.mockResolvedValue(null);
        await esperaAppErrorAsync(executar(), "Você precisa ter pelo menos uma tutoria ativa nesta sala para anexar material", 403);
    });

    it("envia o arquivo e salva a URL (descrição vazia vira null)", async () => {
        prismaMock.tutor_sala.findFirst.mockResolvedValue({ id_tutor_sala: 3 } as any);
        prismaMock.tutoria.findFirst.mockResolvedValue({ id_tutoria: 1 } as any);
        simularUpload({ secure_url: "https://cdn/material.pdf" });
        prismaMock.material.create.mockResolvedValue({ id_material: 1 } as any);

        await expect(executar({ titulo: " Mapa ", descricao: "  " })).resolves.toEqual({ id_material: 1 });
        expect(cloudinary.uploader.upload_stream).toHaveBeenCalledWith({ resource_type: "auto" }, expect.any(Function));
        expect(prismaMock.material.create).toHaveBeenCalledWith(expect.objectContaining({
            data: { id_tutor_sala: 3, titulo: "Mapa", descricao: null, arquivo: "https://cdn/material.pdf" }
        }));
    });

    it("falha no upload não salva o material", async () => {
        prismaMock.tutor_sala.findFirst.mockResolvedValue({ id_tutor_sala: 3 } as any);
        prismaMock.tutoria.findFirst.mockResolvedValue({ id_tutoria: 1 } as any);
        simularUpload({ erro: new Error("cloudinary fora") });

        await expect(executar()).rejects.toThrow("cloudinary fora");
        expect(prismaMock.material.create).not.toHaveBeenCalled();
    });
});

describe("DesempenhoAlunoService", () => {
    const nota = (id_nota: number, valor: string, etapa: number, id_conteudo: number, nomeConteudo: string, contestacoes: any[] = []) => ({
        id_nota, valor: new Prisma.Decimal(valor), comentario: null, data_lancamento: AGORA,
        atividade: { id_atividade: id_nota, titulo: "T", tipo: "projeto", etapa, conteudo: { id_conteudo, nome: nomeConteudo } },
        contestacoes
    });

    it("400 com filtros inválidos", async () => {
        await esperaAppErrorAsync(new DesempenhoAlunoService().execute({ id_aluno: ID_ALUNO, etapa: "7" }), "A etapa deve ser 1, 2 ou 3", 400);
        await esperaAppErrorAsync(new DesempenhoAlunoService().execute({ id_aluno: ID_ALUNO, id_sala: "x" }), "O id da sala deve ser um número inteiro", 400);
    });

    it("sem notas: médias null e 3 etapas zeradas", async () => {
        prismaMock.nota.findMany.mockResolvedValue([]);
        const resultado = await new DesempenhoAlunoService().execute({ id_aluno: ID_ALUNO });

        expect(resultado.media_geral).toEqual({ media: null, total_notas: 0 });
        expect(resultado.por_etapa).toHaveLength(3);
        expect(resultado.por_conteudo).toEqual([]);
    });

    it("calcula média geral, por etapa e por conteúdo; mostra status da última contestação", async () => {
        prismaMock.nota.findMany.mockResolvedValue([
            nota(1, "6", 1, 1, "Relevo", [{ status: "pendente" }]),
            nota(2, "8", 1, 2, "Clima"),
            nota(3, "10", 2, 1, "Relevo")
        ] as any);

        const resultado = await new DesempenhoAlunoService().execute({ id_aluno: ID_ALUNO });

        expect(resultado.media_geral).toEqual({ media: 8, total_notas: 3 });
        expect(resultado.por_etapa).toEqual([
            { etapa: 1, media: 7, quantidade: 2 },
            { etapa: 2, media: 10, quantidade: 1 },
            { etapa: 3, media: null, quantidade: 0 }
        ]);
        expect(resultado.por_conteudo).toEqual([
            { id_conteudo: 2, nome: "Clima", media: 8, quantidade: 1 },
            { id_conteudo: 1, nome: "Relevo", media: 8, quantidade: 2 }
        ]);
        expect(resultado.notas.map((n) => n.contestacao_status)).toEqual(["pendente", null, null]);
    });

    it("com filtro de etapa mostra só aquela etapa", async () => {
        prismaMock.nota.findMany.mockResolvedValue([]);
        const resultado = await new DesempenhoAlunoService().execute({ id_aluno: ID_ALUNO, etapa: "2", id_sala: "1" });
        expect(resultado.por_etapa).toEqual([{ etapa: 2, media: null, quantidade: 0 }]);
    });
});

describe("CreateRespostaService", () => {
    const executar = (dados: any = {}) => new CreateRespostaService().execute({ id_aluno: ID_ALUNO, id_atividade: 4, file: arquivo("resposta.pdf"), ...dados });

    // tudo válido até o upload
    function prepararAteUpload() {
        prismaMock.atividade.findUnique.mockResolvedValue({ id_atividade: 4 } as any);
        prismaMock.atividade_destinatario.findFirst.mockResolvedValue({ tutoria: { status: "ativa" } } as any);
        prismaMock.resposta.findUnique.mockResolvedValue(null);
    }

    it("400 com dados inválidos", async () => {
        await esperaAppErrorAsync(executar({ id_atividade: 0 }), "O id da atividade deve ser um número inteiro", 400);
        await esperaAppErrorAsync(executar({ file: undefined }), "O arquivo da resposta é obrigatório (campo file)", 400);
        await esperaAppErrorAsync(executar({ file: [arquivo(), arquivo()] }), "Envie apenas um arquivo no campo file", 400);
        await esperaAppErrorAsync(executar({ texto: 10 }), "O campo texto deve ser um texto", 400);
    });

    it("404 / 403 não destinatário / 403 tutoria inativa / 409 já respondeu", async () => {
        prismaMock.atividade.findUnique.mockResolvedValue(null);
        await esperaAppErrorAsync(executar(), "Atividade não encontrada", 404);

        prismaMock.atividade.findUnique.mockResolvedValue({ id_atividade: 4 } as any);
        prismaMock.atividade_destinatario.findFirst.mockResolvedValue(null);
        await esperaAppErrorAsync(executar(), "Esta atividade não foi direcionada a você", 403);

        prismaMock.atividade_destinatario.findFirst.mockResolvedValue({ tutoria: { status: "finalizada" } } as any);
        await esperaAppErrorAsync(executar(), "A tutoria desta atividade não está ativa", 403);

        prismaMock.atividade_destinatario.findFirst.mockResolvedValue({ tutoria: { status: "ativa" } } as any);
        prismaMock.resposta.findUnique.mockResolvedValue({ id_resposta: 1 } as any);
        await esperaAppErrorAsync(executar(), "Você já respondeu esta atividade", 409);
    });

    it("envia o arquivo e grava a resposta", async () => {
        prepararAteUpload();
        simularUpload({ secure_url: "https://cdn/resposta.pdf" });
        prismaMock.resposta.create.mockResolvedValue({ id_resposta: 5 } as any);

        await expect(executar({ texto: " minha resposta " })).resolves.toEqual({ id_resposta: 5 });
        expect(prismaMock.resposta.create).toHaveBeenCalledWith(expect.objectContaining({
            data: { id_atividade: 4, id_aluno: ID_ALUNO, texto: "minha resposta", conteudo_file: "https://cdn/resposta.pdf" }
        }));
    });

    it("409 com P2002; erro de upload sobe", async () => {
        prepararAteUpload();
        simularUpload({ secure_url: "https://cdn/r.pdf" });
        prismaMock.resposta.create.mockRejectedValue(new Prisma.PrismaClientKnownRequestError("dup", { code: "P2002", clientVersion: "6" }));
        await esperaAppErrorAsync(executar(), "Você já respondeu esta atividade", 409);

        prismaMock.resposta.create.mockRejectedValue(new Error("banco fora"));
        await expect(executar()).rejects.toThrow("banco fora");

        simularUpload({ erro: new Error("cloudinary fora") });
        await expect(executar()).rejects.toThrow("cloudinary fora");
    });
});
