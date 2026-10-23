"use server"

import { api } from '@/services/api'
import { getErrorMessage } from '@/lib/getErrorMessage'
import { perfilPeloEmail, validarCadastro } from '@/lib/validacao'
import { ActionState } from '@/lib/types'

const ROTA_CADASTRO = {
    professor: "/professores",
    aluno: "/alunos",
}

// Roda no servidor: cadastra professor ou aluno conforme o domínio do e-mail.
// A API não devolve token no cadastro, então o usuário volta para o login.
export async function handleCadastro(_estado: ActionState, formData: FormData): Promise<ActionState> {
    const nome = String(formData.get("nome") ?? "")
    const email = String(formData.get("email") ?? "").trim()
    const senha = String(formData.get("senha") ?? "")

    const valores = { nome, email }

    // Valida de novo aqui: o navegador pode ter sido burlado
    const erroValidacao = validarCadastro(nome, email, senha)
    if(erroValidacao) return { error: erroValidacao, valores };

    const perfil = perfilPeloEmail(email)!

    try {
        await api.post(ROTA_CADASTRO[perfil], { nome, email, senha })

        return {
            sucesso: "Cadastro realizado! Agora é só entrar.",
            redirecionar: "/"
        }
    } catch(err) {
        return { error: getErrorMessage(err), valores }
    }
}
