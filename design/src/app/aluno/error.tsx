"use client"

import { ErroInesperado } from '@/components/erroInesperado'

// Erro inesperado ao montar a página (os erros da API já são tratados nos cards e nas telas).
// Fica dentro do layout do aluno, então o Header continua aparecendo
export default function ErroAluno({ error, reset }: { error: Error & { digest?: string }; reset: () => void }){
    return <ErroInesperado error={error} reset={reset} inicio="/aluno" />
}
