import { describe, it, expect } from "@jest/globals";
import { AppError } from "../../errors/AppError";

describe("AppError", () => {
    it("guarda a mensagem e o status informado", () => {
        const erro = new AppError("Sala não encontrada", 404);

        expect(erro.message).toBe("Sala não encontrada");
        expect(erro.statusCode).toBe(404);
        expect(erro.name).toBe("AppError");
    });

    it("usa status 400 quando nenhum status é informado", () => {
        const erro = new AppError("Dados inválidos");

        expect(erro.statusCode).toBe(400);
    });

    it("guarda os dados extras quando informados", () => {
        const erro = new AppError("Pedido bloqueado", 409, { liberado_em: "2026-11-06T12:00:00.000Z" });

        expect(erro.dados).toEqual({ liberado_em: "2026-11-06T12:00:00.000Z" });
    });

    it("deixa dados como undefined quando não informados", () => {
        const erro = new AppError("Erro qualquer", 400);

        expect(erro.dados).toBeUndefined();
    });

    it("é uma instância de Error (o handler do server.ts depende do instanceof)", () => {
        const erro = new AppError("Erro qualquer");

        expect(erro).toBeInstanceOf(Error);
        expect(erro).toBeInstanceOf(AppError);
    });
});
