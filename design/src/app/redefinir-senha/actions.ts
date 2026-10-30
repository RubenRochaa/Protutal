"use server"

import { api } from '@/services/api'
import { getErrorMessage, getErrorStatus } from '@/lib/getErrorMessage'
import { validarNovaSenha } from '@/lib/validacao'
import { ActionState } from '@/lib/types'

// Avisa a tela quando o link não vale mais, para ela trocar o formulário pelo pedido de um novo link
export interface RedefinirSenhaState extends ActionState {
    tokenInvalido?: boolean;
}

// Roda no servidor: troca a senha com o token do link (rota O6).
// Os campos já foram validados aqui, então um 400 da API só pode ser do token
// (inválido, expirado ou já usado: o RedefinirSenhaService não diferencia)
export async function handleRedefinirSenha(_estado: RedefinirSenhaState, formData: FormData): Promise<RedefinirSenhaState> {
    const token = String(formData.get("token") ?? "")
    const senha = String(formData.get("senha") ?? "")
    const confirmacao = String(formData.get("confirmacao") ?? "")

    if(token === "") return { tokenInvalido: true };

    // Valida de novo aqui: o navegador pode ter sido burlado
    const erroValidacao = validarNovaSenha(senha, confirmacao)
    if(erroValidacao) return { error: erroValidacao };

    try {
        const response = await api.post("/redefinicao-senha", { token, senha })

        return { sucesso: response.data.mensagem, redirecionar: "/" }
    } catch(err) {
        return {
            error: getErrorMessage(err),
            tokenInvalido: getErrorStatus(err) === 400
        }
    }
}
