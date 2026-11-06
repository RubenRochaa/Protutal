import { describe, it, expect, jest } from "@jest/globals";
import { mockRequest, mockResponse } from "../mocks/express";

// Testes dos 60 controllers.
// O controller só lê a requisição, chama o service e devolve a resposta. Então, para cada um, conferimos:
//   1) o service recebe exatamente os dados certos (params convertidos em número, query em texto, user_id do token...)
//   2) a resposta sai com o status certo (201 nos cadastros, 200 no resto) e com o retorno do service
//   3) se o service lançar erro, o controller deixa o erro subir (o handler global do server.ts responde)
// O service é "espionado" (jest.spyOn no execute), então nenhuma regra de negócio roda aqui.

interface CasoController {
    controller: string;                // caminho dentro de src/controllers, sem .ts
    req: Record<string, unknown>;      // campos da requisição falsa
    esperado: unknown;                 // argumento que o service deve receber (undefined = chamado sem argumento)
    status?: number;                   // 201 quando o controller chama res.status(201)
}

const token = { user_id: "10", user_email: "user@x" };
const arquivo = { name: "a.pdf", size: 10 };

const casos: CasoController[] = [
    // ---------- raiz ----------
    { controller: "RedefinirSenhaController", req: { body: { token: "t", senha: "s" } }, esperado: { token: "t", senha: "s" } },
    { controller: "ReenviarConfirmacaoEmailController", req: { body: { email: "a@x" } }, esperado: { email: "a@x" } },
    { controller: "SolicitarRedefinicaoSenhaController", req: { body: { email: "a@x" } }, esperado: { email: "a@x" } },

    // ---------- aluno ----------
    { controller: "aluno/AuthAlunoController", req: { body: { email: "a@x", senha: "s" } }, esperado: { email: "a@x", senha: "s" } },
    { controller: "aluno/CreateAlunoController", req: { body: { nome: "Ana", email: "a@x", senha: "s" } }, esperado: { nome: "Ana", email: "a@x", senha: "s" }, status: 201 },
    { controller: "aluno/ConteudosDominadosController", req: { ...token, query: { id_sala: "2" } }, esperado: { id_aluno: 10, id_sala: "2" } },
    {
        controller: "aluno/CreateAtividadeController",
        req: { ...token, body: { titulo: "T", descricao: "D", prazo: "2026-12-01", tipo: "projeto", etapa: 1, id_conteudo: 2, id_tutoria: 3 } },
        esperado: { id_aluno: 10, id_tutoria: 3, id_conteudo: 2, titulo: "T", descricao: "D", tipo: "projeto", etapa: 1, prazo: "2026-12-01" },
        status: 201
    },
    { controller: "aluno/CreateContestacaoNotaController", req: { ...token, params: { id: "7" }, body: { comentario: "c" } }, esperado: { id_nota: 7, id_usuario: 10, comentario: "c" }, status: 201 },
    {
        controller: "aluno/CreateFeedbackController",
        req: { ...token, params: { id: "5" }, body: { etapa: "1", nota: "8", comentario: "c" }, files: { file: arquivo } },
        esperado: { id_tutoria: 5, id_aluno: 10, etapa: "1", nota: "8", comentario: "c", file: arquivo },
        status: 201
    },
    {
        controller: "aluno/CreateMaterialController",
        req: { ...token, params: { id: "1" }, body: { titulo: "T", descricao: "D" }, files: { file: arquivo } },
        esperado: { id_aluno: 10, email: "user@x", id_sala: 1, titulo: "T", descricao: "D", file: arquivo },
        status: 201
    },
    { controller: "aluno/CreateMensagemController", req: { ...token, params: { id: "5" }, body: { texto: "oi", assunto: "A" } }, esperado: { id_tutoria: 5, id_aluno: 10, texto: "oi", assunto: "A" }, status: 201 },
    {
        controller: "aluno/CreateNotaController",
        req: { ...token, params: { id: "4" }, body: { id_aluno: 20, valor: 8, comentario: "c" } },
        esperado: { id_atividade: 4, id_usuario: 10, email: "user@x", id_aluno: 20, valor: 8, comentario: "c" },
        status: 201
    },
    { controller: "aluno/CreatePedidoTutoriaController", req: { ...token, body: { id_sala: 1 } }, esperado: { id_aluno: 10, id_sala: 1 }, status: 201 },
    { controller: "aluno/CreateRespostaController", req: { ...token, params: { id: "4" }, body: { texto: "t" } }, esperado: { id_aluno: 10, id_atividade: 4, texto: "t", file: undefined }, status: 201 },
    { controller: "aluno/DesempenhoAlunoController", req: { ...token, query: { id_sala: "1", etapa: "2" } }, esperado: { id_aluno: 10, id_sala: "1", etapa: "2" } },
    { controller: "aluno/DesempenhoTutorController", req: { ...token, query: {} }, esperado: { id_aluno: 10, email: "user@x", id_sala: undefined } },
    { controller: "aluno/DetailAtividadeController", req: { ...token, params: { id: "4" } }, esperado: { id_atividade: 4, id_usuario: 10, email: "user@x" } },
    { controller: "aluno/ListAtividadesAlunoController", req: { ...token, query: { status: "pendente" } }, esperado: { id_aluno: 10, status: "pendente", etapa: undefined } },
    {
        controller: "aluno/ListAtividadesTutorController",
        req: { ...token, query: { id_sala: "1", id_conteudo: "2", etapa: "3" } },
        esperado: { id_aluno: 10, email: "user@x", id_sala: "1", id_conteudo: "2", etapa: "3" }
    },
    { controller: "aluno/ListContestacoesAlunoController", req: { ...token, query: { status: "aceita" } }, esperado: { id_aluno: 10, status: "aceita" } },
    { controller: "aluno/ListMensagensTutoriaController", req: { ...token, params: { id: "5" }, query: { tipo: "comunicado" } }, esperado: { id_tutoria: 5, id_aluno: 10, tipo: "comunicado" } },
    { controller: "aluno/ListSalasAlunoController", req: { ...token, query: { ano_letivo: "2026" } }, esperado: { id_aluno: 10, ano_letivo: "2026" } },
    { controller: "aluno/ListTutoriasAlunoController", req: { ...token, query: {} }, esperado: { id_aluno: 10, status: undefined } },
    { controller: "aluno/ListTutoriasTutorController", req: { ...token, query: { status: "ativa" } }, esperado: { id_aluno: 10, status: "ativa" } },

    // ---------- professor ----------
    { controller: "professor/AceitarPedidoTutoriaController", req: { ...token, params: { id: "5" }, body: { id_sala: 1 } }, esperado: { id_pedido: 5, id_sala: 1, id_professor: 10 } },
    { controller: "professor/AuthProfessorController", req: { body: { email: "p@x", senha: "s" } }, esperado: { email: "p@x", senha: "s" } },
    { controller: "professor/CreateAvaliacaoTutorController", req: { ...token, params: { id: "3" }, body: { nota: 9, comentario: "c" } }, esperado: { id_tutor_sala: 3, id_professor: 10, nota: 9, comentario: "c" }, status: 201 },
    { controller: "professor/CreateAvisoController", req: { ...token, params: { id: "1" }, body: { titulo: "T", conteudo: "C" } }, esperado: { id_sala: 1, id_professor: 10, titulo: "T", conteudo: "C" }, status: 201 },
    { controller: "professor/CreateConteudoController", req: { ...token, params: { id: "1" }, body: { nome: "Clima" } }, esperado: { id_sala: 1, nome: "Clima", id_professor: 10 }, status: 201 },
    { controller: "professor/CreateMatriculaController", req: { ...token, params: { id: "1" }, body: { id_aluno: 20 } }, esperado: { id_sala: 1, id_aluno: 20, id_professor: 10 }, status: 201 },
    { controller: "professor/CreateProfessorController", req: { body: { nome: "C", email: "c@x", senha: "s" } }, esperado: { nome: "C", email: "c@x", senha: "s" }, status: 201 },
    { controller: "professor/CreateSalaController", req: { ...token, body: { nome: "2A", serie: 2, ano_letivo: 2026 } }, esperado: { nome: "2A", serie: 2, ano_letivo: 2026, id_professor: 10 }, status: 201 },
    { controller: "professor/CreateTutoriaController", req: { ...token, body: { id_tutor_sala: 3, id_aluno: 20, meta_aprendizagem: "M" } }, esperado: { id_tutor_sala: 3, id_aluno: 20, meta_aprendizagem: "M", id_professor: 10 }, status: 201 },
    { controller: "professor/DesempenhoTutoresSalaController", req: { ...token, params: { id: "1" } }, esperado: { id_sala: 1, id_professor: 10 } },
    { controller: "professor/DetailSalaController", req: { ...token, params: { id: "1" } }, esperado: { id_sala: 1, id_professor: 10 } },
    { controller: "professor/FinalizarTutoriaController", req: { ...token, params: { id: "2" } }, esperado: { id_tutoria: 2, id_professor: 10 } },
    { controller: "professor/ListAlunoController", req: { query: { busca: "ana" } }, esperado: { busca: "ana" } },
    { controller: "professor/ListAlunosSalaController", req: { ...token, params: { id: "1" } }, esperado: { id_sala: 1, id_professor: 10 } },
    {
        controller: "professor/ListAtividadesSalaController",
        req: { ...token, params: { id: "1" }, query: { etapa: "1", id_tutor_sala: "3" } },
        esperado: { id_sala: 1, id_professor: 10, etapa: "1", id_conteudo: undefined, id_tutor_sala: "3" }
    },
    { controller: "professor/ListAvaliacoesTutorController", req: { ...token, params: { id: "3" } }, esperado: { id_tutor_sala: 3, id_professor: 10 } },
    { controller: "professor/ListAvisosSalaController", req: { ...token, params: { id: "1" } }, esperado: { id_sala: 1, id_usuario: 10, email: "user@x" } },
    { controller: "professor/ListContestacoesController", req: { ...token, query: { status: "pendente", id_sala: "1" } }, esperado: { id_usuario: 10, email: "user@x", status: "pendente", id_sala: "1" } },
    { controller: "professor/ListConteudosSalaController", req: { params: { id: "1" } }, esperado: { id_sala: 1 } },
    {
        controller: "professor/ListFeedbacksController",
        req: { ...token, query: { etapa: "1", ano: "2026", id_aluno: "20", id_sala: "1", id_tutor_sala: "3" } },
        esperado: { id_usuario: 10, email: "user@x", etapa: "1", ano: "2026", id_aluno: "20", id_sala: "1", id_tutor_sala: "3" }
    },
    { controller: "professor/ListMateriaisSalaController", req: { ...token, params: { id: "1" } }, esperado: { id_sala: 1, id_usuario: 10, email: "user@x" } },
    {
        controller: "professor/ListNotasSalaController",
        req: { ...token, params: { id: "1" }, query: { id_aluno: "20" } },
        esperado: { id_sala: 1, id_professor: 10, etapa: undefined, id_conteudo: undefined, id_aluno: "20", id_tutor_sala: undefined }
    },
    { controller: "professor/ListPedidosTutoriaController", req: { ...token }, esperado: { id_professor: 10 } },
    { controller: "professor/ListRespostasAtividadeController", req: { params: { id: "4" } }, esperado: { id_atividade: 4 } },
    { controller: "professor/ListSalaController", req: { ...token }, esperado: { id_professor: 10 } },
    { controller: "professor/ListTiposAtividadeController", req: {}, esperado: undefined },
    { controller: "professor/ListTutoresSalaController", req: { ...token, params: { id: "1" } }, esperado: { id_sala: 1, id_professor: 10 } },
    { controller: "professor/ListTutoriasSalaController", req: { ...token, params: { id: "1" }, query: { status: "ativa" } }, esperado: { id_sala: 1, id_professor: 10, status: "ativa" } },
    { controller: "professor/PermissaoAtividadesSalaController", req: { ...token, params: { id: "1" }, body: { pode_criar_ativ: true } }, esperado: { id_sala: 1, pode_criar_ativ: true, id_professor: 10 } },
    { controller: "professor/ReabrirTutoriaController", req: { ...token, params: { id: "2" } }, esperado: { id_tutoria: 2, id_professor: 10 } },
    { controller: "professor/RecusarPedidoTutoriaController", req: { ...token, params: { id: "5" } }, esperado: { id_pedido: 5, id_professor: 10 } },
    {
        controller: "professor/ResolverContestacaoController",
        req: { ...token, params: { id: "1" }, body: { status: "aceita", decisao: "ok", valor: 9 } },
        esperado: { id_contestacao: 1, id_usuario: 10, email: "user@x", status: "aceita", decisao: "ok", valor: 9 }
    },
    { controller: "professor/RevogarTutorSalaController", req: { ...token, params: { id: "3" } }, esperado: { id_tutor_sala: 3, id_professor: 10 } },
    { controller: "professor/UpdateMetaTutoriaController", req: { ...token, params: { id: "2" }, body: { meta_aprendizagem: "M" } }, esperado: { id_tutoria: 2, id_professor: 10, meta_aprendizagem: "M" } },
];

// carrega o controller e espiona o execute do service correspondente
// (mesmo nome e pasta: aluno/CreateAlunoController -> services/aluno/CreateAlunoService)
function carregar(caminho: string) {
    const nomeController = caminho.split("/").pop()!;
    const nomeService = nomeController.replace("Controller", "Service");
    const ControllerClasse = require(`../../controllers/${caminho}`)[nomeController];
    const ServiceClasse = require(`../../services/${caminho.replace(nomeController, nomeService)}`)[nomeService];
    const execute = jest.spyOn(ServiceClasse.prototype, "execute");
    return { controller: new ControllerClasse(), execute };
}

describe.each(casos)("$controller", ({ controller: caminho, req, esperado, status }) => {
    it(`repassa os dados ao service e responde ${status ?? 200}`, async () => {
        const { controller, execute } = carregar(caminho);
        execute.mockResolvedValue({ ok: true } as never);
        const res = mockResponse();

        await controller.handle(mockRequest(req as any), res);

        if (esperado === undefined) {
            expect(execute).toHaveBeenCalledWith();
        } else {
            expect(execute).toHaveBeenCalledWith(esperado);
        }

        if (status) {
            expect(res.status).toHaveBeenCalledWith(status);
        }
        expect(res.json).toHaveBeenCalledWith({ ok: true });
    });

    it("deixa o erro do service subir", async () => {
        const { controller, execute } = carregar(caminho);
        execute.mockRejectedValue(new Error("falhou") as never);

        await expect(controller.handle(mockRequest(req as any), mockResponse())).rejects.toThrow("falhou");
    });
});

// ---------- controllers com resposta diferente de JSON ----------

describe("ExportNotasSalaController", () => {
    it("devolve a planilha como anexo .xlsx", async () => {
        const { controller, execute } = carregar("professor/ExportNotasSalaController");
        const buffer = Buffer.from("planilha");
        execute.mockResolvedValue({ buffer, nomeArquivo: "notas_2A_2026.xlsx" } as never);
        const res = mockResponse();

        await controller.handle(mockRequest({ ...token, params: { id: "1" }, query: { etapa: "1" } } as any), res);

        expect(execute).toHaveBeenCalledWith({ id_sala: 1, id_professor: 10, etapa: "1", id_conteudo: undefined, id_aluno: undefined, id_tutor_sala: undefined });
        expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        expect(res.setHeader).toHaveBeenCalledWith("Content-Disposition", 'attachment; filename="notas_2A_2026.xlsx"');
        expect(res.send).toHaveBeenCalledWith(buffer);
    });
});

describe("ConfirmarEmailController", () => {
    // res.status(...).type("html").send(...)
    function respostaHtml() {
        const res: any = mockResponse();
        res.type = jest.fn().mockReturnValue(res);
        return res;
    }

    it("sucesso: página HTML com status 200", async () => {
        const { controller, execute } = carregar("ConfirmarEmailController");
        execute.mockResolvedValue({ mensagem: "E-mail confirmado!" } as never);
        const res = respostaHtml();

        await controller.handle(mockRequest({ params: { token: "abc" } }), res);

        expect(execute).toHaveBeenCalledWith({ token: "abc" });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.type).toHaveBeenCalledWith("html");
        expect(res.send).toHaveBeenCalledWith(expect.stringContaining("E-mail confirmado!"));
    });

    it("AppError: página HTML de link inválido com o status do erro", async () => {
        const { AppError } = require("../../errors/AppError");
        const { controller, execute } = carregar("ConfirmarEmailController");
        execute.mockRejectedValue(new AppError("Link de confirmação expirado", 410) as never);
        const res = respostaHtml();

        await controller.handle(mockRequest({ params: { token: "abc" } }), res);

        expect(res.status).toHaveBeenCalledWith(410);
        expect(res.send).toHaveBeenCalledWith(expect.stringContaining("Link de confirmação expirado"));
    });

    it("erro inesperado sobe para o handler global", async () => {
        const { controller, execute } = carregar("ConfirmarEmailController");
        execute.mockRejectedValue(new Error("banco fora") as never);

        await expect(controller.handle(mockRequest({ params: { token: "abc" } }), respostaHtml())).rejects.toThrow("banco fora");
    });
});

it("todos os 60 controllers estão cobertos", () => {
    // lista os arquivos de src/controllers e confere que nenhum ficou sem teste
    // (se alguém criar um controller novo e esquecer o teste, este caso falha)
    const fs = require("fs");
    const path = require("path");
    const pasta = path.resolve(__dirname, "../../controllers");
    const arquivos = [
        ...fs.readdirSync(pasta).filter((f: string) => f.endsWith(".ts")),
        ...["aluno", "professor"].flatMap((sub) => fs.readdirSync(path.join(pasta, sub)).map((f: string) => `${sub}/${f}`))
    ].map((f: string) => f.replace(".ts", ""));

    const testados = new Set([...casos.map((c) => c.controller), "professor/ExportNotasSalaController", "ConfirmarEmailController"]);
    expect(arquivos.filter((f) => !testados.has(f))).toEqual([]);
});
