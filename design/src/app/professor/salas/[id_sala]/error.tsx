"use client"

import { ErrorState } from '@/components/errorState'

// Erro inesperado ao montar uma aba (os erros da API já são tratados no layout e nas páginas)
export default function ErroAbaSala({ reset }: { error: Error; reset: () => void }){
    return <ErrorState mensagem="Algo deu errado ao abrir esta aba." retry={reset} />
}
