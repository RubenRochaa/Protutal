import { AppError } from "../errors/AppError";

// Validações de id usadas em vários services e middlewares.
// Elas só substituem os "if" que estavam repetidos: mesma regra e mesma mensagem (passada por quem chama).

// id que já chega como número (em geral vindo da URL, convertido com Number no controller):
// "abc" vira NaN e "1.5" não é inteiro, então os dois caem aqui. Lança 400 se não for inteiro positivo.
function validarId(id: number, mensagem: string): void {
    if (!Number.isInteger(id) || id <= 0) {
        throw new AppError(mensagem, 400);
    }
}

// id obrigatório vindo do corpo da requisição (JSON), que pode chegar como número ou texto ("5").
// undefined e null são recusados; o resto é convertido com Number antes de conferir.
// Lança 400 se não for inteiro positivo.
function validarIdObrigatorio(valor: unknown, mensagem: string): void {
    if (valor === undefined || valor === null || !Number.isInteger(Number(valor)) || Number(valor) <= 0) {
        throw new AppError(mensagem, 400);
    }
}

export { validarId, validarIdObrigatorio };
