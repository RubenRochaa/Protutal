import { NextRequest, NextResponse } from "next/server";

// Áreas privadas e o perfil que pode entrar em cada uma.
// O tutor entra como aluno, por isso /tutor também exige o perfil "aluno".
const AREAS: Record<string, string> = {
    "/professor": "professor",
    "/aluno": "aluno",
    "/tutor": "aluno",
}

// Só confere os cookies. Quem garante a permissão de verdade é a API (401/403).
// Não existe rota /me na API, então o token não é validado aqui.
export function middleware(req: NextRequest){
    const { pathname } = req.nextUrl

    const area = Object.keys(AREAS).find((rota) => pathname === rota || pathname.startsWith(rota + "/"))

    // Login, cadastro, /esqueci-senha, /redefinir-senha e arquivos públicos: livres
    // (nem entram no matcher abaixo, então abrem com ou sem sessão)
    if(!area) return NextResponse.next();

    const token = req.cookies.get("session")?.value
    const perfil = req.cookies.get("perfil")?.value

    if(!token || (perfil !== "professor" && perfil !== "aluno")){
        return NextResponse.redirect(new URL("/", req.url))
    }

    // Perfil errado para a área (ex.: aluno em /professor): vai para a área do próprio perfil
    if(AREAS[area] !== perfil){
        return NextResponse.redirect(new URL(`/${perfil}`, req.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: ["/professor/:path*", "/aluno/:path*", "/tutor/:path*"],
}
