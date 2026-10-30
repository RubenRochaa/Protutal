"use client"

import { ErrorState } from '@/components/errorState'

// Erro inesperado ao montar a página (os erros da API já são tratados nos blocos)
export default function ErroTutor({ reset }: { error: Error; reset: () => void }){
    return <ErrorState mensagem="Algo deu errado ao abrir esta página." retry={reset} />
}
