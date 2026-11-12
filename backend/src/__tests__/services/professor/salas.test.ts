import { describe, it, expect, jest, afterEach } from "@jest/globals";
import { prismaMock } from "../../mocks/prisma";
import { esperaAppErrorAsync } from "../../utils";
import { MENSAGEM_SEM_PERMISSAO_SALA } from "../../../helpers/buscarSalaDoProfessor";
import { ListTiposAtividadeService } from "../../../services/professor/ListTiposAtividadeService";
import { ListSalaService } from "../../../services/professor/ListSalaService";
import { ListConteudosSalaService } from "../../../services/professor/ListConteudosSalaService";
import { ListAlunoService } from "../../../services/professor/ListAlunoService";
import { ListAlunosSalaService } from "../../../services/professor/ListAlunosSalaService";
import { PermissaoAtividadesSalaService } from "../../../services/professor/PermissaoAtividadesSalaService";
import { DetailSalaService } from "../../../services/professor/DetailSalaService";
import { ListTutoresSalaService } from "../../../services/professor/ListTutoresSalaService";
import { CreateSalaService } from "../../../services/professor/CreateSalaService";
import { ListPedidosTutoriaService } from "../../../services/professor/ListPedidosTutoriaService";
import { ListAtividadesSalaService } from "../../../services/professor/ListAtividadesSalaService";
import { CreateAvisoService } from "../../../services/professor/CreateAvisoService";
import { RecusarPedidoTutoriaService } from "../../../services/professor/RecusarPedidoTutoriaService";

const ID_PROFESSOR = 10;
const MSG_ID_SALA = "O id da sala deve ser um número inteiro";

// sala 1 do professor 10 (dono = id_professor informado)
function salaDoProfessor(id_professor = ID_PROFESSOR) {
    prismaMock.sala.findUnique.mockResolvedValue({ id_sala: 1, id_professor } as any);
}

// testes comuns a toda rota "/salas/:id/..." que usa buscarSalaDoProfessor
function testesDePermissaoDaSala(executar: (id_sala: number) => Promise<unknown>) {
    it("400 com id da sala inválido", async () => {
        await esperaAppErrorAsync(executar(NaN), MSG_ID_SALA, 400);
    });

    it("404 quando a sala não existe", async () => {
        prismaMock.sala.findUnique.mockResolvedValue(null);
        await esperaAppErrorAsync(executar(1), "Sala não encontrada", 404);
    });

    it("403 quando a sala é de outro professor", async () => {
        salaDoProfessor(99);
        await esperaAppErrorAsync(executar(1), MENSAGEM_SEM_PERMISSAO_SALA, 403);
    });
}

describe("ListTiposAtividadeService", () => {
    it("devolve os 15 tipos com valor e rótulo", async () => {
        const tipos = await new ListTiposAtividadeService().execute();
        expect(tipos).toHaveLength(15);
        expect(tipos).toContainEqual({ valor: "mapa_mental", rotulo: "Mapa mental" });
    });
});

describe("ListSalaService", () => {
    it("lista só as salas do professor", async () => {
        prismaMock.sala.findMany.mockResolvedValue([{ id_sala: 1 }] as any);
        await expect(new ListSalaService().execute({ id_professor: ID_PROFESSOR })).resolves.toEqual([{ id_sala: 1 }]);
        expect(prismaMock.sala.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { id_professor: ID_PROFESSOR } }));
    });
});

describe("ListConteudosSalaService", () => {
    it("lista os conteúdos da sala", async () => {
        prismaMock.conteudo.findMany.mockResolvedValue([{ id_conteudo: 1, nome: "Clima" }] as any);
        await expect(new ListConteudosSalaService().execute({ id_sala: 1 })).resolves.toEqual([{ id_conteudo: 1, nome: "Clima" }]);
        expect(prismaMock.conteudo.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { salas: { some: { id_sala: 1 } } } }));
    });

    it("400 com id inválido", async () => {
        await esperaAppErrorAsync(new ListConteudosSalaService().execute({ id_sala: 0 }), MSG_ID_SALA, 400);
    });
});

describe("ListAlunoService", () => {
    it("sem busca não filtra", async () => {
        prismaMock.aluno.findMany.mockResolvedValue([]);
        await new ListAlunoService().execute({ busca: "   " });
        expect(prismaMock.aluno.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: {} }));
    });

    it("com busca filtra nome ou e-mail sem diferenciar maiúsculas", async () => {
        prismaMock.aluno.findMany.mockResolvedValue([]);
        await new ListAlunoService().execute({ busca: " ana " });
        expect(prismaMock.aluno.findMany).toHaveBeenCalledWith(expect.objectContaining({
            where: { OR: [{ nome: { contains: "ana", mode: "insensitive" } }, { email: { contains: "ana", mode: "insensitive" } }] }
        }));
    });

    it("não seleciona a senha", async () => {
        prismaMock.aluno.findMany.mockResolvedValue([]);
        await new ListAlunoService().execute({});
        expect((prismaMock.aluno.findMany.mock.calls[0] as any)[0].select.senha).toBeUndefined();
    });
});

describe("ListAlunosSalaService", () => {
    testesDePermissaoDaSala((id_sala) => new ListAlunosSalaService().execute({ id_sala, id_professor: ID_PROFESSOR }));

    it("lista os alunos matriculados", async () => {
        salaDoProfessor();
        prismaMock.aluno.findMany.mockResolvedValue([{ id_aluno: 1 }] as any);
        await expect(new ListAlunosSalaService().execute({ id_sala: 1, id_professor: ID_PROFESSOR })).resolves.toEqual([{ id_aluno: 1 }]);
    });
});

describe("PermissaoAtividadesSalaService", () => {
    const executar = (id_sala: number, pode_criar_ativ: any = true) =>
        new PermissaoAtividadesSalaService().execute({ id_sala, pode_criar_ativ, id_professor: ID_PROFESSOR });

    testesDePermissaoDaSala((id_sala) => executar(id_sala));

    it("400 quando pode_criar_ativ não é booleano", async () => {
        await esperaAppErrorAsync(executar(1, "sim"), "O campo pode_criar_ativ é obrigatório e deve ser true ou false", 400);
    });

    it("atualiza só os tutores ativos da sala", async () => {
        salaDoProfessor();
        prismaMock.tutor_sala.updateMany.mockResolvedValue({ count: 2 });

        await expect(executar(1, false)).resolves.toEqual({ id_sala: 1, pode_criar_ativ: false, quantidade_atualizada: 2 });
        expect(prismaMock.tutor_sala.updateMany).toHaveBeenCalledWith({ where: { id_sala: 1, data_revogacao: null }, data: { pode_criar_ativ: false } });
    });
});

describe("DetailSalaService", () => {
    const executar = (id_sala: number) => new DetailSalaService().execute({ id_sala, id_professor: ID_PROFESSOR });
    const sala = { id_sala: 1, nome: "2A", serie: 2, ano_letivo: 2026, id_professor: ID_PROFESSOR, professor: { id_professor: ID_PROFESSOR, nome: "C" } };

    it("devolve o detalhe sem id_professor solto", async () => {
        prismaMock.sala.findUnique.mockResolvedValue(sala as any);
        await expect(executar(1)).resolves.toEqual({ id_sala: 1, nome: "2A", serie: 2, ano_letivo: 2026, professor: sala.professor });
    });

    it("400 / 404 / 403", async () => {
        await esperaAppErrorAsync(executar(-1), MSG_ID_SALA, 400);
        prismaMock.sala.findUnique.mockResolvedValue(null);
        await esperaAppErrorAsync(executar(1), "Sala não encontrada", 404);
        prismaMock.sala.findUnique.mockResolvedValue({ ...sala, id_professor: 99 } as any);
        await esperaAppErrorAsync(executar(1), MENSAGEM_SEM_PERMISSAO_SALA, 403);
    });
});

describe("ListTutoresSalaService", () => {
    testesDePermissaoDaSala((id_sala) => new ListTutoresSalaService().execute({ id_sala, id_professor: ID_PROFESSOR }));

    it("lista tutores ativos achatando o aluno", async () => {
        salaDoProfessor();
        const data = new Date();
        prismaMock.tutor_sala.findMany.mockResolvedValue([
            { id_tutor_sala: 3, id_tutor: 2, pode_criar_ativ: true, data_definicao: data, tutor: { aluno: { id_aluno: 5, nome: "Ana", email: "a@x" } } }
        ] as any);

        await expect(new ListTutoresSalaService().execute({ id_sala: 1, id_professor: ID_PROFESSOR })).resolves.toEqual([
            { id_tutor_sala: 3, id_tutor: 2, pode_criar_ativ: true, data_definicao: data, aluno: { id_aluno: 5, nome: "Ana", email: "a@x" } }
        ]);
        expect(prismaMock.tutor_sala.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { id_sala: 1, data_revogacao: null } }));
    });
});

describe("CreateSalaService", () => {
    const executar = (dados: any) => new CreateSalaService().execute({ nome: "2A", serie: 2, ano_letivo: 2026, id_professor: ID_PROFESSOR, ...dados });

    it("cria a sala com nome sem espaços extras e números convertidos", async () => {
        prismaMock.sala.create.mockResolvedValue({ id_sala: 1 } as any);
        await executar({ nome: "  2A  ", serie: "2", ano_letivo: "2026" });
        expect(prismaMock.sala.create).toHaveBeenCalledWith(expect.objectContaining({
            data: { nome: "2A", serie: 2, ano_letivo: 2026, id_professor: ID_PROFESSOR }
        }));
    });

    it.each([
        [{ nome: "" }, "O campo nome é obrigatório"],
        [{ nome: "a".repeat(101) }, "O nome deve ter no máximo 100 caracteres"],
        [{ serie: undefined }, "O campo serie é obrigatório"],
        [{ serie: 4 }, "A serie deve ser 1, 2 ou 3"],
        [{ ano_letivo: "" }, "O campo ano_letivo é obrigatório"],
        [{ ano_letivo: "2026.5" }, "O ano_letivo deve ser um número inteiro"],
    ])("400 com %p", async (dados, mensagem) => {
        await esperaAppErrorAsync(executar(dados), mensagem, 400);
        expect(prismaMock.sala.create).not.toHaveBeenCalled();
    });
});

describe("ListPedidosTutoriaService", () => {
    it("lista pendentes das salas do professor com as salas em que o aluno está matriculado", async () => {
        const data = new Date();
        prismaMock.pedido_tutoria.findMany.mockResolvedValue([{
            id_pedido: 1,
            data_solicitacao: data,
            sala: { id_sala: 1, nome: "2A" },
            aluno: { id_aluno: 5, nome: "Ana", matriculas: [{ sala: { id_sala: 1, nome: "2A" } }, { sala: { id_sala: 2, nome: "2B" } }] }
        }] as any);

        await expect(new ListPedidosTutoriaService().execute({ id_professor: ID_PROFESSOR })).resolves.toEqual([{
            id_pedido: 1,
            data_solicitacao: data,
            sala_pedido: { id_sala: 1, nome: "2A" },
            aluno: { id_aluno: 5, nome: "Ana" },
            salas_matriculado: [{ id_sala: 1, nome: "2A" }, { id_sala: 2, nome: "2B" }]
        }]);
        expect(prismaMock.pedido_tutoria.findMany).toHaveBeenCalledWith(expect.objectContaining({
            where: { status: "pendente", sala: { id_professor: ID_PROFESSOR } }
        }));
    });
});

describe("ListAtividadesSalaService", () => {
    const executar = (dados: any = {}) => new ListAtividadesSalaService().execute({ id_sala: 1, id_professor: ID_PROFESSOR, ...dados });

    testesDePermissaoDaSala((id_sala) => executar({ id_sala }));

    it("aplica os filtros e monta o resumo", async () => {
        salaDoProfessor();
        prismaMock.atividade.findMany.mockResolvedValue([{
            id_atividade: 1, titulo: "T", tipo: "projeto", etapa: 1, data_entrega: null, conteudo: { id_conteudo: 2, nome: "C" },
            _count: { destinatarios: 3, respostas: 2, notas: 1 },
            tutor_sala: { id_tutor_sala: 4, tutor: { aluno: { nome: "Ana" } } }
        }] as any);

        const resultado = await executar({ etapa: "1", id_conteudo: "2", id_tutor_sala: "4" });

        expect(resultado[0]).toEqual(expect.objectContaining({ tutor: { id_tutor_sala: 4, nome: "Ana" }, total_destinatarios: 3, total_entregues: 2, total_com_nota: 1 }));
        expect(prismaMock.atividade.findMany).toHaveBeenCalledWith(expect.objectContaining({
            where: { tutor_sala: { id_sala: 1 }, etapa: 1, id_conteudo: 2, id_tutor_sala: 4 }
        }));
    });

    it("400 com filtros inválidos", async () => {
        await esperaAppErrorAsync(executar({ etapa: "5" }), "A etapa deve ser 1, 2 ou 3", 400);
        await esperaAppErrorAsync(executar({ id_conteudo: "x" }), "O id do conteúdo deve ser um número inteiro", 400);
        await esperaAppErrorAsync(executar({ id_tutor_sala: "0" }), "O id do tutor da sala deve ser um número inteiro", 400);
    });
});

describe("CreateAvisoService", () => {
    const executar = (dados: any = {}) => new CreateAvisoService().execute({ id_sala: 1, id_professor: ID_PROFESSOR, titulo: "Prova", conteudo: "Sexta", ...dados });

    testesDePermissaoDaSala((id_sala) => executar({ id_sala }));

    it.each([
        [{ titulo: " " }, "O campo titulo é obrigatório"],
        [{ titulo: "a".repeat(151) }, "O título deve ter no máximo 150 caracteres"],
        [{ conteudo: "" }, "O campo conteudo é obrigatório"],
    ])("400 com %p", async (dados, mensagem) => {
        salaDoProfessor();
        await esperaAppErrorAsync(executar(dados), mensagem, 400);
    });

    it("409 sem tutoria ativa na sala", async () => {
        salaDoProfessor();
        prismaMock.tutoria.findFirst.mockResolvedValue(null);
        await esperaAppErrorAsync(executar(), "Não é possível publicar o aviso: não há tutoria ativa nesta sala", 409);
    });

    it("publica o aviso", async () => {
        salaDoProfessor();
        prismaMock.tutoria.findFirst.mockResolvedValue({ id_tutoria: 1 } as any);
        prismaMock.aviso.create.mockResolvedValue({ id_aviso: 9 } as any);

        await expect(executar({ titulo: " Prova ", conteudo: " Sexta " })).resolves.toEqual({ id_aviso: 9 });
        expect(prismaMock.aviso.create).toHaveBeenCalledWith(expect.objectContaining({
            data: { id_sala: 1, id_professor: ID_PROFESSOR, titulo: "Prova", conteudo: "Sexta" }
        }));
    });
});

describe("RecusarPedidoTutoriaService", () => {
    const executar = (id_pedido = 5) => new RecusarPedidoTutoriaService().execute({ id_pedido, id_professor: ID_PROFESSOR });
    const AGORA = new Date("2026-11-06T12:00:00Z");

    afterEach(() => jest.useRealTimers());

    it("400 com id inválido", async () => {
        await esperaAppErrorAsync(executar(0), "O id do pedido deve ser um número inteiro", 400);
    });

    it("404 quando o pedido não existe", async () => {
        prismaMock.pedido_tutoria.findUnique.mockResolvedValue(null);
        await esperaAppErrorAsync(executar(), "Pedido de tutoria não encontrado", 404);
    });

    it("409 quando o pedido já foi decidido", async () => {
        prismaMock.pedido_tutoria.findUnique.mockResolvedValue({ id_pedido: 5, id_sala: 1, status: "aceito" } as any);
        await esperaAppErrorAsync(executar(), "Este pedido já foi decidido", 409);
    });

    it("403 quando a sala do pedido é de outro professor", async () => {
        prismaMock.pedido_tutoria.findUnique.mockResolvedValue({ id_pedido: 5, id_sala: 1, status: "pendente" } as any);
        salaDoProfessor(99);
        await esperaAppErrorAsync(executar(), MENSAGEM_SEM_PERMISSAO_SALA, 403);
    });

    it("409 se outro professor decidiu ao mesmo tempo (updateMany não alterou nada)", async () => {
        prismaMock.pedido_tutoria.findUnique.mockResolvedValue({ id_pedido: 5, id_sala: 1, status: "pendente" } as any);
        salaDoProfessor();
        prismaMock.pedido_tutoria.updateMany.mockResolvedValue({ count: 0 });
        await esperaAppErrorAsync(executar(), "Este pedido já foi decidido", 409);
    });

    it("recusa com data de decisão = agora", async () => {
        jest.useFakeTimers().setSystemTime(AGORA);
        prismaMock.pedido_tutoria.findUnique
            .mockResolvedValueOnce({ id_pedido: 5, id_sala: 1, status: "pendente" } as any)
            .mockResolvedValueOnce({ id_pedido: 5, status: "recusado" } as any);
        salaDoProfessor();
        prismaMock.pedido_tutoria.updateMany.mockResolvedValue({ count: 1 });

        await expect(executar()).resolves.toEqual({ pedido: { id_pedido: 5, status: "recusado" } });
        expect(prismaMock.pedido_tutoria.updateMany).toHaveBeenCalledWith({
            where: { id_pedido: 5, status: "pendente" },
            data: { status: "recusado", data_decisao: AGORA, id_professor: ID_PROFESSOR }
        });
    });
});
