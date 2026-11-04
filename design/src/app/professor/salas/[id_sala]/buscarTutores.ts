import { cache } from 'react'
import { getAutenticado } from '@/lib/apiServer'
import { TutorSala } from '@/lib/types'

// Busca os tutores ativos da sala (rota P24 - GET /salas/:id/tutores). Roda só no servidor.
// Mesmo padrão do buscarSala.ts: o cache() do React faz o layout (interruptor de permissão)
// e a Visão geral (indicador "Tutores ativos") dividirem a mesma resposta.
export const buscarTutores = cache((idSala: string) =>
    getAutenticado<TutorSala[]>(`/salas/${encodeURIComponent(idSala)}/tutores`)
)
