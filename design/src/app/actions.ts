"use server"

import { api } from '@/services/api'
import { setSessaoServer } from '@/lib/cookieServer'
import { getErrorMessage } from '@/lib/getErrorMessage'
import { perfilPeloEmail, validarLogin } from '@/lib/validacao'
import { ActionState } from '@/lib/types'

const ROTA_SESSAO = {
    professor: "/sessao/professores",
    aluno: "/sessao/alunos",
}

// Roda no servidor: chama o login certo pelo domínio do e-mail e grava os cookies.
// No login, 401 significa "Email ou senha incorretos" (não é sessão expirada).
export async function handleLogin(_estado: ActionState, formData: FormData): Promise<ActionState> {
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
        return { error: getErrorMessage(err), valores }
    }
}
