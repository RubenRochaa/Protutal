import { describe, it, expect } from "@jest/globals";
import { montarEmail, escaparHtml } from "../../templates/email/layoutEmail";
import { paginaConfirmacao } from "../../templates/email/paginaConfirmacao";

describe("escaparHtml", () => {
    it("escapa os caracteres especiais de HTML", () => {
        expect(escaparHtml(`<script>"a" & b</script>`)).toBe("&lt;script&gt;&quot;a&quot; &amp; b&lt;/script&gt;");
    });
});

describe("montarEmail", () => {
    const dados = {
        titulo: "Confirme seu e-mail",
        nome: "<b>Ana</b>",
        texto: "Texto do e-mail",
        textoBotao: "Confirmar",
        link: "http://x.com/confirmacao-email/abc",
        validade: "Este link vale por 1 hora."
    };

    it("escapa o nome no HTML (sem injeção) e mantém o texto puro", () => {
        const { html, text } = montarEmail(dados);

        expect(html).toContain("Olá, &lt;b&gt;Ana&lt;/b&gt;!");
        expect(html).not.toContain("<b>Ana</b>");
        expect(text).toContain("Olá, <b>Ana</b>!");
    });

    it("inclui título, link, botão e validade", () => {
        const { html, text } = montarEmail(dados);

        expect(html).toContain("<title>Confirme seu e-mail</title>");
        expect(html).toContain('href="http://x.com/confirmacao-email/abc"');
        expect(text).toContain("Confirmar: http://x.com/confirmacao-email/abc");
        expect(text).toContain("Este link vale por 1 hora.");
    });

    it("anexa logo e mascote por CID", () => {
        const { attachments } = montarEmail(dados);
        expect(attachments.map((a) => a.cid)).toEqual(["logo", "mascote-email"]);
    });
});

describe("paginaConfirmacao", () => {
    it("sucesso: título de confirmado e botão de login quando há FRONT_URL", () => {
        process.env.FRONT_URL = "http://localhost:3000/";
        const html = paginaConfirmacao("E-mail confirmado com sucesso", true);

        expect(html).toContain("E-mail confirmado");
        expect(html).toContain("E-mail confirmado com sucesso");
        expect(html).toContain('href="http://localhost:3000/"');
        expect(html).toContain("data:image/png;base64,");
    });

    it("falha: título de link inválido", () => {
        const html = paginaConfirmacao("Link expirado", false);
        expect(html).toContain("Link inválido");
        expect(html).toContain("Link expirado");
    });

    it("sem FRONT_URL não mostra o botão de login nem a ajuda", () => {
        delete process.env.FRONT_URL;
        const html = paginaConfirmacao("ok", true);
        expect(html).not.toContain("Ir para o login");
        expect(html).not.toContain("Precisa de ajuda?");
    });
});
