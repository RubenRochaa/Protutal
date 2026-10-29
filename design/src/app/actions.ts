"use server"

import { api } from '@/services/api'
import { setSessaoServer } from '@/lib/cookieServer'
import { getErrorMessage, getErrorStatus } from '@/lib/getErrorMessage'
import { perfilPeloEmail, validarLogin } from '@/lib/validacao'
import { ActionState } from '@/lib/types'

const ROTA_SESSAO = {
    professor: "/sessao/professores",
    aluno: "/sessao/alunos",
}

// O login também avisa a tela quando o e-mail ainda não foi confirmado,
// para ela mostrar o botão de reenviar o link
export interface LoginState extends ActionState {
    emailNaoConfirmado?: boolean;
}

// Roda no servidor: chama o login certo pelo domínio do e-mail e grava os cookies.
// No login, 401 significa "Email ou senha incorretos" (não é sessão expirada).
// O único 403 do login é o de e-mail não confirmado (AuthAlunoService e AuthProfessorService).
export async function handleLogin(_estado: LoginState, formData: FormData): Promise<LoginState> {
    const email = String(formData.get("email") ?? "").trim()
    const senha = String(formData.get("senha") ?? "")

    // Valida de novo aqui: o navegador pode ter sido burlado
    const valores = { email }

    const erroValidacao = validarLogin(email, senha)
    if(erroValidacao) return { error: erroValidacao, valores };

    const perfil = perfilPeloEmail(email)!

    try {
        const response = await api.post(ROTA_SESSAO[perfil], { email, senha })

        await setSessaoServer(response.data.token, perfil)

        return {
            sucesso: `Bem-vindo(a), ${response.data.nome}!`,
            redirecionar: `/${perfil}`
        }
    } catch(err) {
        return {
            error: getErrorMessage(err),
            valores,
            emailNaoConfirmado: getErrorStatus(err) === 403
        }
    }
}

// Roda no servidor: pede um novo link de confirmação (rota O4).
// A API responde sempre a mesma mensagem, sem revelar se o e-mail existe.
export async function handleReenviarConfirmacao(email: string): Promise<ActionState> {
    const emailLimpo = email.trim()

    // Mesma mensagem do back-end (ReenviarConfirmacaoEmailService)
    if(emailLimpo === "") return { error: "Email é obrigatório" };

    try {
        const response = await api.post("/confirmacao-email/reenviar", { email: emailLimpo })

        return { sucesso: response.data.mensagem }
    } catch(err) {
        return { error: getErrorMessage(err) }
    }
}
