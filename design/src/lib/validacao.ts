import { Perfil } from './types'

// Mesmas regras e mensagens dos services de cadastro e login do back-end
// (CreateProfessorService, CreateAlunoService, AuthProfessorService, AuthAlunoService)

const DOMINIO_PROFESSOR = process.env.NEXT_PUBLIC_DOMINIO_PROFESSOR?.toLowerCase()
const DOMINIO_ALUNO = process.env.NEXT_PUBLIC_DOMINIO_ALUNO?.toLowerCase()

const MSG_DOMINIO = "Domínio de email não permitido"

// O perfil é descoberto pelo domínio do e-mail:
// domínio do professor -> "professor"; domínio do aluno -> "aluno"; outro -> null
export function perfilPeloEmail(email: string): Perfil | null {
    const dominioEmail = email.trim().split("@")[1]?.toLowerCase();

    if(!dominioEmail) return null;
    if(dominioEmail === DOMINIO_PROFESSOR) return "professor";
    if(dominioEmail === DOMINIO_ALUNO) return "aluno";

    return null
}

export function validarLogin(email: string, senha: string): string | null {
    if(email.trim() === "" || senha === "") return "Email e senha são obrigatórios";

    // Sem um domínio conhecido não há como saber qual login chamar
    if(!perfilPeloEmail(email)) return MSG_DOMINIO;

    return null
}

export function validarCadastro(nome: string, email: string, senha: string): string | null {
    if(nome.trim() === "" || email.trim() === "" || senha === "") {
        return "Nome, email e senha são obrigatórios";
    }

    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Email em formato inválido";

    if(!perfilPeloEmail(email)) return MSG_DOMINIO;

    return null
}

// Pedido de link para redefinir a senha (rota O5): mesmo formato e domínios do cadastro
export function validarEmailRecuperacao(email: string): string | null {
    if(email.trim() === "") return "Email é obrigatório";

    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return "Email em formato inválido";

    if(!perfilPeloEmail(email)) return MSG_DOMINIO;

    return null
}

// Nova senha (rota O6): mesma regra do cadastro (só não pode ser vazia).
// A confirmação é conferida só aqui: a API recebe uma senha só
export function validarNovaSenha(senha: string, confirmacao: string): string | null {
    if(senha === "") return "A nova senha é obrigatória";

    if(senha !== confirmacao) return "As senhas não coincidem";

    return null
}

// Mesmas regras e mensagens do CreateSalaService (rota P19 - POST /salas).
// Recebe os valores como texto, do jeito que chegam do formulário.
export function validarSala(nome: string, serie: string, anoLetivo: string): string | null {
    if(nome.trim() === "") return "O campo nome é obrigatório";
    if(nome.trim().length > 100) return "O nome deve ter no máximo 100 caracteres";

    if(serie.trim() === "") return "O campo serie é obrigatório";
    if(!["1", "2", "3"].includes(serie.trim())) return "A serie deve ser 1, 2 ou 3";

    if(anoLetivo.trim() === "") return "O campo ano_letivo é obrigatório";
    if(!Number.isInteger(Number(anoLetivo))) return "O ano_letivo deve ser um número inteiro";

    return null
}

// Nota de 0 a 10 com no máximo 2 casas (mesma regra e mensagens das rotas P9 e T4).
// Aceita vírgula ("8,5") e devolve o número que a API espera (8.5).
// "campo" é o nome usado pela rota: "nota" na P9, "valor" na T4
export function validarNota(texto: string, campo = "nota"): { valor: number } | { erro: string } {
    const limpo = texto.trim().replace(",", ".")

    if(limpo === "" || !/^\d+(\.\d+)?$/.test(limpo)) return { erro: `O campo ${campo} é obrigatório e deve ser um número` };

    const valor = Number(limpo)

    if(valor < 0 || valor > 10) return { erro: `A ${campo} deve estar entre 0 e 10` };
    if((limpo.split(".")[1] ?? "").length > 2) return { erro: `A ${campo} deve ter no máximo 2 casas decimais` };

    return { valor }
}

// Campo de texto obrigatório: vazio ou só com espaços é recusado (como no back-end)
export function textoVazio(texto: string): boolean {
    return texto.trim() === ""
}

// Etapa vinda da URL (?etapa=): "1", "2" ou "3"; qualquer outra coisa vira "" (sem filtro)
export function etapaDaUrl(valor: string | string[] | undefined): string {
    return typeof valor === "string" && ["1", "2", "3"].includes(valor) ? valor : ""
}
