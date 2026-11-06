import { describe, it, expect } from "@jest/globals";
import { validarArquivoUnico, validarArquivoDocumento, TAMANHO_MAXIMO_ARQUIVO } from "../../helpers/validarArquivo";

const arquivo = (name: string, size = 1000) => ({ name, size } as any);

describe("validarArquivoUnico", () => {
    it("aceita um arquivo só", () => {
        expect(() => validarArquivoUnico(arquivo("a.pdf"))).not.toThrow();
    });

    it("recusa array (campo file repetido)", () => {
        expect(() => validarArquivoUnico([arquivo("a.pdf"), arquivo("b.pdf")])).toThrow("Envie apenas um arquivo no campo file");
    });
});

describe("validarArquivoDocumento", () => {
    it.each(["a.pdf", "a.DOC", "a.docx", "a.xls", "a.xlsx", "a.csv"])("aceita %p", (nome) => {
        expect(() => validarArquivoDocumento(arquivo(nome))).not.toThrow();
    });

    it.each(["a.png", "a.exe", "semextensao", "a.pdf.zip"])("recusa formato %p", (nome) => {
        expect(() => validarArquivoDocumento(arquivo(nome))).toThrow("Formato não aceito");
    });

    it("aceita exatamente 10 MB e recusa acima disso", () => {
        expect(() => validarArquivoDocumento(arquivo("a.pdf", TAMANHO_MAXIMO_ARQUIVO))).not.toThrow();
        expect(() => validarArquivoDocumento(arquivo("a.pdf", TAMANHO_MAXIMO_ARQUIVO + 1))).toThrow("O arquivo deve ter no máximo 10 MB");
    });

    it("recusa array antes de olhar a extensão", () => {
        expect(() => validarArquivoDocumento([arquivo("a.pdf")] as any)).toThrow("Envie apenas um arquivo no campo file");
    });
});
