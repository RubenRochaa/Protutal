import { redirect } from 'next/navigation'
import { getErrorStatus } from './getErrorMessage'
import { deleteSessaoServer } from './cookieServer'

// Para onde vai quem está com o token vencido ou inválido (API respondeu 401).
// O login lê "?sessao=expirada" e mostra o toast "Sua sessão expirou. Entre novamente."
export const LOGIN_SESSAO_EXPIRADA = "/?sessao=expirada"

// Server Component (página): não pode apagar cookies, então manda para a rota
// /sessao-expirada (app/sessao-expirada/route.ts), que apaga e volta para o login.
// Chame FORA do try/catch: o redirect do Next funciona lançando um erro.
export function sessaoExpiradaNaPagina(err: unknown){
    if(getErrorStatus(err) === 401) redirect("/sessao-expirada");
}

// Server Action (formulário): aqui dá para apagar os cookies direto.
// Também chame FORA do try/catch.
export async function sessaoExpiradaNaAction(err: unknown){
    if(getErrorStatus(err) !== 401) return;

    await deleteSessaoServer()
    redirect(LOGIN_SESSAO_EXPIRADA)
}
