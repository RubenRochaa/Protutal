"use client"

import { ErrorState } from '@/components/errorState'

// Erro inesperado ao montar a página (os erros da API já são tratados no page.tsx)
export default function ErroProfessor({ reset }: { error: Error; reset: () => void }){
    return <ErrorState mensagem="Algo deu errado ao abrir esta página." retry={reset} />
}
