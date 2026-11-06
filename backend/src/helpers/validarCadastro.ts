import { AppError } from "../errors/AppError";

interface DadosCadastro {
    nome: string;
    email: string;
    senha: string;
}

// validações do cadastro, iguais para aluno e professor (nessa ordem):
// campos obrigatórios -> formato do email -> domínio permitido.
// variavelDominios é o nome da variável de ambiente com a lista de domínios
// ("DOMINIOS_PERMITIDOS_ALUNO" ou "DOMINIOS_PERMITIDOS_PROFESSOR").
function validarDadosCadastro({ nome, email, senha }: DadosCadastro, variavelDominios: string): void {
    // os três campos precisam ser texto não vazio (número, array ou objeto quebrariam
    // o email.split mais abaixo e virariam erro 500)
    if (
        typeof nome !== "string" || nome.trim() === "" ||
        typeof email !== "string" || email.trim() === "" ||
        typeof senha !== "string" || senha === ""
    ) {
        throw new AppError("Nome, email e senha são obrigatórios", 400);
    }

    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (!emailValido) {
        throw new AppError("Email em formato inválido", 400);
    }

    // Domínios aceitos vêm da variável de ambiente, separados por vírgula
    const dominiosPermitidos = (process.env[variavelDominios] || "")
        .split(",")
        .map((dominio) => dominio.trim().toLowerCase())
        .filter((dominio) => dominio !== "");

    const dominioEmail = email.split("@")[1].toLowerCase();

    if (!dominiosPermitidos.includes(dominioEmail)) {
        throw new AppError("Domínio de email não permitido", 400);
    }
}

export { validarDadosCadastro };
