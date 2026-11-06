import { describe, it, expect } from "@jest/globals";
import { sign } from "jsonwebtoken";
import { prismaMock } from "../mocks/prisma";
import { gerarTokenRedefinicao, validarTokenRedefinicao } from "../../helpers/tokenRedefinicaoSenha";

// aqui o jsonwebtoken é o real: o teste gera e valida tokens de verdade
const HASH = "$2a$08$hashatualdasenha";

describe("tokenRedefinicaoSenha", () => {
    it("token gerado é válido enquanto a senha não muda (professor)", async () => {
        const token = gerarTokenRedefinicao({ tipo: "professor", id: 4, senha: HASH });
        prismaMock.professor.findUnique.mockResolvedValue({ senha: HASH } as any);

        await expect(validarTokenRedefinicao(token)).resolves.toEqual({ tipo: "professor", id: 4, senha: HASH });
        expect(prismaMock.professor.findUnique).toHaveBeenCalledWith({ where: { id_professor: 4 }, select: { senha: true } });
    });

    it("token gerado é válido para aluno", async () => {
        const token = gerarTokenRedefinicao({ tipo: "aluno", id: 9, senha: HASH });
        prismaMock.aluno.findUnique.mockResolvedValue({ senha: HASH } as any);

        await expect(validarTokenRedefinicao(token)).resolves.toEqual({ tipo: "aluno", id: 9, senha: HASH });
    });

    it("null depois que a senha muda (uso único)", async () => {
        const token = gerarTokenRedefinicao({ tipo: "aluno", id: 9, senha: HASH });
        prismaMock.aluno.findUnique.mockResolvedValue({ senha: "$2a$08$outrohash" } as any);

        await expect(validarTokenRedefinicao(token)).resolves.toBeNull();
    });

    it("null quando o usuário não existe", async () => {
        const token = gerarTokenRedefinicao({ tipo: "aluno", id: 9, senha: HASH });
        prismaMock.aluno.findUnique.mockResolvedValue(null);

        await expect(validarTokenRedefinicao(token)).resolves.toBeNull();
    });

    it("null para texto que não é JWT", async () => {
        await expect(validarTokenRedefinicao("nao-e-um-token")).resolves.toBeNull();
    });

    it("null para token de login (outra finalidade)", async () => {
        const tokenLogin = sign({ email: "a@x.com" }, `${process.env.JWT_SECRET}${HASH}`, { subject: "9" });
        await expect(validarTokenRedefinicao(tokenLogin)).resolves.toBeNull();
        expect(prismaMock.aluno.findUnique).not.toHaveBeenCalled();
    });

    it("null para id inválido no sub", async () => {
        const token = sign({ tipo: "aluno", finalidade: "redefinir_senha" }, "x", { subject: "abc" });
        await expect(validarTokenRedefinicao(token)).resolves.toBeNull();
    });

    it("null para tipo desconhecido", async () => {
        const token = sign({ tipo: "admin", finalidade: "redefinir_senha" }, "x", { subject: "1" });
        await expect(validarTokenRedefinicao(token)).resolves.toBeNull();
    });

    it("null para token expirado", async () => {
        const token = sign({ tipo: "aluno", finalidade: "redefinir_senha" }, `${process.env.JWT_SECRET}${HASH}`, { subject: "9", expiresIn: -10 });
        prismaMock.aluno.findUnique.mockResolvedValue({ senha: HASH } as any);
        await expect(validarTokenRedefinicao(token)).resolves.toBeNull();
    });
});
