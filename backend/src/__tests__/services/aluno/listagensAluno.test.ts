import { describe, it, expect, jest } from "@jest/globals";
import { prismaMock } from "../../mocks/prisma";
import { esperaAppErrorAsync } from "../../utils";
import { Prisma } from "../../../generated/prisma";
import { buscarImpedimentosPorSala, IMPEDIMENTOS_PEDIDO_TUTORIA } from "../../../helpers/verificarPedidoTutoria";
import { ListTutoriasAlunoService } from "../../../services/aluno/ListTutoriasAlunoService";
import { ListTutoriasTutorService } from "../../../services/aluno/ListTutoriasTutorService";
import { CreateMensagemService } from "../../../services/aluno/CreateMensagemService";
import { ListMensagensTutoriaService } from "../../../services/aluno/ListMensagensTutoriaService";
import { ConteudosDominadosService } from "../../../services/aluno/ConteudosDominadosService";
import { DesempenhoTutorService } from "../../../services/aluno/DesempenhoTutorService";
import { ListContestacoesAlunoService } from "../../../services/aluno/ListContestacoesAlunoService";
import { ListSalasAlunoService } from "../../../services/aluno/ListSalasAlunoService";

jest.mock("../../../helpers/verificarPedidoTutoria", () => ({
    ...(jest.requireActual("../../../helpers/verificarPedidoTutoria") as object),
    buscarImpedimentosPorSala: jest.fn()
}));

const AGORA = new Date("2026-11-06T12:00:00Z");
const ID_ALUNO = 20;

// tutoria 5: tutorado = aluno 20, tutor = aluno 30
function tutoria(dados: any = {}) {
    return { id_tutoria: 5, id_aluno: 20, status: "ativa", tutor_sala: { data_revogacao: null, tutor: { id_aluno: 30 } }, ...dados };
}

describe("ListTutoriasAlunoService", () => {
    it("400 com status inválido", async () => {
        await esperaAppErrorAsync(new ListTutoriasAlunoService().execute({ id_aluno: ID_ALUNO, status: "x" }), "O status deve ser ativa ou finalizada", 400);
    });

    it("lista as tutorias em que o aluno é tutorado", async () => {
        prismaMock.tutoria.findMany.mockResolvedValue([{
            id_tutoria: 1, status: "ativa", meta_aprendizagem: "M", data_inicio: AGORA, data_fim: null,
            tutor_sala: { tutor: { aluno: { nome: "Bia" } }, sala: { id_sala: 1, nome: "2A" } }
        }] as any);

        await expect(new ListTutoriasAlunoService().execute({ id_aluno: ID_ALUNO, status: "ativa" })).resolves.toEqual([{
            id_tutoria: 1, status: "ativa", meta_aprendizagem: "M", data_inicio: AGORA, data_fim: null, tutor: { nome: "Bia" }, sala: { id_sala: 1, nome: "2A" }
        }]);
        expect(prismaMock.tutoria.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { id_aluno: ID_ALUNO, status: "ativa" } }));
    });
});

describe("ListTutoriasTutorService", () => {
    it("400 com status inválido", async () => {
        await esperaAppErrorAsync(new ListTutoriasTutorService().execute({ id_aluno: ID_ALUNO, status: "x" }), "O status deve ser ativa ou finalizada", 400);
    });

    it("lista só tutorias de vínculos ativos do tutor", async () => {
        prismaMock.tutoria.findMany.mockResolvedValue([{
            id_tutoria: 1, status: "ativa", meta_aprendizagem: "M", data_inicio: AGORA, data_fim: null,
            aluno: { id_aluno: 40, nome: "Caio" }, tutor_sala: { sala: { id_sala: 1 } }
        }] as any);

        const [item] = await new ListTutoriasTutorService().execute({ id_aluno: ID_ALUNO });
        expect(item).toEqual(expect.objectContaining({ aluno: { id_aluno: 40, nome: "Caio" }, sala: { id_sala: 1 } }));
        expect(prismaMock.tutoria.findMany).toHaveBeenCalledWith(expect.objectContaining({
            where: { tutor_sala: { data_revogacao: null, tutor: { id_aluno: ID_ALUNO } }, status: undefined }
        }));
    });
});

describe("CreateMensagemService", () => {
    const executar = (dados: any = {}) => new CreateMensagemService().execute({ id_tutoria: 5, id_aluno: 30, texto: "Olá", ...dados });

    it("erros do participante (400 / 404 / 403)", async () => {
        await esperaAppErrorAsync(executar({ id_tutoria: 0 }), "O id da tutoria deve ser um número inteiro", 400);
        prismaMock.tutoria.findUnique.mockResolvedValue(null);
        await esperaAppErrorAsync(executar(), "Tutoria não encontrada", 404);
        prismaMock.tutoria.findUnique.mockResolvedValue(tutoria() as any);
        await esperaAppErrorAsync(executar({ id_aluno: 99 }), "Você não participa desta tutoria", 403);
    });

    it("409 com tutoria finalizada", async () => {
        prismaMock.tutoria.findUnique.mockResolvedValue(tutoria({ status: "finalizada" }) as any);
        await esperaAppErrorAsync(executar(), "Esta tutoria está finalizada e não aceita novas mensagens", 409);
    });

    it.each([
        [{ texto: " " }, "O campo texto é obrigatório e não pode ser vazio"],
        [{ assunto: "" }, "O campo assunto não pode ser vazio"],
        [{ assunto: "a".repeat(151) }, "O assunto deve ter no máximo 150 caracteres"],
    ])("400 com %p", async (dados, mensagem) => {
        prismaMock.tutoria.findUnique.mockResolvedValue(tutoria() as any);
        await esperaAppErrorAsync(executar(dados), mensagem, 400);
    });

    it("403 quando o tutorado tenta enviar comunicado", async () => {
        prismaMock.tutoria.findUnique.mockResolvedValue(tutoria() as any);
        await esperaAppErrorAsync(executar({ id_aluno: 20, assunto: "Aviso" }), "Somente o tutor pode enviar comunicados", 403);
    });

    it("tutor envia comunicado; tutorado envia mensagem simples", async () => {
        prismaMock.tutoria.findUnique.mockResolvedValue(tutoria() as any);
        prismaMock.mensagem.create.mockResolvedValue({ id_mensagem: 1 } as any);

        await expect(executar({ assunto: " Prova ", texto: " Estudem " })).resolves.toEqual({ id_mensagem: 1, remetente: "tutor" });
        expect(prismaMock.mensagem.create).toHaveBeenCalledWith(expect.objectContaining({
            data: { id_tutoria: 5, id_remetente: 30, assunto: "Prova", texto: "Estudem" }
        }));

        await expect(executar({ id_aluno: 20 })).resolves.toEqual({ id_mensagem: 1, remetente: "tutorado" });
    });
});

describe("ListMensagensTutoriaService", () => {
    const executar = (dados: any = {}) => new ListMensagensTutoriaService().execute({ id_tutoria: 5, id_aluno: 20, ...dados });

    it("403 para tutor revogado", async () => {
        prismaMock.tutoria.findUnique.mockResolvedValue(tutoria({ tutor_sala: { data_revogacao: AGORA, tutor: { id_aluno: 30 } } }) as any);
        await esperaAppErrorAsync(executar({ id_aluno: 30 }), "Seu vínculo de tutor nesta sala foi revogado", 403);
    });

    it("400 com tipo inválido", async () => {
        prismaMock.tutoria.findUnique.mockResolvedValue(tutoria() as any);
        await esperaAppErrorAsync(executar({ tipo: "x" }), "O tipo deve ser comunicado", 400);
    });

    it("identifica o tipo do remetente e filtra comunicados", async () => {
        prismaMock.tutoria.findUnique.mockResolvedValue(tutoria() as any);
        prismaMock.mensagem.findMany.mockResolvedValue([
            { id_mensagem: 1, texto: "a", assunto: null, data_envio: AGORA, id_remetente: 20, remetente: { nome: "Ana" } },
            { id_mensagem: 2, texto: "b", assunto: "X", data_envio: AGORA, id_remetente: 30, remetente: { nome: "Bia" } }
        ] as any);

        const mensagens = await executar({ tipo: "comunicado" });

        expect(mensagens.map((m) => m.remetente)).toEqual([{ tipo: "tutorado", nome: "Ana" }, { tipo: "tutor", nome: "Bia" }]);
        expect(prismaMock.mensagem.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { id_tutoria: 5, assunto: { not: null } } }));
    });
});

describe("ConteudosDominadosService", () => {
    const faixas = [
        { nome: "nao_dominado", nota_min: new Prisma.Decimal("0"), nota_max: new Prisma.Decimal("5.99") },
        { nome: "dominado", nota_min: new Prisma.Decimal("6"), nota_max: new Prisma.Decimal("10") }
    ];
    const nota = (id_conteudo: number, nome: string, valor: string) => ({ valor: new Prisma.Decimal(valor), atividade: { conteudo: { id_conteudo, nome } } });

    it("400 com id_sala inválido", async () => {
        await esperaAppErrorAsync(new ConteudosDominadosService().execute({ id_aluno: ID_ALUNO, id_sala: "x" }), "O id da sala deve ser um número inteiro", 400);
    });

    it("erro interno quando não há faixas cadastradas", async () => {
        prismaMock.nota.findMany.mockResolvedValue([]);
        prismaMock.faixa_desempenho.findMany.mockResolvedValue([]);
        await expect(new ConteudosDominadosService().execute({ id_aluno: ID_ALUNO })).rejects.toThrow("faixas de desempenho não cadastradas");
    });

    it("erro interno quando a média cai fora de todas as faixas", async () => {
        prismaMock.nota.findMany.mockResolvedValue([nota(1, "Clima", "8")] as any);
        prismaMock.faixa_desempenho.findMany.mockResolvedValue([faixas[0]] as any);
        await expect(new ConteudosDominadosService().execute({ id_aluno: ID_ALUNO })).rejects.toThrow("faixas de desempenho não cadastradas");
    });

    it("agrupa por conteúdo, calcula a média e classifica (lista vazia nas faixas sem conteúdo)", async () => {
        prismaMock.nota.findMany.mockResolvedValue([nota(1, "Relevo", "5"), nota(1, "Relevo", "6"), nota(2, "Clima", "9"), nota(3, "Biomas", "7")] as any);
        prismaMock.faixa_desempenho.findMany.mockResolvedValue(faixas as any);

        await expect(new ConteudosDominadosService().execute({ id_aluno: ID_ALUNO, id_sala: "1" })).resolves.toEqual({
            nao_dominado: [{ id_conteudo: 1, nome: "Relevo", media: 5.5, quantidade: 2 }],
            dominado: [
                { id_conteudo: 3, nome: "Biomas", media: 7, quantidade: 1 },
                { id_conteudo: 2, nome: "Clima", media: 9, quantidade: 1 }
            ]
        });
    });
});

describe("DesempenhoTutorService", () => {
    const executar = (dados: any = {}) => new DesempenhoTutorService().execute({ id_aluno: ID_ALUNO, email: "a@x", ...dados });

    it("400 com id_sala inválido; 403 sem e-mail", async () => {
        await esperaAppErrorAsync(executar({ id_sala: "x" }), "O id da sala deve ser um número inteiro", 400);
        await esperaAppErrorAsync(executar({ email: "" }), "Acesso permitido somente para tutores com vínculo ativo", 403);
    });

    it("monta indicadores por vínculo, ordenando ativos e anos mais recentes primeiro", async () => {
        prismaMock.tutor_sala.findMany.mockResolvedValue([
            { id_tutor_sala: 1, data_revogacao: AGORA, sala: { ano_letivo: 2026 }, tutorias: [], avaliacoes: [] },
            { id_tutor_sala: 2, data_revogacao: null, sala: { ano_letivo: 2025 }, tutorias: [], avaliacoes: [] },
            {
                id_tutor_sala: 3, data_revogacao: null, sala: { ano_letivo: 2026 },
                tutorias: [{ aluno: { nome: "Caio" }, feedbacks: [
                    { id_feedback: 1, etapa: 1, nota: new Prisma.Decimal("6"), comentario: "", rubrica_file: null, data: new Date("2026-10-01") },
                    { id_feedback: 2, etapa: 2, nota: new Prisma.Decimal("10"), comentario: "", rubrica_file: null, data: new Date("2026-11-01") }
                ] }],
                avaliacoes: [{ id_avaliacao: 1, nota: new Prisma.Decimal("9"), comentario: "Bom", data: AGORA, professor: { nome: "Carlos" } }]
            }
        ] as any);

        const resultado = await executar();

        expect(resultado.map((v) => v.id_tutor_sala)).toEqual([3, 2, 1]);
        const atual = resultado[0]!;
        expect(atual.feedback.media_geral).toBe(8);
        expect(atual.feedback.feedbacks.map((f) => f.id_feedback)).toEqual([2, 1]);
        expect(atual.feedback.feedbacks[0]!.aluno).toEqual({ nome: "Caio" });
        expect(atual.avaliacoes_professor).toEqual(expect.objectContaining({ media_geral: 9, quantidade: 1, avaliacoes: [{ id_avaliacao: 1, nota: 9, comentario: "Bom", data: AGORA, professor: { nome: "Carlos" } }] }));
        expect(resultado[2]!.revogado).toBe(true);
    });
});

describe("ListContestacoesAlunoService", () => {
    it("400 com status inválido", async () => {
        await esperaAppErrorAsync(new ListContestacoesAlunoService().execute({ id_aluno: ID_ALUNO, status: "x" }), "O status deve ser pendente ou aceita ou recusada", 400);
    });

    it("lista as contestações do aluno com valor numérico", async () => {
        prismaMock.contestacao_nota.findMany.mockResolvedValue([{
            id_contestacao: 1, comentario: "c", status: "pendente", data_envio: AGORA, decisao: null, data_resolucao: null,
            nota: { id_nota: 2, valor: new Prisma.Decimal("4.5"), atividade: { id_atividade: 3, titulo: "T", etapa: 1, conteudo: { nome: "C" }, tutor_sala: { tutor: { aluno: { nome: "Bia" } } } } }
        }] as any);

        const [item] = await new ListContestacoesAlunoService().execute({ id_aluno: ID_ALUNO, status: "pendente" });

        expect(item).toEqual(expect.objectContaining({ nota: { id_nota: 2, valor: 4.5 }, tutor: { nome: "Bia" }, atividade: { id_atividade: 3, titulo: "T", etapa: 1, conteudo: { nome: "C" } } }));
        expect(prismaMock.contestacao_nota.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { status: "pendente", nota: { id_aluno: ID_ALUNO } } }));
    });
});

describe("ListSalasAlunoService", () => {
    const buscarMock = buscarImpedimentosPorSala as jest.MockedFunction<typeof buscarImpedimentosPorSala>;

    it("400 com ano inválido", async () => {
        await esperaAppErrorAsync(new ListSalasAlunoService().execute({ id_aluno: ID_ALUNO, ano_letivo: "x" }), "O ano letivo deve ser um número inteiro positivo", 400);
    });

    it("informa se o aluno pode pedir tutoria em cada sala", async () => {
        const liberado = new Date("2026-11-06T14:00:00Z");
        prismaMock.matricula.findMany.mockResolvedValue([
            { sala: { id_sala: 1, nome: "2A", serie: 2, ano_letivo: 2026, professor: { nome: "C" } } },
            { sala: { id_sala: 2, nome: "2B", serie: 2, ano_letivo: 2026, professor: { nome: "C" } } }
        ] as any);
        buscarMock.mockResolvedValue((id_sala: number) => id_sala === 1
            ? { impedimento: null, liberado_em: null }
            : { impedimento: IMPEDIMENTOS_PEDIDO_TUTORIA.recusa_recente, liberado_em: liberado });

        const salas = await new ListSalasAlunoService().execute({ id_aluno: ID_ALUNO, ano_letivo: "2026" });

        expect(salas[0]).toEqual(expect.objectContaining({ id_sala: 1, pode_pedir_tutoria: true, motivo: null, liberado_em: null }));
        expect(salas[1]).toEqual(expect.objectContaining({
            id_sala: 2, pode_pedir_tutoria: false,
            motivo: { codigo: "recusa_recente", mensagem: IMPEDIMENTOS_PEDIDO_TUTORIA.recusa_recente.mensagem },
            liberado_em: "2026-11-06T14:00:00.000Z"
        }));
        expect(prismaMock.matricula.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { id_aluno: ID_ALUNO, sala: { ano_letivo: 2026 } } }));
    });
});
