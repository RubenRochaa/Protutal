import { NextRequest, NextResponse } from "next/server";

// Áreas privadas e o perfil que pode entrar em cada uma.
// O tutor entra como aluno, por isso /tutor também exige o perfil "aluno".
const AREAS: Record<string, string> = {
    "/professor": "professor",
    "/aluno": "aluno",
    "/tutor": "aluno",
}

// Rotas privadas abertas para qualquer perfil logado (professor ou aluno)
const ROTAS_TODOS_PERFIS = ["/ajuda"]

function combina(pathname: string, rota: string){
    return pathname === rota || pathname.startsWith(rota + "/")
}

// Só confere os cookies. Quem garante a permissão de verdade é a API (401/403).
// Não existe rota /me na API, então o token não é validado aqui.
export function middleware(req: NextRequest){
    const { pathname } = req.nextUrl

    const area = Object.keys(AREAS).find((rota) => combina(pathname, rota))
    const todosPerfis = ROTAS_TODOS_PERFIS.some((rota) => combina(pathname, rota))

    // Login, cadastro, /esqueci-senha, /redefinir-senha e arquivos públicos: livres
    // (nem entram no matcher abaixo, então abrem com ou sem sessão)
    if(!area && !todosPerfis) return NextResponse.next();

    const token = req.cookies.get("session")?.value
    const perfil = req.cookies.get("perfil")?.value

    if(!token || (perfil !== "professor" && perfil !== "aluno")){
        return NextResponse.redirect(new URL("/", req.url))
    }

    // Perfil errado para a área (ex.: aluno em /professor): vai para a área do próprio perfil
    if(area && AREAS[area] !== perfil){
        return NextResponse.redirect(new URL(`/${perfil}`, req.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: ["/professor/:path*", "/aluno/:path*", "/tutor/:path*", "/ajuda/:path*"],
}
