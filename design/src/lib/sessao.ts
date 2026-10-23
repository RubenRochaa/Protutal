import { getCookieServer, deleteSessaoServer } from './cookieServer'
import { getErrorMessage, getErrorStatus, MSG_SESSAO_EXPIRADA } from './getErrorMessage'
import { ActionState } from './types'

// Funções de apoio para as chamadas autenticadas à API.
// Só rodam no servidor (Server Components e Server Actions): o token é httpOnly.

// Header de autenticação para o axios: api.get("/salas", { headers: await getAuthHeaders() })
export async function getAuthHeaders(){
    const token = await getCookieServer()

    return { Authorization: `Bearer ${token}` }
}

// Para o catch das Server Actions.
// 401 (token vencido ou inválido): apaga a sessão e manda o formulário voltar ao login.
// Outros erros: a mensagem de sempre (getErrorMessage) e os valores para preencher o form de novo.
export async function tratarErroAction(err: unknown, valores?: Record<string, string>): Promise<ActionState> {
    if(getErrorStatus(err) === 401){
        await deleteSessaoServer()

        return { error: MSG_SESSAO_EXPIRADA, redirecionar: "/" }
    }

    return { error: getErrorMessage(err), valores }
}
