"use client"

import { useEffect } from 'react'
import { toast } from 'sonner'
import { Loading } from '@/components/loading'
import { handleLogout } from '@/components/header/actions'
import { MSG_SESSAO_EXPIRADA } from '@/lib/getErrorMessage'

// Usado por Server Components quando a API responde 401 (token vencido ou inválido).
// Server Component não consegue apagar cookie, então este componente, já no navegador,
// mostra o toast e chama a Server Action de logout (apaga os cookies e volta ao login).
// Uso: if(getErrorStatus(err) === 401) return <SessaoExpirada />
export function SessaoExpirada(){
    useEffect(() => {
        // id fixo: em desenvolvimento o efeito roda duas vezes e o toast não duplica
        toast.error(MSG_SESSAO_EXPIRADA, { id: "sessao-expirada" });
        handleLogout();
    }, []);

    return <Loading mensagem="Redirecionando para o login..." />
}
