import { describe, it, expect, jest, afterEach } from "@jest/globals";
import { prismaMock } from "../../mocks/prisma";
import { esperaAppErrorAsync } from "../../utils";
import { Prisma } from "../../../generated/prisma";
import { MENSAGEM_SEM_PERMISSAO_SALA } from "../../../helpers/buscarSalaDoProfessor";
import { ListAvaliacoesTutorService } from "../../../services/professor/ListAvaliacoesTutorService";
import { CreateMatriculaService } from "../../../services/professor/CreateMatriculaService";
import { RevogarTutorSalaService } from "../../../services/professor/RevogarTutorSalaService";
import { ReabrirTutoriaService } from "../../../services/professor/ReabrirTutoriaService";
import { DesempenhoTutoresSalaService } from "../../../services/professor/DesempenhoTutoresSalaService";
import { CreateTutoriaService } from "../../../services/professor/CreateTutoriaService";

const ID_PROFESSOR = 10;
const AGORA = new Date("2026-11-06T12:00:00Z");

afterEach(() => jest.useRealTimers());

describe("ListAvaliacoesTutorService", () => {
    const executar = (id_tutor_sala = 3) => new ListAvaliacoesTutorService().execute({ id_tutor_sala, id_professor: ID_PROFESSOR });
    const tutorSala = (id_professor = ID_PROFESSOR, data_revogacao: Date | null = null) => ({
        id_tutor_sala: 3, data_revogacao, tutor: { aluno: { nome: "Ana" } }, sala: { id_professor, nome: "2A", serie: 2 }
    });

    it("400 / 404 / 403", async () => {
        await esperaAppErrorAsync(executar(0), "O id do tutor da sala deve ser um número inteiro", 400);
        prismaMock.tutor_sala.findUnique.mockResolvedValue(null);
        await esperaAppErrorAsync(executar(), "Tutor da sala não encontrado", 404);
        prismaMock.tutor_sala.findUnique.mockResolvedValue(tutorSala(99) as any);
        await esperaAppErrorAsync(executar(), MENSAGEM_SEM_PERMISSAO_SALA, 403);
    });

    it("monta resumo e converte Decimal para número", async () => {
        prismaMock.tutor_sala.findUnique.mockResolvedValue(tutorSala(ID_PROFESSOR, AGORA) as any);
        prismaMock.avaliacao_tutor.aggregate.mockResolvedValue({ _count: { _all: 2 }, _avg: { nota: new Prisma.Decimal("7.75") } } as any);
        prismaMock.avaliacao_tutor.findMany.mockResolvedValue([{ id_avaliacao: 1, nota: new Prisma.Decimal("8.5") }] as any);

        const resultado = await executar();

        expect(resultado.tutor).toEqual({ id_tutor_sala: 3, nome: "Ana", sala: { nome: "2A", serie: 2 }, revogado: true, data_revogacao: AGORA });
        expect(resultado.resumo).toEqual({ total_avaliacoes: 2, media_notas: 7.75 });
        expect(resultado.avaliacoes).toEqual([{ id_avaliacao: 1, nota: 8.5 }]);
    });

    it("média null quando não há avaliações", async () => {
        prismaMock.tutor_sala.findUnique.mockResolvedValue(tutorSala() as any);
        prismaMock.avaliacao_tutor.aggregate.mockResolvedValue({ _count: { _all: 0 }, _avg: { nota: null } } as any);
        prismaMock.avaliacao_tutor.findMany.mockResolvedValue([]);

        const resultado = await executar();
        expect(resultado.resumo).toEqual({ total_avaliacoes: 0, media_notas: null });
        expect(resultado.tutor.revogado).toBe(false);
    });
});

describe("CreateMatriculaService", () => {
    const executar = (dados: any = {}) => new CreateMatriculaService().execute({ id_sala: 1, id_aluno: 20, id_professor: ID_PROFESSOR, ...dados });
    const sala = (id_professor = ID_PROFESSOR) => ({ id_sala: 1, id_professor, ano_letivo: 2026 });

    it("400 / 404 / 403 da sala", async () => {
        await esperaAppErrorAsync(executar({ id_sala: 0 }), "O id da sala deve ser um número inteiro", 400);
        prismaMock.sala.findUnique.mockResolvedValue(null);
        await esperaAppErrorAsync(executar(), "Sala não encontrada", 404);
        prismaMock.sala.findUnique.mockResolvedValue(sala(99) as any);
        await esperaAppErrorAsync(executar(), MENSAGEM_SEM_PERMISSAO_SALA, 403);
    });

    it("400 sem id_aluno e 404 aluno inexistente", async () => {
        prismaMock.sala.findUnique.mockResolvedValue(sala() as any);
        await esperaAppErrorAsync(executar({ id_aluno: undefined }), "O campo id_aluno é obrigatório e deve ser um número inteiro", 400);
        prismaMock.aluno.findUnique.mockResolvedValue(null);
        await esperaAppErrorAsync(executar(), "Aluno não encontrado", 404);
    });

    it("409 já matriculado na sala ou em outra sala do mesmo ano", async () => {
        prismaMock.sala.findUnique.mockResolvedValue(sala() as any);
        prismaMock.aluno.findUnique.mockResolvedValue({ id_aluno: 20 } as any);
        prismaMock.matricula.findUnique.mockResolvedValue({ id_matricula: 1 } as any);
        await esperaAppErrorAsync(executar(), "Aluno já matriculado nesta sala", 409);

        prismaMock.matricula.findUnique.mockResolvedValue(null);
        prismaMock.matricula.findFirst.mockResolvedValue({ id_matricula: 2 } as any);
        await esperaAppErrorAsync(executar(), "Aluno já matriculado em outra sala no ano letivo 2026", 409);
    });

    it("matricula (id_aluno pode vir como texto)", async () => {
        prismaMock.sala.findUnique.mockResolvedValue(sala() as any);
        prismaMock.aluno.findUnique.mockResolvedValue({ id_aluno: 20 } as any);
        prismaMock.matricula.findUnique.mockResolvedValue(null);
        prismaMock.matricula.findFirst.mockResolvedValue(null);
        prismaMock.matricula.create.mockResolvedValue({ id_matricula: 5, id_aluno: 20, id_sala: 1 } as any);

        await expect(executar({ id_aluno: "20" })).resolves.toEqual({ id_matricula: 5, id_aluno: 20, id_sala: 1 });
        expect(prismaMock.matricula.create).toHaveBeenCalledWith(expect.objectContaining({ data: { id_aluno: 20, id_sala: 1 } }));
    });

    it("409 com P2002 (corrida); outros erros sobem", async () => {
        prismaMock.sala.findUnique.mockResolvedValue(sala() as any);
        prismaMock.aluno.findUnique.mockResolvedValue({ id_aluno: 20 } as any);
        prismaMock.matricula.findUnique.mockResolvedValue(null);
        prismaMock.matricula.findFirst.mockResolvedValue(null);
        prismaMock.matricula.create.mockRejectedValue(new Prisma.PrismaClientKnownRequestError("dup", { code: "P2002", clientVersion: "6" }));
        await esperaAppErrorAsync(executar(), "Aluno já matriculado nesta sala", 409);

        prismaMock.matricula.create.mockRejectedValue(new Error("banco fora"));
        await expect(executar()).rejects.toThrow("banco fora");
    });
});

describe("RevogarTutorSalaService", () => {
    const executar = (id_tutor_sala = 3) => new RevogarTutorSalaService().execute({ id_tutor_sala, id_professor: ID_PROFESSOR });
    const tutorSala = (id_professor = ID_PROFESSOR, data_revogacao: Date | null = null) => ({ id_tutor_sala: 3, data_revogacao, sala: { id_professor } });

    it("400 / 404 / 403 / 409 já revogado", async () => {
        await esperaAppErrorAsync(executar(0), "O id do tutor da sala deve ser um número inteiro", 400);
        prismaMock.tutor_sala.findUnique.mockResolvedValue(null);
        await esperaAppErrorAsync(executar(), "Tutor da sala não encontrado", 404);
        prismaMock.tutor_sala.findUnique.mockResolvedValue(tutorSala(99) as any);
        await esperaAppErrorAsync(executar(), MENSAGEM_SEM_PERMISSAO_SALA, 403);
        prismaMock.tutor_sala.findUnique.mockResolvedValue(tutorSala(ID_PROFESSOR, AGORA) as any);
        await esperaAppErrorAsync(executar(), "Este tutor já foi revogado nesta sala", 409);
    });

    it("409 com contestações pendentes", async () => {
        prismaMock.tutor_sala.findUnique.mockResolvedValue(tutorSala() as any);
        prismaMock.contestacao_nota.count.mockResolvedValue(2);
        await esperaAppErrorAsync(executar(), "Não é possível revogar o tutor: há 2 contestações de nota pendentes", 409);
        prismaMock.contestacao_nota.count.mockResolvedValue(1);
        await esperaAppErrorAsync(executar(), "Não é possível revogar o tutor: há 1 contestação de nota pendente", 409);
    });

    it("revoga e finaliza as tutorias ativas na mesma transação", async () => {
        jest.useFakeTimers().setSystemTime(AGORA);
        prismaMock.tutor_sala.findUnique
            .mockResolvedValueOnce(tutorSala() as any)
            .mockResolvedValueOnce({ id_tutor_sala: 3, data_revogacao: AGORA } as any);
        prismaMock.contestacao_nota.count.mockResolvedValue(0);
        prismaMock.$transaction.mockImplementation(((fn: any) => fn(prismaMock)) as any);
        prismaMock.tutor_sala.updateMany.mockResolvedValue({ count: 1 });
        prismaMock.tutoria.updateMany.mockResolvedValue({ count: 2 });

        await expect(executar()).resolves.toEqual({ tutor_sala: { id_tutor_sala: 3, data_revogacao: AGORA }, tutorias_finalizadas: 2 });
        expect(prismaMock.tutor_sala.updateMany).toHaveBeenCalledWith({ where: { id_tutor_sala: 3, data_revogacao: null }, data: { data_revogacao: AGORA } });
        expect(prismaMock.tutoria.updateMany).toHaveBeenCalledWith({ where: { id_tutor_sala: 3, status: "ativa" }, data: { status: "finalizada", data_fim: AGORA } });
    });

    it("409 se revogado ao mesmo tempo (nada finalizado)", async () => {
        prismaMock.tutor_sala.findUnique.mockResolvedValue(tutorSala() as any);
        prismaMock.contestacao_nota.count.mockResolvedValue(0);
        prismaMock.$transaction.mockImplementation(((fn: any) => fn(prismaMock)) as any);
        prismaMock.tutor_sala.updateMany.mockResolvedValue({ count: 0 });

        await esperaAppErrorAsync(executar(), "Este tutor já foi revogado nesta sala", 409);
        expect(prismaMock.tutoria.updateMany).not.toHaveBeenCalled();
    });
});

describe("ReabrirTutoriaService", () => {
    const executar = (id_tutoria = 2) => new ReabrirTutoriaService().execute({ id_tutoria, id_professor: ID_PROFESSOR });
    const tutoria = (dados: any = {}) => ({
        id_tutoria: 2, status: "finalizada", id_aluno: 20,
        tutor_sala: { id_sala: 1, data_revogacao: null, sala: { id_professor: ID_PROFESSOR, ano_letivo: 2026 } },
        ...dados
    });

    it("400 / 404 / 403 / 409 já ativa", async () => {
        await esperaAppErrorAsync(executar(0), "O id da tutoria deve ser um número inteiro", 400);
        prismaMock.tutoria.findUnique.mockResolvedValue(null);
        await esperaAppErrorAsync(executar(), "Tutoria não encontrada", 404);
        prismaMock.tutoria.findUnique.mockResolvedValue(tutoria({ tutor_sala: { id_sala: 1, data_revogacao: null, sala: { id_professor: 99, ano_letivo: 2026 } } }) as any);
        await esperaAppErrorAsync(executar(), MENSAGEM_SEM_PERMISSAO_SALA, 403);
        prismaMock.tutoria.findUnique.mockResolvedValue(tutoria({ status: "ativa" }) as any);
        await esperaAppErrorAsync(executar(), "Esta tutoria já está ativa", 409);
    });

    it("409 de outro ano letivo, tutor revogado ou outra tutoria ativa", async () => {
        jest.useFakeTimers().setSystemTime(AGORA);

        prismaMock.tutoria.findUnique.mockResolvedValue(tutoria({ tutor_sala: { id_sala: 1, data_revogacao: null, sala: { id_professor: ID_PROFESSOR, ano_letivo: 2025 } } }) as any);
        await esperaAppErrorAsync(executar(), "Não é possível reabrir a tutoria: ela é de outro ano letivo (2025)", 409);

        prismaMock.tutoria.findUnique.mockResolvedValue(tutoria({ tutor_sala: { id_sala: 1, data_revogacao: AGORA, sala: { id_professor: ID_PROFESSOR, ano_letivo: 2026 } } }) as any);
        await esperaAppErrorAsync(executar(), "Não é possível reabrir a tutoria: o tutor foi revogado", 409);

        prismaMock.tutoria.findUnique.mockResolvedValue(tutoria() as any);
        prismaMock.tutoria.findFirst.mockResolvedValue({ id_tutoria: 9 } as any);
        await esperaAppErrorAsync(executar(), "Não é possível reabrir a tutoria: o aluno já tem outra tutoria ativa nesta sala", 409);
    });

    it("409 se reaberta ao mesmo tempo", async () => {
        jest.useFakeTimers().setSystemTime(AGORA);
        prismaMock.tutoria.findUnique.mockResolvedValue(tutoria() as any);
        prismaMock.tutoria.findFirst.mockResolvedValue(null);
        prismaMock.tutoria.updateMany.mockResolvedValue({ count: 0 });
        await esperaAppErrorAsync(executar(), "Esta tutoria já está ativa", 409);
    });

    it("reabre limpando data_fim", async () => {
        jest.useFakeTimers().setSystemTime(AGORA);
        prismaMock.tutoria.findUnique
            .mockResolvedValueOnce(tutoria() as any)
            .mockResolvedValueOnce({ id_tutoria: 2, status: "ativa", data_fim: null } as any);
        prismaMock.tutoria.findFirst.mockResolvedValue(null);
        prismaMock.tutoria.updateMany.mockResolvedValue({ count: 1 });

        await expect(executar()).resolves.toEqual({ id_tutoria: 2, status: "ativa", data_fim: null });
        expect(prismaMock.tutoria.updateMany).toHaveBeenCalledWith({ where: { id_tutoria: 2, status: "finalizada" }, data: { status: "ativa", data_fim: null } });
    });
});

describe("DesempenhoTutoresSalaService", () => {
    const executar = (id_sala = 1) => new DesempenhoTutoresSalaService().execute({ id_sala, id_professor: ID_PROFESSOR });

    it("400 / 404 / 403", async () => {
        await esperaAppErrorAsync(executar(0), "O id da sala deve ser um número inteiro", 400);
        prismaMock.sala.findUnique.mockResolvedValue(null);
        await esperaAppErrorAsync(executar(), "Sala não encontrada", 404);
        prismaMock.sala.findUnique.mockResolvedValue({ id_sala: 1, id_professor: 99 } as any);
        await esperaAppErrorAsync(executar(), MENSAGEM_SEM_PERMISSAO_SALA, 403);
    });

    it("lista vazia sem tutores (não consulta feedback)", async () => {
        prismaMock.sala.findUnique.mockResolvedValue({ id_sala: 1, id_professor: ID_PROFESSOR } as any);
        prismaMock.tutor_sala.findMany.mockResolvedValue([]);
        await expect(executar()).resolves.toEqual([]);
        expect(prismaMock.feedback.findMany).not.toHaveBeenCalled();
    });

    it("agrupa por tutor, ordena ativos antes dos revogados e por nome", async () => {
        prismaMock.sala.findUnique.mockResolvedValue({ id_sala: 1, id_professor: ID_PROFESSOR } as any);
        prismaMock.tutor_sala.findMany.mockResolvedValue([
            { id_tutor_sala: 1, data_revogacao: AGORA, tutor: { aluno: { nome: "Ana" } } },
            { id_tutor_sala: 2, data_revogacao: null, tutor: { aluno: { nome: "Caio" } } },
            { id_tutor_sala: 3, data_revogacao: null, tutor: { aluno: { nome: "Bia" } } }
        ] as any);
        prismaMock.feedback.findMany.mockResolvedValue([
            { etapa: 1, nota: new Prisma.Decimal("8"), tutoria: { id_tutor_sala: 2 } },
            { etapa: 2, nota: new Prisma.Decimal("6"), tutoria: { id_tutor_sala: 2 } }
        ] as any);
        prismaMock.avaliacao_tutor.findMany.mockResolvedValue([{ id_tutor_sala: 3, nota: new Prisma.Decimal("9") }] as any);

        const resultado = await executar();

        expect(resultado.map((t) => t.nome)).toEqual(["Bia", "Caio", "Ana"]);
        const caio = resultado.find((t) => t.nome === "Caio")!;
        expect(caio.feedback.media_geral).toBe(7);
        expect(caio.feedback.quantidade).toBe(2);
        const bia = resultado.find((t) => t.nome === "Bia")!;
        expect(bia.avaliacoes_professor).toEqual({ media_geral: 9, quantidade: 1 });
        expect(resultado[2]!.revogado).toBe(true);
    });
});

describe("CreateTutoriaService", () => {
    const executar = (dados: any = {}) => new CreateTutoriaService().execute({ id_tutor_sala: 3, id_aluno: 20, meta_aprendizagem: "Meta", id_professor: ID_PROFESSOR, ...dados });
    const tutorSala = (dados: any = {}) => ({ id_tutor_sala: 3, id_sala: 1, data_revogacao: null, tutor: { id_aluno: 30 }, sala: { id_professor: ID_PROFESSOR }, ...dados });

    it.each([
        [{ id_tutor_sala: undefined }, "O campo id_tutor_sala é obrigatório e deve ser um número inteiro"],
        [{ id_aluno: "x" }, "O campo id_aluno é obrigatório e deve ser um número inteiro"],
        [{ meta_aprendizagem: "" }, "O campo meta_aprendizagem é obrigatório"],
    ])("400 com %p", async (dados, mensagem) => {
        await esperaAppErrorAsync(executar(dados), mensagem, 400);
    });

    it("404 tutor inexistente ou revogado; 403 outro professor", async () => {
        prismaMock.tutor_sala.findUnique.mockResolvedValue(null);
        await esperaAppErrorAsync(executar(), "Tutor da sala não encontrado ou revogado", 404);
        prismaMock.tutor_sala.findUnique.mockResolvedValue(tutorSala({ data_revogacao: AGORA }) as any);
        await esperaAppErrorAsync(executar(), "Tutor da sala não encontrado ou revogado", 404);
        prismaMock.tutor_sala.findUnique.mockResolvedValue(tutorSala({ sala: { id_professor: 99 } }) as any);
        await esperaAppErrorAsync(executar(), MENSAGEM_SEM_PERMISSAO_SALA, 403);
    });

    it("404 aluno inexistente; 400 tutor de si mesmo; 400 não matriculado; 409 tutoria ativa", async () => {
        prismaMock.tutor_sala.findUnique.mockResolvedValue(tutorSala() as any);
        prismaMock.aluno.findUnique.mockResolvedValue(null);
        await esperaAppErrorAsync(executar(), "Aluno não encontrado", 404);

        prismaMock.aluno.findUnique.mockResolvedValue({ id_aluno: 30 } as any);
        await esperaAppErrorAsync(executar({ id_aluno: 30 }), "O tutor não pode ser tutor de si mesmo", 400);

        prismaMock.aluno.findUnique.mockResolvedValue({ id_aluno: 20 } as any);
        prismaMock.matricula.findUnique.mockResolvedValue(null);
        await esperaAppErrorAsync(executar(), "O aluno não está matriculado nesta sala", 400);

        prismaMock.matricula.findUnique.mockResolvedValue({ id_matricula: 1 } as any);
        prismaMock.tutoria.findFirst.mockResolvedValue({ id_tutoria: 1 } as any);
        await esperaAppErrorAsync(executar(), "Já existe uma tutoria ativa entre este tutor e este aluno", 409);
    });

    it("cria a tutoria com status ativa", async () => {
        prismaMock.tutor_sala.findUnique.mockResolvedValue(tutorSala() as any);
        prismaMock.aluno.findUnique.mockResolvedValue({ id_aluno: 20 } as any);
        prismaMock.matricula.findUnique.mockResolvedValue({ id_matricula: 1 } as any);
        prismaMock.tutoria.findFirst.mockResolvedValue(null);
        prismaMock.tutoria.create.mockResolvedValue({ id_tutoria: 7, status: "ativa" } as any);

        await expect(executar({ meta_aprendizagem: " Meta " })).resolves.toEqual({ id_tutoria: 7, status: "ativa" });
        expect(prismaMock.tutoria.create).toHaveBeenCalledWith(expect.objectContaining({
            data: { id_tutor_sala: 3, id_aluno: 20, meta_aprendizagem: "Meta", status: "ativa" }
        }));
    });
});
