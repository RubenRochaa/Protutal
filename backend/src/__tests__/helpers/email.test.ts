import { describe, it, expect, jest, beforeEach, afterEach } from "@jest/globals";
import mailConfig from "../../config/mail";
import { enviarEmailConfirmacao, gerarTokenConfirmacao, PRAZO_TOKEN_CONFIRMACAO_MS } from "../../helpers/enviarEmailConfirmacao";
import { enviarEmailRedefinicaoSenha } from "../../helpers/enviarEmailRedefinicaoSenha";

jest.mock("../../config/mail", () => ({
    __esModule: true,
    default: { transporte: jest.fn() }
}));

const sendMail = jest.fn<(...args: any[]) => Promise<unknown>>();

beforeEach(() => {
    sendMail.mockResolvedValue({});
    (mailConfig.transporte as jest.Mock).mockReturnValue({ sendMail });
    process.env.APP_URL = "http://localhost:3333/";
    process.env.FRONT_URL = "http://localhost:3000//";
});

describe("gerarTokenConfirmacao", () => {
    afterEach(() => jest.useRealTimers());

    it("gera token hex de 64 caracteres com validade de 1 hora", () => {
        jest.useFakeTimers().setSystemTime(new Date("2026-11-06T12:00:00Z"));

        const { token, expiracao } = gerarTokenConfirmacao();

        expect(token).toMatch(/^[0-9a-f]{64}$/);
        expect(expiracao).toEqual(new Date(Date.parse("2026-11-06T12:00:00Z") + PRAZO_TOKEN_CONFIRMACAO_MS));
    });

    it("gera tokens diferentes a cada chamada", () => {
        expect(gerarTokenConfirmacao().token).not.toBe(gerarTokenConfirmacao().token);
    });
});

describe("enviarEmailConfirmacao", () => {
    it("envia para o e-mail do usuário com o link (sem barra dupla)", async () => {
        await enviarEmailConfirmacao({ nome: "Ana", email: "ana@portalsesisp.org.br", token: "abc" });

        const mensagem = sendMail.mock.calls[0]![0] as any;
        expect(mensagem.to).toBe("ana@portalsesisp.org.br");
        expect(mensagem.subject).toBe("Confirme seu e-mail no Protutal");
        expect(mensagem.from).toBe('"Protutal" <teste@gmail.com>');
        expect(mensagem.text).toContain("http://localhost:3333/confirmacao-email/abc");
        expect(mensagem.html).toContain("http://localhost:3333/confirmacao-email/abc");
    });

    it("no reenvio muda o assunto", async () => {
        await enviarEmailConfirmacao({ nome: "Ana", email: "a@x.com", token: "abc", reenvio: true });
        expect((sendMail.mock.calls[0]![0] as any).subject).toBe("Novo link de confirmação do Protutal");
    });

    it("propaga o erro de envio para quem chamou", async () => {
        sendMail.mockRejectedValue(new Error("SMTP fora"));
        await expect(enviarEmailConfirmacao({ nome: "Ana", email: "a@x.com", token: "abc" })).rejects.toThrow("SMTP fora");
    });
});

describe("enviarEmailRedefinicaoSenha", () => {
    it("envia o link do front com o token codificado", async () => {
        await enviarEmailRedefinicaoSenha({ nome: "Ana", email: "a@x.com", token: "a.b+c" });

        const mensagem = sendMail.mock.calls[0]![0] as any;
        expect(mensagem.subject).toBe("Redefinição de senha do Protutal");
        expect(mensagem.text).toContain("http://localhost:3000/redefinir-senha?token=a.b%2Bc");
    });

    it("propaga o erro de envio", async () => {
        sendMail.mockRejectedValue(new Error("SMTP fora"));
        await expect(enviarEmailRedefinicaoSenha({ nome: "Ana", email: "a@x.com", token: "t" })).rejects.toThrow("SMTP fora");
    });
});
