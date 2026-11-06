import { describe, it, expect, jest, beforeEach, afterEach } from "@jest/globals";
import { hash } from "bcryptjs";
import { verify } from "jsonwebtoken";
import { prismaMock } from "../mocks/prisma";
import { esperaAppErrorAsync } from "../utils";
import { enviarEmailConfirmacao } from "../../helpers/enviarEmailConfirmacao";
import { enviarEmailRedefinicaoSenha } from "../../helpers/enviarEmailRedefinicaoSenha";
import { validarTokenRedefinicao } from "../../helpers/tokenRedefinicaoSenha";
import { CreateAlunoService } from "../../services/aluno/CreateAlunoService";
import { CreateProfessorService } from "../../services/professor/CreateProfessorService";
import { AuthAlunoService } from "../../services/aluno/AuthAlunoService";
import { AuthProfessorService } from "../../services/professor/AuthProfessorService";
import { ConfirmarEmailService } from "../../services/ConfirmarEmailService";
import { ReenviarConfirmacaoEmailService } from "../../services/ReenviarConfirmacaoEmailService";
import { SolicitarRedefinicaoSenhaService } from "../../services/SolicitarRedefinicaoSenhaService";
import { RedefinirSenhaService } from "../../services/RedefinirSenhaService";

// o envio de e-mail é falso; gerarTokenConfirmacao continua o real
jest.mock("../../helpers/enviarEmailConfirmacao", () => ({
    ...(jest.requireActual("../../helpers/enviarEmailConfirmacao") as object),
    enviarEmailConfirmacao: jest.fn()
}));
jest.mock("../../helpers/enviarEmailRedefinicaoSenha", () => ({ enviarEmailRedefinicaoSenha: jest.fn() }));
jest.mock("../../helpers/tokenRedefinicaoSenha", () => ({
    ...(jest.requireActual("../../helpers/tokenRedefinicaoSenha") as object),
    validarTokenRedefinicao: jest.fn()
}));

const enviarConfirmacaoMock = enviarEmailConfirmacao as jest.MockedFunction<typeof enviarEmailConfirmacao>;
const enviarRedefinicaoMock = enviarEmailRedefinicaoSenha as jest.MockedFunction<typeof enviarEmailRedefinicaoSenha>;
const validarTokenMock = validarTokenRedefinicao as jest.MockedFunction<typeof validarTokenRedefinicao>;

const AGORA = new Date("2026-11-06T12:00:00Z");

beforeEach(() => {
    enviarConfirmacaoMock.mockResolvedValue(undefined);
    enviarRedefinicaoMock.mockResolvedValue(undefined);
});

// ---------------- Cadastro (aluno e professor têm a mesma regra) ----------------
describe.each([
    {
        nome: "CreateAlunoService",
        service: () => new CreateAlunoService(),
        tabela: "aluno" as const,
        email: "ana.silva@portalsesisp.org.br",
        emailOutroDominio: "ana.silva@portalsesi.org.br",
        criado: { id_aluno: 1, nome: "Ana", email: "ana.silva@portalsesisp.org.br", email_confirmado: false }
    },
    {
        nome: "CreateProfessorService",
        service: () => new CreateProfessorService(),
        tabela: "professor" as const,
        email: "carlos.lima@portalsesi.org.br",
        emailOutroDominio: "carlos.lima@portalsesisp.org.br",
        criado: { id_professor: 1, nome: "Carlos", email: "carlos.lima@portalsesi.org.br", email_confirmado: false }
    }
])("$nome", ({ service, tabela, email, emailOutroDominio, criado }) => {
    const tabelaMock = () => prismaMock[tabela] as any;

    it("cria com senha em hash, token de confirmação e envia o e-mail", async () => {
        tabelaMock().findFirst.mockResolvedValue(null);
        tabelaMock().create.mockResolvedValue(criado);

        const resultado = await service().execute({ nome: criado.nome, email, senha: "minhasenha" });

        expect(resultado).toEqual({ ...criado, mensagem: "Cadastro realizado. Enviamos um link de confirmação para o seu e-mail." });

        const { data, select } = tabelaMock().create.mock.calls[0][0];
        expect(data.senha).not.toBe("minhasenha");
        expect(data.senha).toMatch(/^\$2[aby]\$08\$/);
        expect(data.email_confirmado).toBe(false);
        expect(data.token_confirmacao).toMatch(/^[0-9a-f]{64}$/);
        // segurança: o select não devolve senha nem token
        expect(select.senha).toBeUndefined();
        expect(select.token_confirmacao).toBeUndefined();
        expect(enviarConfirmacaoMock).toHaveBeenCalledWith({ nome: criado.nome, email: criado.email, token: data.token_confirmacao });
    });

    it("a resposta nunca contém a senha", async () => {
        tabelaMock().findFirst.mockResolvedValue(null);
        tabelaMock().create.mockResolvedValue(criado);
        const resultado = await service().execute({ nome: criado.nome, email, senha: "x" });
        expect(resultado).not.toHaveProperty("senha");
    });

    it("mantém o cadastro (com outra mensagem) se o e-mail falhar", async () => {
        tabelaMock().findFirst.mockResolvedValue(null);
        tabelaMock().create.mockResolvedValue(criado);
        enviarConfirmacaoMock.mockRejectedValue(new Error("SMTP"));

        const resultado = await service().execute({ nome: criado.nome, email, senha: "x" });

        expect(resultado.mensagem).toBe("Cadastro realizado, mas não foi possível enviar o e-mail de confirmação.");
        expect(console.error).toHaveBeenCalled();
    });

    it("409 quando o e-mail já está cadastrado", async () => {
        tabelaMock().findFirst.mockResolvedValue({ ...criado });
        await esperaAppErrorAsync(service().execute({ nome: "X", email, senha: "x" }), "Email já cadastrado", 409);
        expect(tabelaMock().create).not.toHaveBeenCalled();
    });

    it("400 com domínio de outro tipo de usuário, sem consultar o banco", async () => {
        await esperaAppErrorAsync(service().execute({ nome: "X", email: emailOutroDominio, senha: "x" }), "Domínio de email não permitido", 400);
        expect(tabelaMock().findFirst).not.toHaveBeenCalled();
    });

    it("400 com campos vazios", async () => {
        await esperaAppErrorAsync(service().execute({ nome: "", email, senha: "x" }), "Nome, email e senha são obrigatórios", 400);
    });
});

// ---------------- Login ----------------
describe.each([
    { nome: "AuthAlunoService", service: () => new AuthAlunoService(), tabela: "aluno" as const, campoId: "id_aluno" },
    { nome: "AuthProfessorService", service: () => new AuthProfessorService(), tabela: "professor" as const, campoId: "id_professor" }
])("$nome", ({ service, tabela, campoId }) => {
    const tabelaMock = () => prismaMock[tabela] as any;
    let usuario: any;

    beforeEach(async () => {
        usuario = { [campoId]: 7, nome: "Fulano", email: "f@x.org.br", senha: await hash("certa", 8), email_confirmado: true };
    });

    it("login correto devolve token JWT válido e não devolve a senha", async () => {
        tabelaMock().findFirst.mockResolvedValue(usuario);

        const resultado: any = await service().execute({ email: "f@x.org.br", senha: "certa" });

        expect(resultado).toEqual({ [campoId]: 7, nome: "Fulano", email: "f@x.org.br", token: expect.any(String) });
        expect(resultado).not.toHaveProperty("senha");
        const payload = verify(resultado.token, process.env.JWT_SECRET!) as any;
        expect(payload.sub).toBe("7");
        expect(payload.email).toBe("f@x.org.br");
    });

    it("400 sem e-mail ou senha", async () => {
        await esperaAppErrorAsync(service().execute({ email: "", senha: "x" }), "Email e senha são obrigatórios", 400);
        await esperaAppErrorAsync(service().execute({ email: "a@b.c", senha: "" }), "Email e senha são obrigatórios", 400);
    });

    it("401 quando o e-mail não existe", async () => {
        tabelaMock().findFirst.mockResolvedValue(null);
        await esperaAppErrorAsync(service().execute({ email: "f@x.org.br", senha: "certa" }), "Email ou senha incorretos", 401);
    });

    it("401 com senha errada", async () => {
        tabelaMock().findFirst.mockResolvedValue(usuario);
        await esperaAppErrorAsync(service().execute({ email: "f@x.org.br", senha: "errada" }), "Email ou senha incorretos", 401);
    });

    it("403 com e-mail ainda não confirmado", async () => {
        tabelaMock().findFirst.mockResolvedValue({ ...usuario, email_confirmado: false });
        await esperaAppErrorAsync(service().execute({ email: "f@x.org.br", senha: "certa" }), "Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.", 403);
    });
});

// ---------------- Confirmação de e-mail ----------------
describe("ConfirmarEmailService", () => {
    const service = new ConfirmarEmailService();
    const futuro = new Date(Date.now() + 60 * 60 * 1000);

    it("400 com token vazio", async () => {
        await esperaAppErrorAsync(service.execute({ token: "  " }), "Link de confirmação inválido ou já utilizado", 400);
    });

    it("400 quando o token não é de ninguém", async () => {
        prismaMock.professor.findUnique.mockResolvedValue(null);
        prismaMock.aluno.findUnique.mockResolvedValue(null);
        await esperaAppErrorAsync(service.execute({ token: "abc" }), "Link de confirmação inválido ou já utilizado", 400);
    });

    it("410 quando o token expirou", async () => {
        prismaMock.professor.findUnique.mockResolvedValue(null);
        prismaMock.aluno.findUnique.mockResolvedValue({ id_aluno: 1, token_expiracao: new Date(Date.now() - 1000) } as any);
        await esperaAppErrorAsync(service.execute({ token: "abc" }), "Link de confirmação expirado", 410);
    });

    it("confirma professor e limpa o token (sem procurar aluno)", async () => {
        prismaMock.professor.findUnique.mockResolvedValue({ id_professor: 3, token_expiracao: futuro } as any);

        await expect(service.execute({ token: "abc" })).resolves.toEqual({ mensagem: "E-mail confirmado! Você já pode entrar no Protutal." });
        expect(prismaMock.aluno.findUnique).not.toHaveBeenCalled();
        expect(prismaMock.professor.update).toHaveBeenCalledWith({
            where: { id_professor: 3 },
            data: { email_confirmado: true, token_confirmacao: null, token_expiracao: null }
        });
    });

    it("confirma aluno", async () => {
        prismaMock.professor.findUnique.mockResolvedValue(null);
        prismaMock.aluno.findUnique.mockResolvedValue({ id_aluno: 8, token_expiracao: futuro } as any);

        await service.execute({ token: "abc" });
        expect(prismaMock.aluno.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id_aluno: 8 } }));
    });
});

// ---------------- Reenvio da confirmação ----------------
describe("ReenviarConfirmacaoEmailService", () => {
    const service = new ReenviarConfirmacaoEmailService();
    const MENSAGEM = "Se o e-mail estiver cadastrado e aguardando confirmação, um novo link foi enviado. Ele vale por 1 hora.";

    beforeEach(() => jest.useFakeTimers().setSystemTime(AGORA));
    afterEach(() => jest.useRealTimers());

    // token_expiracao = último envio + 1h
    const expiracaoDeEnvioHa = (minutos: number) => new Date(AGORA.getTime() - minutos * 60 * 1000 + 60 * 60 * 1000);

    it("400 sem e-mail", async () => {
        await esperaAppErrorAsync(service.execute({ email: "" }), "Email é obrigatório", 400);
    });

    it("mesma mensagem quando o e-mail não existe (não revela cadastro)", async () => {
        prismaMock.professor.findUnique.mockResolvedValue(null);
        prismaMock.aluno.findUnique.mockResolvedValue(null);
        await expect(service.execute({ email: "x@y.z" })).resolves.toEqual({ mensagem: MENSAGEM });
        expect(enviarConfirmacaoMock).not.toHaveBeenCalled();
    });

    it("gera novo token e reenvia para aluno pendente", async () => {
        prismaMock.professor.findUnique.mockResolvedValue(null);
        prismaMock.aluno.findUnique.mockResolvedValue({ id_aluno: 2, nome: "Ana", email: "a@x", email_confirmado: false, token_expiracao: expiracaoDeEnvioHa(10) } as any);

        await service.execute({ email: "a@x" });

        expect(prismaMock.aluno.update).toHaveBeenCalledWith({
            where: { id_aluno: 2 },
            data: { token_confirmacao: expect.stringMatching(/^[0-9a-f]{64}$/), token_expiracao: new Date(AGORA.getTime() + 60 * 60 * 1000) }
        });
        expect(enviarConfirmacaoMock).toHaveBeenCalledWith(expect.objectContaining({ email: "a@x", reenvio: true }));
    });

    it("reenvia para professor pendente", async () => {
        prismaMock.professor.findUnique.mockResolvedValue({ id_professor: 4, nome: "C", email: "c@x", email_confirmado: false, token_expiracao: null } as any);
        prismaMock.aluno.findUnique.mockResolvedValue(null);

        await service.execute({ email: "c@x" });
        expect(prismaMock.professor.update).toHaveBeenCalled();
    });

    it("não reenvia se o último envio foi há menos de 2 minutos", async () => {
        prismaMock.professor.findUnique.mockResolvedValue(null);
        prismaMock.aluno.findUnique.mockResolvedValue({ id_aluno: 2, nome: "Ana", email: "a@x", email_confirmado: false, token_expiracao: expiracaoDeEnvioHa(1) } as any);

        await expect(service.execute({ email: "a@x" })).resolves.toEqual({ mensagem: MENSAGEM });
        expect(prismaMock.aluno.update).not.toHaveBeenCalled();
    });

    it("não reenvia para e-mail já confirmado", async () => {
        prismaMock.professor.findUnique.mockResolvedValue(null);
        prismaMock.aluno.findUnique.mockResolvedValue({ id_aluno: 2, nome: "Ana", email: "a@x", email_confirmado: true, token_expiracao: null } as any);

        await service.execute({ email: "a@x" });
        expect(enviarConfirmacaoMock).not.toHaveBeenCalled();
    });

    it("falha no envio não quebra a resposta", async () => {
        prismaMock.professor.findUnique.mockResolvedValue(null);
        prismaMock.aluno.findUnique.mockResolvedValue({ id_aluno: 2, nome: "Ana", email: "a@x", email_confirmado: false, token_expiracao: null } as any);
        enviarConfirmacaoMock.mockRejectedValue(new Error("SMTP"));

        await expect(service.execute({ email: "a@x" })).resolves.toEqual({ mensagem: MENSAGEM });
        expect(console.error).toHaveBeenCalled();
    });
});

// ---------------- Solicitar redefinição de senha ----------------
describe("SolicitarRedefinicaoSenhaService", () => {
    const service = new SolicitarRedefinicaoSenhaService();
    const MENSAGEM = "Se o e-mail estiver cadastrado, enviaremos um link para redefinir a senha. Ele vale por 30 minutos.";

    it("400 sem e-mail", async () => {
        await esperaAppErrorAsync(service.execute({ email: " " }), "Email é obrigatório", 400);
    });

    it("envia link para professor confirmado", async () => {
        prismaMock.professor.findUnique.mockResolvedValue({ id_professor: 1, nome: "C", email: "c@x", senha: "h", email_confirmado: true } as any);
        prismaMock.aluno.findUnique.mockResolvedValue(null);

        await expect(service.execute({ email: "c@x" })).resolves.toEqual({ mensagem: MENSAGEM });
        expect(enviarRedefinicaoMock).toHaveBeenCalledWith({ nome: "C", email: "c@x", token: expect.any(String) });
    });

    it("envia link para aluno confirmado", async () => {
        prismaMock.professor.findUnique.mockResolvedValue(null);
        prismaMock.aluno.findUnique.mockResolvedValue({ id_aluno: 1, nome: "A", email: "a@x", senha: "h", email_confirmado: true } as any);

        await service.execute({ email: "a@x" });
        expect(enviarRedefinicaoMock).toHaveBeenCalledTimes(1);
    });

    it("não envia para e-mail inexistente ou não confirmado, mas responde igual", async () => {
        prismaMock.professor.findUnique.mockResolvedValue(null);
        prismaMock.aluno.findUnique.mockResolvedValue({ id_aluno: 1, nome: "A", email: "a@x", senha: "h", email_confirmado: false } as any);

        await expect(service.execute({ email: "a@x" })).resolves.toEqual({ mensagem: MENSAGEM });
        expect(enviarRedefinicaoMock).not.toHaveBeenCalled();
    });

    it("erro no envio só vai para o log", async () => {
        prismaMock.professor.findUnique.mockResolvedValue(null);
        prismaMock.aluno.findUnique.mockResolvedValue({ id_aluno: 1, nome: "A", email: "a@x", senha: "h", email_confirmado: true } as any);
        enviarRedefinicaoMock.mockRejectedValue(new Error("SMTP"));

        await expect(service.execute({ email: "a@x" })).resolves.toEqual({ mensagem: MENSAGEM });
        await new Promise((r) => setImmediate(r));
        expect(console.error).toHaveBeenCalled();
    });
});

// ---------------- Redefinir senha ----------------
describe("RedefinirSenhaService", () => {
    const service = new RedefinirSenhaService();

    it("400 sem token ou senha", async () => {
        await esperaAppErrorAsync(service.execute({ token: "", senha: "x" }), "Token e senha são obrigatórios", 400);
        await esperaAppErrorAsync(service.execute({ token: "t", senha: "" }), "Token e senha são obrigatórios", 400);
    });

    it("400 com token inválido", async () => {
        validarTokenMock.mockResolvedValue(null);
        await esperaAppErrorAsync(service.execute({ token: "t", senha: "nova" }), "Link de redefinição inválido ou expirado. Peça um novo link.", 400);
    });

    it("grava a nova senha em hash para professor", async () => {
        validarTokenMock.mockResolvedValue({ tipo: "professor", id: 3, senha: "antigo" });

        await expect(service.execute({ token: "t", senha: "nova" })).resolves.toEqual({ mensagem: "Senha redefinida! Você já pode entrar no Protutal." });
        const { where, data } = (prismaMock.professor.update.mock.calls[0] as any)[0];
        expect(where).toEqual({ id_professor: 3 });
        expect(data.senha).toMatch(/^\$2[aby]\$08\$/);
    });

    it("grava a nova senha para aluno", async () => {
        validarTokenMock.mockResolvedValue({ tipo: "aluno", id: 9, senha: "antigo" });
        await service.execute({ token: "t", senha: "nova" });
        expect(prismaMock.aluno.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id_aluno: 9 } }));
    });
});
