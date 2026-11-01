import { cache } from 'react'
import { api } from '@/services/api'
import { getCookieServer } from '@/lib/cookieServer'
import { SalaDetalhe } from '@/lib/types'

// Busca os dados da sala (rota P1 - GET /salas/:id). Roda só no servidor.
// O cache() do React faz o layout e a página dividirem a mesma resposta:
// os dois chamam esta função, mas a API recebe uma requisição só por acesso.
// O id vai do jeito que veio da URL: quem confere se é número é a API (400).
export const buscarSala = cache(async (idSala: string): Promise<{ sala: SalaDetalhe } | { erro: unknown }> => {
    const token = await getCookieServer()

    try {
        const response = await api.get<SalaDetalhe>(`/salas/${encodeURIComponent(idSala)}`, {
            headers: { Authorization: `Bearer ${token}` }
        })

        return { sala: response.data }
    } catch(err) {
        return { erro: err }
    }
})
