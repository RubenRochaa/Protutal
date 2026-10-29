import { cache } from 'react'
import { getAutenticado } from '@/lib/apiServer'
import { ConteudosDominados, DesempenhoAluno, TutoriaAluno } from '@/lib/types'

// Buscas usadas por mais de um bloco da mesma página. Rodam só no servidor.
// O cache() do React faz os blocos dividirem a mesma resposta (como o buscarSala do professor):
// cada bloco fica no próprio Suspense, mas a API recebe uma requisição só por acesso.
// Os parâmetros vão como texto ("" = sem filtro) para o cache reconhecer a mesma chamada.

// Rota A3 - GET /alunos/me/tutorias, sem filtro: ativas primeiro, depois as finalizadas
export const buscarTutorias = cache(async () => {
    return getAutenticado<TutoriaAluno[]>("/alunos/me/tutorias")
})

// Rota A6 - GET /alunos/me/desempenho (?etapa= e ?id_sala= opcionais)
export const buscarDesempenho = cache(async (etapa: string, idSala: string) => {
    return getAutenticado<DesempenhoAluno>("/alunos/me/desempenho", filtros({ etapa, id_sala: idSala }))
})

// Rota A7 - GET /alunos/me/conteudos-dominados (?id_sala= opcional)
export const buscarConteudosDominados = cache(async (idSala: string) => {
    return getAutenticado<ConteudosDominados>("/alunos/me/conteudos-dominados", filtros({ id_sala: idSala }))
})

// Só os filtros preenchidos vão para a API (a A6 responde 400 para ?etapa= vazio)
function filtros(valores: Record<string, string>){
    return Object.fromEntries(Object.entries(valores).filter(([, valor]) => valor !== ""))
}
