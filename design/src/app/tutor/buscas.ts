import { cache } from 'react'
import { getAutenticado } from '@/lib/apiServer'
import { DesempenhoTutorVinculo, FeedbacksResposta, TipoAtividadeOpcao, TutoriaTutor } from '@/lib/types'

// Buscas usadas por mais de um bloco (ou pelo layout e pela página) no mesmo acesso.
// Rodam só no servidor. O cache() do React faz os blocos dividirem a mesma resposta:
// a API recebe uma requisição só por acesso. Os parâmetros vão como texto ("" = sem filtro).

// Rota T1 - GET /tutores/me/tutorias (?status=ativa|finalizada; "" = todas)
export const buscarTutorias = cache(async (status: string) => {
    return getAutenticado<TutoriaTutor[]>("/tutores/me/tutorias", status ? { status } : undefined)
})

// Rota T8 - GET /tipos-atividade (rótulos legíveis dos tipos)
export const buscarTipos = cache(async () => {
    return getAutenticado<TipoAtividadeOpcao[]>("/tipos-atividade")
})

// Rota T6 - GET /tutores/me/desempenho
export const buscarDesempenho = cache(async () => {
    return getAutenticado<DesempenhoTutorVinculo[]>("/tutores/me/desempenho")
})

// Rota T7 - GET /feedbacks (?etapa=, ?ano=, ?id_aluno=)
export const buscarFeedbacks = cache(async (etapa: string, ano: string, idAluno: string) => {
    return getAutenticado<FeedbacksResposta>("/feedbacks", filtros({ etapa, ano, id_aluno: idAluno }))
})

// Só os filtros preenchidos vão para a API (?etapa= vazio daria 400)
export function filtros(valores: Record<string, string>){
    return Object.fromEntries(Object.entries(valores).filter(([, valor]) => valor !== ""))
}

// Salas distintas das tutorias da T1, na ordem em que aparecem.
// "temAtiva" = o tutor tem pelo menos uma tutoria ativa na sala (regra da T5)
export function salasDasTutorias(tutorias: TutoriaTutor[]){
    const salas = new Map<number, { id_sala: number; nome: string; temAtiva: boolean }>()

    for(const tutoria of tutorias){
        const sala = salas.get(tutoria.sala.id_sala) ?? { id_sala: tutoria.sala.id_sala, nome: tutoria.sala.nome, temAtiva: false }
        if(tutoria.status === "ativa") sala.temAtiva = true
        salas.set(sala.id_sala, sala)
    }

    return [...salas.values()]
}

// Id vindo da URL: só inteiro positivo; qualquer outra coisa vira "" (sem filtro)
export function idDaUrl(valor: string | string[] | undefined): string {
    return typeof valor === "string" && /^[1-9]\d*$/.test(valor) ? valor : ""
}
