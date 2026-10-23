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

// Mesmas regras do CreateSalaService (POST /salas), com mensagens mais amigáveis.
// Se o erro vier da API, a mensagem mostrada é a da API.
export function validarSala(nome: string, serie: string, anoLetivo: string): string | null {
    if(nome.trim() === "") return "O nome é obrigatório";
    if(nome.trim().length > 100) return "O nome deve ter no máximo 100 caracteres";

    if(serie === "") return "A série é obrigatória";
    if(!["1", "2", "3"].includes(serie)) return "A série deve ser 1, 2 ou 3";

    if(anoLetivo.trim() === "") return "O ano letivo é obrigatório";
    if(!Number.isInteger(Number(anoLetivo))) return "O ano letivo deve ser um número inteiro";

    return null
}
