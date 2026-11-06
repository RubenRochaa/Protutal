import { jest, beforeEach } from "@jest/globals";
import { mockReset } from "jest-mock-extended";
import { prismaMock } from "./mocks/prisma";

// Roda antes de cada arquivo de teste (setupFilesAfterEnv no jest.config.ts).

// 1) troca o client real do Prisma (src/prisma/index.ts) pelo mock:
//    nenhum teste conecta no banco compartilhado do grupo
jest.mock("../prisma", () => ({
    __esModule: true,
    default: require("./mocks/prisma").prismaMock,
}));

// 2) variáveis de ambiente falsas (os testes não leem o .env real)
process.env.JWT_SECRET = "segredo-de-teste";
process.env.DOMINIOS_PERMITIDOS_ALUNO = "portalsesisp.org.br";
process.env.DOMINIOS_PERMITIDOS_PROFESSOR = "portalsesi.org.br";
process.env.EMAIL_USER = "teste@gmail.com";
process.env.EMAIL_PASS = "senha-de-app-teste";

beforeEach(() => {
    // zera o que cada teste configurou no Prisma falso
    mockReset(prismaMock);

    // os services logam erros esperados com console.error (ex.: falha no envio de e-mail);
    // silencia para a saída do teste ficar limpa. Dá para conferir com expect(console.error).toHaveBeenCalled()
    jest.spyOn(console, "error").mockImplementation(() => {});
});
