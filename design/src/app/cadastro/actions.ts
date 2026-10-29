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
// A API não devolve token no cadastro, então o usuário volta para o login
// (onde precisa confirmar o e-mail antes de entrar).
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
        const response = await api.post(ROTA_CADASTRO[perfil], { nome, email, senha })

        // A mensagem da API diz se o link de confirmação foi enviado ou não.
        // "?cadastro=ok" faz o login mostrar o aviso com o botão de reenviar
        return {
            sucesso: response.data.mensagem,
            redirecionar: "/?cadastro=ok"
        }
    } catch(err) {
        return { error: getErrorMessage(err), valores }
    }
}
