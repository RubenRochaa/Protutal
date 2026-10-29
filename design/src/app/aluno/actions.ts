"use server"

import { revalidatePath } from 'next/cache'
import { api } from '@/services/api'
import { getCookieServer } from '@/lib/cookieServer'
import { getErrorMessage, getErrorStatus } from '@/lib/getErrorMessage'
import { sessaoExpiradaNaAction } from '@/lib/sessaoExpirada'
import { ActionState } from '@/lib/types'

// Mesma mensagem do back-end (A14), para o aluno ver o mesmo texto nos dois casos
const MSG_SEM_ARQUIVO = "O arquivo da resposta é obrigatório (campo file)"

// Páginas que mostram o status da atividade: o detalhe, a lista e o card "Atividades pendentes"
function atualizarTelas(idAtividade: number){
    revalidatePath(`/aluno/atividades/${idAtividade}`)
    revalidatePath("/aluno/atividades")
    revalidatePath("/aluno")
}

// Roda no servidor: envia a resposta do aluno logado (rota A14 - POST /atividades/:id/respostas).
// O corpo é multipart/form-data: "file" (obrigatório) e "texto" (opcional).
// O aluno responde uma vez só; depois do prazo a API aceita e marca "entregue com atraso".
export async function handleEnviarResposta(_estado: ActionState, formData: FormData): Promise<ActionState> {
    const idAtividade = Number(formData.get("id_atividade"))
    const arquivo = formData.get("file")
    const texto = String(formData.get("texto") ?? "").trim()

    // O arquivo não dá para devolver: o aluno escolhe de novo
    const valores = { texto }

    // Valida de novo aqui: o navegador pode ter sido burlado
    if(!Number.isInteger(idAtividade) || idAtividade <= 0){
        return { error: "O id da atividade deve ser um número inteiro", valores }
    }

    // Sem arquivo escolhido, o navegador manda um File vazio (sem nome e com 0 bytes)
    if(!(arquivo instanceof File) || arquivo.size === 0){
        return { error: MSG_SEM_ARQUIVO, valores }
    }

    // FormData novo só com os campos da A14 (o "id_atividade" vai na URL).
    // O axios monta o Content-Type multipart com o boundary sozinho
    const corpo = new FormData()
    corpo.append("file", arquivo, arquivo.name)
    if(texto !== "") corpo.append("texto", texto)

    const token = await getCookieServer()
    let erro: unknown

    try {
        await api.post(`/atividades/${idAtividade}/respostas`, corpo, {
            headers: { Authorization: `Bearer ${token}` }
        })
    } catch(err) {
        erro = err
    }

    if(erro){
        // Fora do try/catch: o redirect do Next funciona lançando um erro
        await sessaoExpiradaNaAction(erro)

        // 409 = já existe resposta (ex.: enviada em outra aba): a tela passa a mostrá-la
        if(getErrorStatus(erro) === 409) atualizarTelas(idAtividade)

        return { error: getErrorMessage(erro), valores }
    }

    atualizarTelas(idAtividade)

    return { sucesso: "Resposta enviada!" }
}
