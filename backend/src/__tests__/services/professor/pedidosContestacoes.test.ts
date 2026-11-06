import { describe, it, expect, jest, afterEach } from "@jest/globals";
import { prismaMock } from "../../mocks/prisma";
import { esperaAppErrorAsync } from "../../utils";
import { Prisma } from "../../../generated/prisma";
import { MENSAGEM_SEM_PERMISSAO_SALA } from "../../../helpers/buscarSalaDoProfessor";
import { ListNotasSalaService } from "../../../services/professor/ListNotasSalaService";
import { ListMateriaisSalaService } from "../../../services/professor/ListMateriaisSalaService";
import { AceitarPedidoTutoriaService } from "../../../services/professor/AceitarPedidoTutoriaService";
import { ListContestacoesService } from "../../../services/professor/ListContestacoesService";
import { ResolverContestacaoService } from "../../../services/professor/ResolverContestacaoService";
import { ListFeedbacksService } from "../../../services/professor/ListFeedbacksService";

const ID_PROFESSOR = 10;
const AGORA = new Date("2026-11-06T12:00:00Z");

afterEach(() => jest.useRealTimers());

function salaDoProfessor(id_professor = ID_PROFESSOR) {
    prismaMock.sala.findUnique.mockResolvedValue({ id_sala: 1, id_professor } as any);
}

// faz o $transaction(async (tx) => ...) rodar com o próprio prismaMock como "tx"
function transacaoComMock() {
    prismaMock.$transaction.mockImplementation(((fn: any) => fn(prismaMock)) as any);
}

describe("ListNotasSalaService", () => {
    const executar = (dados: any = {}) => new ListNotasSalaService().execute({ id_sala: 1, id_professor: ID_PROFESSOR, ...dados });

    it("400 com filtros inválidos", async () => {
        await esperaAppErrorAsync(executar({ id_sala: 0 }), "O id da sala deve ser um número inteiro", 400);
        await esperaAppErrorAsync(executar({ etapa: "9" }), "A etapa deve ser 1, 2 ou 3", 400);
        await esperaAppErrorAsync(executar({ id_conteudo: "x" }), "O id do conteúdo deve ser um número inteiro", 400);
        await esperaAppErrorAsync(executar({ id_aluno: "x" }), "O id do aluno deve ser um número inteiro", 400);
        await esperaAppErrorAsync(executar({ id_tutor_sala: "x" }), "O id do tutor da sala deve ser um número inteiro", 400);
    });

    it("404 / 403 da sala", async () => {
        prismaMock.sala.findUnique.mockResolvedValue(null);
        await esperaAppErrorAsync(executar(), "Sala não encontrada", 404);
        salaDoProfessor(99);
        await esperaAppErrorAsync(executar(), MENSAGEM_SEM_PERMISSAO_SALA, 403);
    });

    it("monta as notas com valor numérico e contestação pendente", async () => {
        salaDoProfessor();
        prismaMock.nota.findMany.mockResolvedValue([{
            id_nota: 1, valor: new Prisma.Decimal("9.25"), comentario: null, data_lancamento: AGORA,
            aluno: { id_aluno: 20, nome: "Ana" },
            atividade: { id_atividade: 4, titulo: "T", tipo: "projeto", etapa: 2, data_entrega: AGORA, conteudo: { id_conteudo: 3, nome: "C" }, tutor_sala: { id_tutor_sala: 5, tutor: { aluno: { nome: "Bia" } } } },
            _count: { contestacoes: 1 }
        }] as any);

        const [nota] = await executar({ etapa: "2", id_aluno: "20" });

        expect(nota).toEqual({
            id_nota: 1, valor: 9.25, comentario: null, data_lancamento: AGORA,
            aluno: { id_aluno: 20, nome: "Ana" },
            atividade: { id_atividade: 4, titulo: "T", tipo: "projeto", etapa: 2, data_entrega: AGORA },
            conteudo: { id_conteudo: 3, nome: "C" },
            tutor: { id_tutor_sala: 5, nome: "Bia" },
            contestacao_pendente: true
        });
        expect(prismaMock.nota.findMany).toHaveBeenCalledWith(expect.objectContaining({
            where: { id_aluno: 20, atividade: { tutor_sala: { id_sala: 1 }, etapa: 2, id_conteudo: undefined, id_tutor_sala: undefined } }
        }));
    });
});

describe("ListMateriaisSalaService", () => {
    const executar = (dados: any = {}) => new ListMateriaisSalaService().execute({ id_sala: 1, id_usuario: 20, email: "u@x", ...dados });
    const material = { id_material: 1, titulo: "M", tutor_sala: { id_tutor_sala: 5, tutor: { aluno: { nome: "Bia" } } } };

    it("400 / 404 / 403 sem e-mail", async () => {
        await esperaAppErrorAsync(executar({ id_sala: 0 }), "O id da sala deve ser um número inteiro", 400);
        prismaMock.sala.findUnique.mockResolvedValue(null);
        await esperaAppErrorAsync(executar(), "Sala não encontrada", 404);
        prismaMock.sala.findUnique.mockResolvedValue({ id_sala: 1 } as any);
        await esperaAppErrorAsync(executar({ email: "" }), MENSAGEM_SEM_PERMISSAO_SALA, 403);
    });

    it("professor vê todos os materiais da sala", async () => {
        prismaMock.sala.findUnique.mockResolvedValue({ id_sala: 1 } as any);
        prismaMock.professor.findFirst.mockResolvedValue({ id_professor: ID_PROFESSOR } as any);
        prismaMock.material.findMany.mockResolvedValue([material] as any);

        await expect(executar()).resolves.toEqual([{ id_material: 1, titulo: "M", tutor: { id_tutor_sala: 5, nome: "Bia" } }]);
        expect(prismaMock.material.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { tutor_sala: { id_sala: 1 } } }));
    });

    it("aluno (tutor ativo ou tutorado) vê só os materiais dos seus vínculos", async () => {
        prismaMock.sala.findUnique.mockResolvedValue({ id_sala: 1 } as any);
        prismaMock.professor.findFirst.mockResolvedValue(null);
        prismaMock.tutor_sala.findMany.mockResolvedValue([{ id_tutor_sala: 5 }, { id_tutor_sala: 6 }] as any);
        prismaMock.material.findMany.mockResolvedValue([]);

        await executar();
        expect(prismaMock.material.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { id_tutor_sala: { in: [5, 6] } } }));
    });

    it("403 para aluno sem vínculo na sala", async () => {
        prismaMock.sala.findUnique.mockResolvedValue({ id_sala: 1 } as any);
        prismaMock.professor.findFirst.mockResolvedValue(null);
        prismaMock.tutor_sala.findMany.mockResolvedValue([]);
        await esperaAppErrorAsync(executar(), MENSAGEM_SEM_PERMISSAO_SALA, 403);
    });
});

describe("AceitarPedidoTutoriaService", () => {
    const executar = (dados: any = {}) => new AceitarPedidoTutoriaService().execute({ id_pedido: 5, id_sala: 1, id_professor: ID_PROFESSOR, ...dados });
    const pedido = (dados: any = {}) => ({ id_pedido: 5, id_aluno: 20, id_sala: 1, status: "pendente", ...dados });

    // deixa tudo pronto até a transação
    function prepararAteTransacao() {
        prismaMock.pedido_tutoria.findUnique.mockResolvedValue(pedido() as any);
        salaDoProfessor();
        prismaMock.matricula.findUnique.mockResolvedValue({ id_matricula: 1 } as any);
        transacaoComMock();
    }

    it("400 com ids inválidos", async () => {
        await esperaAppErrorAsync(executar({ id_pedido: 0 }), "O id do pedido deve ser um número inteiro", 400);
        await esperaAppErrorAsync(executar({ id_sala: undefined }), "O campo id_sala é obrigatório e deve ser um número inteiro", 400);
    });

    it("404 / 409 decidido / 403 sala de outro professor / 400 outra sala / 400 não matriculado", async () => {
        prismaMock.pedido_tutoria.findUnique.mockResolvedValue(null);
        await esperaAppErrorAsync(executar(), "Pedido de tutoria não encontrado", 404);

        prismaMock.pedido_tutoria.findUnique.mockResolvedValue(pedido({ status: "recusado" }) as any);
        await esperaAppErrorAsync(executar(), "Este pedido já foi decidido", 409);

        prismaMock.pedido_tutoria.findUnique.mockResolvedValue(pedido() as any);
        salaDoProfessor(99);
        await esperaAppErrorAsync(executar(), MENSAGEM_SEM_PERMISSAO_SALA, 403);

        salaDoProfessor();
        prismaMock.pedido_tutoria.findUnique.mockResolvedValue(pedido({ id_sala: 2 }) as any);
        await esperaAppErrorAsync(executar(), "Este pedido foi feito para outra sala", 400);

        prismaMock.pedido_tutoria.findUnique.mockResolvedValue(pedido() as any);
        prismaMock.matricula.findUnique.mockResolvedValue(null);
        await esperaAppErrorAsync(executar(), "O aluno não está matriculado nesta sala", 400);
    });

    it("aceite cria o registro de Tutor (só agora) e o vínculo Tutor_sala sem permissão de criar atividade", async () => {
        jest.useFakeTimers().setSystemTime(AGORA);
        prepararAteTransacao();
        prismaMock.pedido_tutoria.updateMany.mockResolvedValue({ count: 1 });
        prismaMock.tutor.findUnique.mockResolvedValue(null);
        prismaMock.tutor.create.mockResolvedValue({ id_tutor: 8 } as any);
        prismaMock.tutor_sala.findFirst.mockResolvedValue(null);
        prismaMock.tutor_sala.create.mockResolvedValue({ id_tutor_sala: 3 } as any);
        prismaMock.pedido_tutoria.findUnique
            .mockResolvedValueOnce(pedido() as any)
            .mockResolvedValueOnce(pedido({ status: "aceito" }) as any);

        await expect(executar()).resolves.toEqual({ pedido: pedido({ status: "aceito" }), tutor_sala: { id_tutor_sala: 3 } });
        expect(prismaMock.pedido_tutoria.updateMany).toHaveBeenCalledWith({
            where: { id_pedido: 5, status: "pendente" },
            data: { status: "aceito", data_decisao: AGORA, id_professor: ID_PROFESSOR }
        });
        expect(prismaMock.tutor.create).toHaveBeenCalledWith(expect.objectContaining({ data: { id_aluno: 20, id_pedido: 5 } }));
        expect(prismaMock.tutor_sala.create).toHaveBeenCalledWith(expect.objectContaining({ data: { id_tutor: 8, id_sala: 1, pode_criar_ativ: false } }));
    });

    it("reaproveita o Tutor quando o aluno já é tutor em outra sala", async () => {
        prepararAteTransacao();
        prismaMock.pedido_tutoria.updateMany.mockResolvedValue({ count: 1 });
        prismaMock.tutor.findUnique.mockResolvedValue({ id_tutor: 8 } as any);
        prismaMock.tutor_sala.findFirst.mockResolvedValue(null);
        prismaMock.tutor_sala.create.mockResolvedValue({ id_tutor_sala: 4 } as any);

        await executar();
        expect(prismaMock.tutor.create).not.toHaveBeenCalled();
    });

    it("409 se decidido ao mesmo tempo ou se já é tutor na sala", async () => {
        prepararAteTransacao();
        prismaMock.pedido_tutoria.updateMany.mockResolvedValue({ count: 0 });
        await esperaAppErrorAsync(executar(), "Este pedido já foi decidido", 409);

        prismaMock.pedido_tutoria.updateMany.mockResolvedValue({ count: 1 });
        prismaMock.tutor.findUnique.mockResolvedValue({ id_tutor: 8 } as any);
        prismaMock.tutor_sala.findFirst.mockResolvedValue({ id_tutor_sala: 1 } as any);
        await esperaAppErrorAsync(executar(), "Este aluno já é tutor nesta sala", 409);
    });

    it("409 com P2002; outros erros sobem", async () => {
        prismaMock.pedido_tutoria.findUnique.mockResolvedValue(pedido() as any);
        salaDoProfessor();
        prismaMock.matricula.findUnique.mockResolvedValue({ id_matricula: 1 } as any);
        prismaMock.$transaction.mockRejectedValue(new Prisma.PrismaClientKnownRequestError("dup", { code: "P2002", clientVersion: "6" }));
        await esperaAppErrorAsync(executar(), "Este aluno já é tutor", 409);

        prismaMock.$transaction.mockRejectedValue(new Error("banco fora"));
        await expect(executar()).rejects.toThrow("banco fora");
    });
});

describe("ListContestacoesService", () => {
    const executar = (dados: any = {}) => new ListContestacoesService().execute({ id_usuario: 10, email: "u@x", ...dados });
    const SEM_PERMISSAO = "Você não tem permissão para listar contestações";

    it("400 com status ou sala inválidos; 403 sem e-mail", async () => {
        await esperaAppErrorAsync(executar({ status: "x" }), "O status deve ser pendente ou aceita ou recusada", 400);
        await esperaAppErrorAsync(executar({ id_sala: "x" }), "O id da sala deve ser um número inteiro", 400);
        await esperaAppErrorAsync(executar({ email: "" }), SEM_PERMISSAO, 403);
    });

    it("professor: filtra pelas salas dele", async () => {
        prismaMock.professor.findFirst.mockResolvedValue({ id_professor: 10 } as any);
        prismaMock.contestacao_nota.findMany.mockResolvedValue([{
            id_contestacao: 1, comentario: "c", status: "pendente", data_envio: AGORA, decisao: null, data_resolucao: null,
            nota: {
                id_nota: 2, valor: new Prisma.Decimal("5"), aluno: { id_aluno: 20, nome: "Ana" },
                atividade: { id_atividade: 3, titulo: "T", etapa: 1, conteudo: { nome: "C" }, tutor_sala: { id_tutor_sala: 4, sala: { id_sala: 1, nome: "2A" }, tutor: { aluno: { nome: "Bia" } } } }
            }
        }] as any);

        const [contestacao] = await executar({ status: "pendente", id_sala: "1" });

        expect(contestacao).toEqual(expect.objectContaining({
            nota: { id_nota: 2, valor: 5 },
            sala: { id_sala: 1, nome: "2A" },
            tutor: { id_tutor_sala: 4, nome: "Bia" }
        }));
        expect(prismaMock.contestacao_nota.findMany).toHaveBeenCalledWith(expect.objectContaining({
            where: { status: "pendente", nota: { atividade: { tutor_sala: { AND: [{ sala: { id_professor: 10 } }, { id_sala: 1 }] } } } }
        }));
    });

    it("tutor ativo: filtra pelos vínculos ativos dele; sem vínculo recebe 403", async () => {
        prismaMock.professor.findFirst.mockResolvedValue(null);
        prismaMock.tutor_sala.count.mockResolvedValue(1);
        prismaMock.contestacao_nota.findMany.mockResolvedValue([]);
        await expect(executar()).resolves.toEqual([]);

        prismaMock.tutor_sala.count.mockResolvedValue(0);
        await esperaAppErrorAsync(executar(), SEM_PERMISSAO, 403);
    });
});

describe("ResolverContestacaoService", () => {
    const executar = (dados: any = {}) => new ResolverContestacaoService().execute({ id_contestacao: 1, id_usuario: 10, email: "u@x", status: "recusada", decisao: "Mantida", ...dados });
    const SEM_PERMISSAO = "Você não tem permissão para resolver esta contestação";
    const contestacao = (dados: any = {}) => ({
        status: "pendente", id_nota: 7,
        nota: { atividade: { tutor_sala: { data_revogacao: null, sala: { id_professor: 10 }, tutor: { aluno: { id_aluno: 30, email: "tutor@x" } } } } },
        ...dados
    });

    it.each([
        [{ id_contestacao: 0 }, "O id da contestação deve ser um número inteiro"],
        [{ status: "pendente" }, "O status deve ser aceita ou recusada"],
        [{ decisao: " " }, "O campo decisao é obrigatório"],
        [{ status: "aceita" }, "O campo valor é obrigatório quando a contestação é aceita e deve ser um número"],
        [{ status: "aceita", valor: 12 }, "O valor deve estar entre 0 e 10"],
        [{ status: "recusada", valor: 5 }, "O campo valor só pode ser enviado quando a contestação é aceita"],
    ])("400 com %p", async (dados, mensagem) => {
        await esperaAppErrorAsync(executar(dados), mensagem, 400);
    });

    it("404 / 403 sem e-mail / 403 sem permissão / 409 já resolvida", async () => {
        prismaMock.contestacao_nota.findUnique.mockResolvedValue(null);
        await esperaAppErrorAsync(executar(), "Contestação não encontrada", 404);

        prismaMock.contestacao_nota.findUnique.mockResolvedValue(contestacao() as any);
        await esperaAppErrorAsync(executar({ email: "" }), SEM_PERMISSAO, 403);

        prismaMock.professor.findFirst.mockResolvedValue({ id_professor: 99 } as any);
        await esperaAppErrorAsync(executar(), SEM_PERMISSAO, 403);

        prismaMock.professor.findFirst.mockResolvedValue({ id_professor: 10 } as any);
        prismaMock.contestacao_nota.findUnique.mockResolvedValue(contestacao({ status: "aceita" }) as any);
        await esperaAppErrorAsync(executar(), "Esta contestação já foi resolvida", 409);
    });

    it("tutor revogado não resolve; tutor criador ativo resolve", async () => {
        prismaMock.professor.findFirst.mockResolvedValue(null);
        const revogada = contestacao();
        revogada.nota.atividade.tutor_sala.data_revogacao = AGORA as any;
        prismaMock.contestacao_nota.findUnique.mockResolvedValue(revogada as any);
        await esperaAppErrorAsync(executar({ id_usuario: 30, email: "tutor@x" }), SEM_PERMISSAO, 403);

        prismaMock.contestacao_nota.findUnique.mockResolvedValue(contestacao() as any);
        transacaoComMock();
        prismaMock.contestacao_nota.updateMany.mockResolvedValue({ count: 1 });
        prismaMock.contestacao_nota.findUniqueOrThrow.mockResolvedValue({ id_contestacao: 1, status: "recusada", decisao: "Mantida", data_resolucao: AGORA, nota: { id_nota: 7, valor: new Prisma.Decimal("5") } } as any);
        await expect(executar({ id_usuario: 30, email: "tutor@x" })).resolves.toEqual(expect.objectContaining({ status: "recusada" }));
        expect(prismaMock.nota.update).not.toHaveBeenCalled();
    });

    it("professor aceita: atualiza a nota com o novo valor", async () => {
        jest.useFakeTimers().setSystemTime(AGORA);
        prismaMock.contestacao_nota.findUnique.mockResolvedValue(contestacao() as any);
        prismaMock.professor.findFirst.mockResolvedValue({ id_professor: 10 } as any);
        transacaoComMock();
        prismaMock.contestacao_nota.updateMany.mockResolvedValue({ count: 1 });
        prismaMock.contestacao_nota.findUniqueOrThrow.mockResolvedValue({ id_contestacao: 1, status: "aceita", decisao: "Revista", data_resolucao: AGORA, nota: { id_nota: 7, valor: new Prisma.Decimal("8.5") } } as any);

        await expect(executar({ status: "aceita", decisao: " Revista ", valor: 8.5 })).resolves.toEqual({
            id_contestacao: 1, status: "aceita", decisao: "Revista", data_resolucao: AGORA, nota: { id_nota: 7, valor: 8.5 }
        });
        expect(prismaMock.contestacao_nota.updateMany).toHaveBeenCalledWith({
            where: { id_contestacao: 1, status: "pendente" },
            data: { status: "aceita", decisao: "Revista", data_resolucao: AGORA }
        });
        expect(prismaMock.nota.update).toHaveBeenCalledWith({ where: { id_nota: 7 }, data: { valor: 8.5 } });
    });

    it("409 se resolvida ao mesmo tempo", async () => {
        prismaMock.contestacao_nota.findUnique.mockResolvedValue(contestacao() as any);
        prismaMock.professor.findFirst.mockResolvedValue({ id_professor: 10 } as any);
        transacaoComMock();
        prismaMock.contestacao_nota.updateMany.mockResolvedValue({ count: 0 });
        await esperaAppErrorAsync(executar(), "Esta contestação já foi resolvida", 409);
    });
});

describe("ListFeedbacksService", () => {
    const executar = (dados: any = {}) => new ListFeedbacksService().execute({ id_usuario: 10, email: "u@x", ...dados });
    const SEM_PERMISSAO = "Você não tem permissão para listar feedbacks";

    it("400 com filtros inválidos; 403 sem e-mail", async () => {
        await esperaAppErrorAsync(executar({ etapa: "0" }), "A etapa deve ser 1, 2 ou 3", 400);
        await esperaAppErrorAsync(executar({ ano: "x" }), "O ano deve ser um número inteiro", 400);
        await esperaAppErrorAsync(executar({ id_aluno: "x" }), "O id do aluno deve ser um número inteiro", 400);
        await esperaAppErrorAsync(executar({ id_sala: "x" }), "O id da sala deve ser um número inteiro", 400);
        await esperaAppErrorAsync(executar({ id_tutor_sala: "x" }), "O id do tutor da sala deve ser um número inteiro", 400);
        await esperaAppErrorAsync(executar({ email: "" }), SEM_PERMISSAO, 403);
    });

    it("professor: resumo e lista com nota numérica", async () => {
        prismaMock.professor.findFirst.mockResolvedValue({ id_professor: 10 } as any);
        prismaMock.feedback.aggregate.mockResolvedValue({ _count: { _all: 1 }, _avg: { nota: new Prisma.Decimal("9") } } as any);
        prismaMock.feedback.findMany.mockResolvedValue([{
            id_feedback: 1, id_tutoria: 2, etapa: 1, nota: new Prisma.Decimal("9"), comentario: "Bom", rubrica_file: null, data: AGORA,
            tutoria: { aluno: { id_aluno: 20, nome: "Ana" }, tutor_sala: { id_tutor_sala: 4, sala: { id_sala: 1, nome: "2A", serie: 2, ano_letivo: 2026 }, tutor: { aluno: { nome: "Bia" } } } }
        }] as any);

        const resultado = await executar({ ano: "2026", etapa: "1" });

        expect(resultado.resumo).toEqual({ total_feedbacks: 1, media_notas: 9 });
        expect(resultado.feedbacks[0]).toEqual(expect.objectContaining({ nota: 9, tutor: { id_tutor_sala: 4, nome: "Bia" }, aluno: { id_aluno: 20, nome: "Ana" } }));
        expect((prismaMock.feedback.findMany.mock.calls[0] as any)[0].where).toEqual({
            etapa: 1,
            tutoria: { id_aluno: undefined, tutor_sala: { AND: [{ id_sala: undefined, id_tutor_sala: undefined, sala: { id_professor: 10 } }, { sala: { ano_letivo: 2026 } }] } }
        });
    });

    it("tutor sem vínculo ativo: 403; com vínculo: média null quando vazio", async () => {
        prismaMock.professor.findFirst.mockResolvedValue(null);
        prismaMock.tutor_sala.count.mockResolvedValue(0);
        await esperaAppErrorAsync(executar(), SEM_PERMISSAO, 403);

        prismaMock.tutor_sala.count.mockResolvedValue(1);
        prismaMock.feedback.aggregate.mockResolvedValue({ _count: { _all: 0 }, _avg: { nota: null } } as any);
        prismaMock.feedback.findMany.mockResolvedValue([]);
        await expect(executar()).resolves.toEqual({ resumo: { total_feedbacks: 0, media_notas: null }, feedbacks: [] });
    });
});
