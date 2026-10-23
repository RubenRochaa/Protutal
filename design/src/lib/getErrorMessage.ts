import { isAxiosError } from 'axios'

export const MSG_SEM_CONEXAO = "Não foi possível conectar ao servidor. Tente novamente."
export const MSG_ERRO_SERVIDOR = "Erro no servidor. Tente novamente mais tarde."
export const MSG_SESSAO_EXPIRADA = "Sua sessão expirou. Entre novamente."

// Transforma qualquer erro de chamada à API na mensagem que vai para o toast.
// Toda tela usa esta função, para as mensagens serem sempre as mesmas.
export function getErrorMessage(err: unknown): string {
    if(!isAxiosError(err)) return MSG_ERRO_SERVIDOR;

    // Sem resposta: API desligada ou sem rede
    if(!err.response) return MSG_SEM_CONEXAO;

    if(err.response.status >= 500) return MSG_ERRO_SERVIDOR;

    // A API sempre devolve { "error": "mensagem" }, já em português
    const mensagem = err.response.data?.error;

    return typeof mensagem === "string" ? mensagem : MSG_ERRO_SERVIDOR;
}

// Status HTTP do erro (ex.: 401), ou null se não houve resposta da API
export function getErrorStatus(err: unknown): number | null {
    if(isAxiosError(err) && err.response) return err.response.status;

    return null
}
