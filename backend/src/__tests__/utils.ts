import { expect } from "@jest/globals";
import { AppError } from "../errors/AppError";

// Funções de apoio usadas em vários testes.

// confere que uma função SÍNCRONA lança AppError com a mensagem e o status esperados
export function esperaAppError(fn: () => unknown, mensagem: string, status: number) {
    let erro: unknown;

    try {
        fn();
    } catch (e) {
        erro = e;
    }

    expect(erro).toBeInstanceOf(AppError);
    expect((erro as AppError).message).toBe(mensagem);
    expect((erro as AppError).statusCode).toBe(status);
}

// confere que uma Promise (ex.: service.execute) rejeita com AppError, a mensagem e o status esperados
export async function esperaAppErrorAsync(promessa: Promise<unknown>, mensagem: string, status: number) {
    await expect(promessa).rejects.toBeInstanceOf(AppError);
    await expect(promessa).rejects.toMatchObject({ message: mensagem, statusCode: status });
}
