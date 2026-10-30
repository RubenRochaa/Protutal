"use client"

import { ErroInesperado } from '@/components/erroInesperado'

// Erro inesperado ao montar a página (os erros da API já são tratados nos blocos).
// Fica dentro do layout do tutor, então o Header continua aparecendo
export default function ErroTutor({ error, reset }: { error: Error & { digest?: string }; reset: () => void }){
    return <ErroInesperado error={error} reset={reset} inicio="/tutor" />
}
