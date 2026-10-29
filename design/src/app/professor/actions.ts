"use server"

import { revalidatePath } from 'next/cache'
import { api } from '@/services/api'
import { getCookieServer } from '@/lib/cookieServer'
import { getErrorMessage } from '@/lib/getErrorMessage'
import { sessaoExpiradaNaAction } from '@/lib/sessaoExpirada'
import { validarSala } from '@/lib/validacao'
import { ActionState } from '@/lib/types'

// Roda no servidor: cria a sala do professor logado (rota P19 - POST /salas).
// O professor vem do token; o corpo leva só nome, serie e ano_letivo.
export async function handleCriarSala(_estado: ActionState, formData: FormData): Promise<ActionState> {
    const nome = String(formData.get("nome") ?? "")
    const serie = String(formData.get("serie") ?? "")
    const anoLetivo = String(formData.get("ano_letivo") ?? "")

    const valores = { nome, serie, ano_letivo: anoLetivo }

    // Valida de novo aqui: o navegador pode ter sido burlado
    const erroValidacao = validarSala(nome, serie, anoLetivo)
    if(erroValidacao) return { error: erroValidacao, valores };

    const token = await getCookieServer()
    let erro: unknown

    try {
        await api.post("/salas", {
            nome: nome.trim(),
            serie: Number(serie),
            ano_letivo: Number(anoLetivo)
        }, {
            headers: { Authorization: `Bearer ${token}` }
        })
    } catch(err) {
        erro = err
    }

    if(erro){
        // Fora do try/catch: o redirect do Next funciona lançando um erro
        await sessaoExpiradaNaAction(erro)

        return { error: getErrorMessage(erro), valores }
    }

    // Faz a página buscar a lista de novo, já com a sala nova
    revalidatePath("/professor")

    return { sucesso: "Sala criada com sucesso!" }
}
