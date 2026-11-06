import { describe, it, expect, jest, afterEach } from "@jest/globals";
import { prismaMock } from "../mocks/prisma";
import { esperaAppErrorAsync } from "../utils";
import { buscarSalaDoProfessor, MENSAGEM_SEM_PERMISSAO_SALA } from "../../helpers/buscarSalaDoProfessor";
import { buscarParticipanteTutoria } from "../../helpers/buscarParticipanteTutoria";
import { contarContestacoesPendentes } from "../../helpers/contarContestacoesPendentes";
import { buscarImpedimentosPorSala, IMPEDIMENTOS_PEDIDO_TUTORIA, INTERVALO_NOVO_PEDIDO_MS } from "../../helpers/verificarPedidoTutoria";

describe("buscarSalaDoProfessor", () => {
    it("devolve a sala quando ela é do professor", async () => {
        prismaMock.sala.findUnique.mockResolvedValue({ id_sala: 1, id_professor: 10 } as any);

        await expect(buscarSalaDoProfessor(1, 10)).resolves.toEqual({ id_sala: 1, id_professor: 10 });
        expect(prismaMock.sala.findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { id_sala: 1 } }));
    });

    it("404 quando a sala não existe", async () => {
        prismaMock.sala.findUnique.mockResolvedValue(null);
        await esperaAppErrorAsync(buscarSalaDoProfessor(1, 10), "Sala não encontrada", 404);
    });

    it("403 quando a sala é de outro professor", async () => {
        prismaMock.sala.findUnique.mockResolvedValue({ id_sala: 1, id_professor: 99 } as any);
        await esperaAppErrorAsync(buscarSalaDoProfessor(1, 10), MENSAGEM_SEM_PERMISSAO_SALA, 403);
    });
});

describe("buscarParticipanteTutoria", () => {
    const tutoria = { id_tutoria: 5, id_aluno: 20, status: "ativa", tutor_sala: { data_revogacao: null, tutor: { id_aluno: 30 } } };

    it("400 com id inválido, sem consultar o banco", async () => {
        await esperaAppErrorAsync(buscarParticipanteTutoria(NaN, 20), "O id da tutoria deve ser um número inteiro", 400);
        expect(prismaMock.tutoria.findUnique).not.toHaveBeenCalled();
    });

    it("404 quando a tutoria não existe", async () => {
        prismaMock.tutoria.findUnique.mockResolvedValue(null);
        await esperaAppErrorAsync(buscarParticipanteTutoria(5, 20), "Tutoria não encontrada", 404);
    });

    it("papel tutorado para o aluno da tutoria", async () => {
        prismaMock.tutoria.findUnique.mockResolvedValue(tutoria as any);
        await expect(buscarParticipanteTutoria(5, 20)).resolves.toEqual({ tutoria, papel: "tutorado" });
    });

    it("papel tutor para o aluno que é o tutor", async () => {
        prismaMock.tutoria.findUnique.mockResolvedValue(tutoria as any);
        await expect(buscarParticipanteTutoria(5, 30)).resolves.toEqual({ tutoria, papel: "tutor" });
    });

    it("403 para aluno que não participa", async () => {
        prismaMock.tutoria.findUnique.mockResolvedValue(tutoria as any);
        await esperaAppErrorAsync(buscarParticipanteTutoria(5, 99), "Você não participa desta tutoria", 403);
    });
});

describe("contarContestacoesPendentes", () => {
    it("conta as pendentes do vínculo, filtrando pelo aluno quando informado", async () => {
        prismaMock.contestacao_nota.count.mockResolvedValue(3);

        await expect(contarContestacoesPendentes({ id_tutor_sala: 7, id_aluno: 20 })).resolves.toBe(3);
        expect(prismaMock.contestacao_nota.count).toHaveBeenCalledWith({
            where: { status: "pendente", nota: { id_aluno: 20, atividade: { id_tutor_sala: 7 } } }
        });
    });

    it("sem id_aluno conta todas as do vínculo", async () => {
        prismaMock.contestacao_nota.count.mockResolvedValue(0);

        await contarContestacoesPendentes({ id_tutor_sala: 7 });
        expect(prismaMock.contestacao_nota.count).toHaveBeenCalledWith({
            where: { status: "pendente", nota: { id_aluno: undefined, atividade: { id_tutor_sala: 7 } } }
        });
    });
});

describe("buscarImpedimentosPorSala", () => {
    const agora = new Date("2026-11-06T12:00:00Z");

    afterEach(() => jest.useRealTimers());

    function configurar({ tutorSalas = [], pendente = null, recusas = [] }: { tutorSalas?: any[]; pendente?: any; recusas?: any[] }) {
        jest.useFakeTimers().setSystemTime(agora);
        prismaMock.tutor_sala.findMany.mockResolvedValue(tutorSalas);
        prismaMock.pedido_tutoria.findFirst.mockResolvedValue(pendente);
        prismaMock.pedido_tutoria.findMany.mockResolvedValue(recusas);
    }

    it("sem impedimento", async () => {
        configurar({});
        const situacao = await buscarImpedimentosPorSala(20, 1);
        expect(situacao(1)).toEqual({ impedimento: null, liberado_em: null });
    });

    it("ja_e_tutor quando há vínculo ativo na sala", async () => {
        configurar({ tutorSalas: [{ id_sala: 1, data_revogacao: null }] });
        const situacao = await buscarImpedimentosPorSala(20);
        expect(situacao(1).impedimento).toBe(IMPEDIMENTOS_PEDIDO_TUTORIA.ja_e_tutor);
        // outra sala não é afetada
        expect(situacao(2).impedimento).toBeNull();
    });

    it("tutor_revogado quando todos os vínculos da sala estão revogados", async () => {
        configurar({ tutorSalas: [{ id_sala: 1, data_revogacao: new Date("2026-10-01") }] });
        const situacao = await buscarImpedimentosPorSala(20, 1);
        expect(situacao(1).impedimento).toBe(IMPEDIMENTOS_PEDIDO_TUTORIA.tutor_revogado);
    });

    it("pedido_pendente vale para qualquer sala", async () => {
        configurar({ pendente: { id_pedido: 3 } });
        const situacao = await buscarImpedimentosPorSala(20);
        expect(situacao(1).impedimento).toBe(IMPEDIMENTOS_PEDIDO_TUTORIA.pedido_pendente);
        expect(situacao(8).impedimento).toBe(IMPEDIMENTOS_PEDIDO_TUTORIA.pedido_pendente);
    });

    it("recusa_recente com liberado_em = decisão + 2h (usa a recusa mais recente)", async () => {
        const recente = new Date(agora.getTime() - 30 * 60 * 1000); // 30 min atrás
        const antiga = new Date(agora.getTime() - 90 * 60 * 1000);
        configurar({ recusas: [{ id_sala: 1, data_decisao: recente }, { id_sala: 1, data_decisao: antiga }] });

        const situacao = await buscarImpedimentosPorSala(20, 1);
        expect(situacao(1)).toEqual({
            impedimento: IMPEDIMENTOS_PEDIDO_TUTORIA.recusa_recente,
            liberado_em: new Date(recente.getTime() + INTERVALO_NOVO_PEDIDO_MS)
        });
    });

    it("ignora recusa sem data_decisao", async () => {
        configurar({ recusas: [{ id_sala: 1, data_decisao: null }] });
        const situacao = await buscarImpedimentosPorSala(20, 1);
        expect(situacao(1).impedimento).toBeNull();
    });

    it("filtra recusas das últimas 2 horas", async () => {
        configurar({});
        await buscarImpedimentosPorSala(20, 1);
        expect(prismaMock.pedido_tutoria.findMany).toHaveBeenCalledWith(expect.objectContaining({
            where: expect.objectContaining({
                id_aluno: 20,
                id_sala: 1,
                status: "recusado",
                data_decisao: { gte: new Date(agora.getTime() - INTERVALO_NOVO_PEDIDO_MS) }
            })
        }));
    });
});
