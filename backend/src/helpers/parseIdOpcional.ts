import { AppError } from "../errors/AppError";

// converte um id opcional da query string; se vier, precisa ser um inteiro positivo.
// usado nos filtros de listagem da sala (P11 atividades, P14 notas)
function parseIdOpcional(valor: string | undefined, mensagem: string) {
    if (valor === undefined) {
        return undefined;
    }

    const id = Number(valor);

    if (!Number.isInteger(id) || id <= 0) {
        throw new AppError(mensagem, 400);
    }

    return id;
}

export { parseIdOpcional };
