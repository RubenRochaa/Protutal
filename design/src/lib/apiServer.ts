import { api } from '@/services/api'
import { getCookieServer } from './cookieServer'

export type ResultadoGet<T> = { dados: T } | { erro: unknown }

// GET autenticado para Server Components: manda o token do cookie "session" como Bearer.
// Não lança erro: devolve { dados } ou { erro }, para a página decidir o que mostrar.
// Com o erro, use sessaoExpiradaNaPagina (401) e getErrorMessage (mensagem do toast).
export async function getAutenticado<T>(url: string, params?: Record<string, string | number>): Promise<ResultadoGet<T>> {
    const token = await getCookieServer()

    try {
        const response = await api.get<T>(url, {
            params,
            headers: { Authorization: `Bearer ${token}` }
        })

        return { dados: response.data }
    } catch(err) {
        return { erro: err }
    }
}
