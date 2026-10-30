"use server"

import { api } from '@/services/api'
import { getErrorMessage } from '@/lib/getErrorMessage'
import { validarEmailRecuperacao } from '@/lib/validacao'
import { ActionState } from '@/lib/types'

// Roda no servidor: pede o link de redefinição de senha (rota O5).
// A API responde sempre a mesma mensagem, sem revelar se o e-mail existe.
export async function handleSolicitarRedefinicao(_estado: ActionState, formData: FormData): Promise<ActionState> {
    const email = String(formData.get("email") ?? "").trim()

    const valores = { email }

    // Valida de novo aqui: o navegador pode ter sido burlado
    const erroValidacao = validarEmailRecuperacao(email)
    if(erroValidacao) return { error: erroValidacao, valores };

    try {
        const response = await api.post("/redefinicao-senha/solicitar", { email })

        return { sucesso: response.data.mensagem, valores }
    } catch(err) {
        return { error: getErrorMessage(err), valores }
    }
}
