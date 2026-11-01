"use client"

import { ErroInesperado } from '@/components/erroInesperado'

// Erro inesperado ao montar a página (os erros da API já são tratados no page.tsx).
// Fica dentro do layout do professor, então o Header continua aparecendo
export default function ErroProfessor({ error, reset }: { error: Error & { digest?: string }; reset: () => void }){
    return <ErroInesperado error={error} reset={reset} inicio="/professor" />
}
