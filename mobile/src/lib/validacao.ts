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
