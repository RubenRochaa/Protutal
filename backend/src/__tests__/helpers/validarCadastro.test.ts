import { describe, it, expect } from "@jest/globals";
import { validarDadosCadastro } from "../../helpers/validarCadastro";

const ALUNO = "DOMINIOS_PERMITIDOS_ALUNO";
const PROFESSOR = "DOMINIOS_PERMITIDOS_PROFESSOR";

describe("validarDadosCadastro", () => {
    it("aceita aluno com e-mail @portalsesisp.org.br", () => {
        expect(() => validarDadosCadastro({ nome: "Ana", email: "ana.silva@portalsesisp.org.br", senha: "123456" }, ALUNO)).not.toThrow();
    });

    it("aceita professor com e-mail @portalsesi.org.br", () => {
        expect(() => validarDadosCadastro({ nome: "Carlos", email: "carlos.lima@portalsesi.org.br", senha: "123456" }, PROFESSOR)).not.toThrow();
    });

    it("compara o domínio sem diferenciar maiúsculas", () => {
        expect(() => validarDadosCadastro({ nome: "Ana", email: "ana@PortalSesiSP.org.br", senha: "x" }, ALUNO)).not.toThrow();
    });

    it("aceita lista com vários domínios separados por vírgula (com espaços)", () => {
        const anterior = process.env.DOMINIOS_PERMITIDOS_ALUNO;
        process.env.DOMINIOS_PERMITIDOS_ALUNO = " outro.org.br , portalsesisp.org.br ";
        expect(() => validarDadosCadastro({ nome: "Ana", email: "ana@outro.org.br", senha: "x" }, ALUNO)).not.toThrow();
        process.env.DOMINIOS_PERMITIDOS_ALUNO = anterior;
    });

    it.each([
        { nome: "", email: "a@portalsesisp.org.br", senha: "1" },
        { nome: "   ", email: "a@portalsesisp.org.br", senha: "1" },
        { nome: "Ana", email: "", senha: "1" },
        { nome: "Ana", email: "a@portalsesisp.org.br", senha: "" },
        { nome: "Ana", email: 123, senha: "1" },
        { nome: undefined, email: "a@portalsesisp.org.br", senha: "1" },
    ])("recusa campos obrigatórios ausentes/inválidos: %p", (dados) => {
        expect(() => validarDadosCadastro(dados as any, ALUNO)).toThrow("Nome, email e senha são obrigatórios");
    });

    it.each(["semarroba.com", "a@b", "a b@portalsesisp.org.br", "@portalsesisp.org.br"])("recusa e-mail mal formado %p", (email) => {
        expect(() => validarDadosCadastro({ nome: "Ana", email, senha: "1" }, ALUNO)).toThrow("Email em formato inválido");
    });

    it("recusa domínio que não é do SESI", () => {
        expect(() => validarDadosCadastro({ nome: "Ana", email: "ana@gmail.com", senha: "1" }, ALUNO)).toThrow("Domínio de email não permitido");
    });

    it("recusa domínio de professor no cadastro de aluno (e vice-versa)", () => {
        expect(() => validarDadosCadastro({ nome: "Ana", email: "ana@portalsesi.org.br", senha: "1" }, ALUNO)).toThrow("Domínio de email não permitido");
        expect(() => validarDadosCadastro({ nome: "Carlos", email: "c@portalsesisp.org.br", senha: "1" }, PROFESSOR)).toThrow("Domínio de email não permitido");
    });

    it("recusa tudo quando a variável de domínios não existe", () => {
        expect(() => validarDadosCadastro({ nome: "Ana", email: "ana@portalsesisp.org.br", senha: "1" }, "VARIAVEL_INEXISTENTE")).toThrow("Domínio de email não permitido");
    });
});
