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

// Nome do usuário logado, para o avatar do Header.
// Só o login devolve o nome; nenhuma outra rota da API devolve, por isso fica em cookie
export async function getNomeServer(){
    const cookieStore = await cookies();
    const nome = cookieStore.get("nome")?.value

    return nome || null
}

// Grava o token, o perfil e o nome depois do login.
// httpOnly: true -> nenhum script no navegador consegue ler o token
export async function setSessaoServer(token: string, perfil: Perfil, nome: string){
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
    cookieStore.set("nome", nome, opcoes)
}

// Usado no logout e quando a API responde 401 (token vencido ou inválido).
// path "/" igual ao da gravação, senão o navegador não apaga o cookie
export async function deleteSessaoServer(){
    const cookieStore = await cookies();

    cookieStore.delete({ name: "session", path: "/" })
    cookieStore.delete({ name: "perfil", path: "/" })
    cookieStore.delete({ name: "nome", path: "/" })
}
