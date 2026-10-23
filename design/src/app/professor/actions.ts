"use server"

import { revalidatePath } from 'next/cache'
import { api } from '@/services/api'
import { getAuthHeaders, tratarErroAction } from '@/lib/sessao'
import { validarSala } from '@/lib/validacao'
import { ActionState } from '@/lib/types'

// Roda no servidor: cria a sala (turma) do professor logado.
// O professor da sala vem do token na API, nunca do formulário.
export async function handleCriarSala(_estado: ActionState, formData: FormData): Promise<ActionState> {
    const nome = String(formData.get("nome") ?? "")
    const serie = String(formData.get("serie") ?? "")
    const ano_letivo = String(formData.get("ano_letivo") ?? "")

    const valores = { nome, serie, ano_letivo }

    // Valida de novo aqui: o navegador pode ter sido burlado
    const erroValidacao = validarSala(nome, serie, ano_letivo)
    if(erroValidacao) return { error: erroValidacao, valores };

    try {
        await api.post("/salas", {
            nome: nome.trim(),
            serie: Number(serie),
            ano_letivo: Number(ano_letivo)
        }, { headers: await getAuthHeaders() })
    } catch(err) {
        return tratarErroAction(err, valores)
    }

    // Busca a lista de novo: a turma nova aparece sem recarregar a página
    revalidatePath("/professor")

    return { sucesso: `Turma ${nome.trim()} criada!` }
}
