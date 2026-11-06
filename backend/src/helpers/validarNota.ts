import { AppError } from "../errors/AppError";

// confere a faixa da nota (0 a 10) e as casas decimais (no máximo 2).
// rotulo é o começo da mensagem, que varia de rota para rota: "O valor" ou "A nota".
// o "obrigatório e deve ser número" continua em cada service, porque a mensagem muda.
function validarFaixaNota(valor: number, rotulo: string): void {
    // o banco também tem um CHECK de 0 a 10
    if (valor < 0 || valor > 10) {
        throw new AppError(`${rotulo} deve estar entre 0 e 10`, 400);
    }

    // a coluna é Decimal(4,2): com mais casas o banco arredondaria sem avisar
    if (Number(valor.toFixed(2)) !== valor) {
        throw new AppError(`${rotulo} deve ter no máximo 2 casas decimais`, 400);
    }
}

export { validarFaixaNota };
