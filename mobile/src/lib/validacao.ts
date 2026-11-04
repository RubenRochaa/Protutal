import { Perfil } from './types'

// Mesmas regras e mensagens do site (design/src/lib/validacao.ts), que seguem os services
// de cadastro e login do back-end (CreateProfessorService, CreateAlunoService, Auth*Service)

const DOMINIO_PROFESSOR = process.env.EXPO_PUBLIC_DOMINIO_PROFESSOR?.toLowerCase()
const DOMINIO_ALUNO = process.env.EXPO_PUBLIC_DOMINIO_ALUNO?.toLowerCase()

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

// Nota de 0 a 10 com no máximo 2 casas (mesma regra e mensagens do site e das rotas T3 e T4).
// Aceita vírgula ("8,5") e devolve o número que a API espera (8.5).
// "campo" é o nome usado pela rota: "valor" na T3 e na T4
export function validarNota(texto: string, campo = "nota"): { valor: number } | { erro: string } {
    const limpo = texto.trim().replace(",", ".")

    if(limpo === "" || !/^\d+(\.\d+)?$/.test(limpo)) return { erro: `O campo ${campo} é obrigatório e deve ser um número` };

    const valor = Number(limpo)

    if(valor < 0 || valor > 10) return { erro: `A ${campo} deve estar entre 0 e 10` };
    if((limpo.split(".")[1] ?? "").length > 2) return { erro: `A ${campo} deve ter no máximo 2 casas decimais` };

    return { valor }
}

// Nova sala (rota P19): mesmas regras e mensagens do site e do CreateSalaService
export function validarSala(nome: string, serie: string, anoLetivo: string): string | null {
    if(nome.trim() === "") return "O campo nome é obrigatório";
    if(nome.trim().length > 100) return "O nome deve ter no máximo 100 caracteres";

    if(serie.trim() === "") return "O campo serie é obrigatório";
    if(!["1", "2", "3"].includes(serie.trim())) return "A serie deve ser 1, 2 ou 3";

    if(anoLetivo.trim() === "") return "O campo ano_letivo é obrigatório";
    if(!Number.isInteger(Number(anoLetivo))) return "O ano_letivo deve ser um número inteiro";

    return null
}
