import { NextRequest, NextResponse } from 'next/server'
import { deleteSessaoServer } from '@/lib/cookieServer'
import { LOGIN_SESSAO_EXPIRADA } from '@/lib/sessaoExpirada'

// A API respondeu 401 (token vencido ou inválido) dentro de uma página.
// Página não pode apagar cookie; esta rota pode: apaga "session" e "perfil" e volta para o login.
export async function GET(req: NextRequest){
    await deleteSessaoServer()

    return NextResponse.redirect(new URL(LOGIN_SESSAO_EXPIRADA, req.url))
}
