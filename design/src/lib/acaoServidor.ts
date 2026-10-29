import { revalidatePath } from 'next/cache'
import { api } from '@/services/api'
import { getCookieServer } from './cookieServer'
import { getErrorMessage } from './getErrorMessage'
import { sessaoExpiradaNaAction } from './sessaoExpirada'
import { ActionState } from './types'

interface Requisicao {
    metodo: "post" | "patch";
    url: string;
    corpo?: object;
}

// Envia uma ação autenticada à API (POST ou PATCH) de dentro de uma Server Action.
// Faz o que toda ação do professor repete: token do cookie, 401 -> sessão expirada,
// mensagem de erro padrão (getErrorMessage) e atualização das telas depois do sucesso.
// Use só em arquivos "use server".
export async function executarAcao({ metodo, url, corpo }: Requisicao, mensagemSucesso: string): Promise<ActionState> {
    const token = await getCookieServer()
    let erro: unknown

    try {
        await api.request({
            method: metodo,
            url,
            data: corpo,
            headers: { Authorization: `Bearer ${token}` }
        })
    } catch(err) {
        erro = err
    }

    if(erro){
        // Fora do try/catch: o redirect do Next funciona lançando um erro
        await sessaoExpiradaNaAction(erro)

        return { error: getErrorMessage(erro) }
    }

    // O mesmo dado aparece em várias telas (aba da sala, Notificações, cabeçalho da sala):
    // atualiza toda a área do professor de uma vez, sem recarregar a página
    revalidatePath("/professor", "layout")

    return { sucesso: mensagemSucesso }
}
