import { cookies } from 'next/headers'
import { Perfil } from './types'

// O token dura 30 dias na API; o cookie dura o mesmo tempo
const TRINTA_DIAS = 60 * 60 * 24 * 30;

export async function getCookieServer(){
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value

    return token || null
}

export async function getPerfilServer(){
    const cookieStore = await cookies();
    const perfil = cookieStore.get("perfil")?.value

    if(perfil === "professor" || perfil === "aluno") return perfil as Perfil;

    return null
}

// Grava o token e o perfil depois do login.
// httpOnly: true -> nenhum script no navegador consegue ler o token
export async function setSessaoServer(token: string, perfil: Perfil){
    const cookieStore = await cookies();
    const opcoes = {
        maxAge: TRINTA_DIAS,
        path: "/",
        httpOnly: true,
        sameSite: "lax" as const,
        secure: process.env.NODE_ENV === "production"
    }

    cookieStore.set("session", token, opcoes)
    cookieStore.set("perfil", perfil, opcoes)
}

// Usado no logout e quando a API responde 401 (token vencido ou inválido)
export async function deleteSessaoServer(){
    const cookieStore = await cookies();

    cookieStore.delete("session")
    cookieStore.delete("perfil")
}
