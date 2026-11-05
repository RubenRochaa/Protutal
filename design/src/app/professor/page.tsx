import styles from './page.module.scss'
import { api } from '@/services/api'
import { getCookieServer } from '@/lib/cookieServer'
import { getErrorMessage } from '@/lib/getErrorMessage'
import { sessaoExpiradaNaPagina } from '@/lib/sessaoExpirada'
import { Sala } from '@/lib/types'
import { PageBanner } from '@/components/pageBanner'
import { CardsResumo } from './components/cardsResumo'
import { ListaSalas } from './components/listaSalas'
import { ErroCarregamento } from './components/erroCarregamento'

// Busca as salas do professor logado (rota P20 - GET /salas).
// Roda no servidor: o token está no cookie httpOnly e não pode ir para o navegador.
async function buscarSalas(): Promise<{ salas: Sala[] } | { erro: unknown }> {
    const token = await getCookieServer()

    try {
        const response = await api.get<Sala[]>("/salas", {
            headers: { Authorization: `Bearer ${token}` }
        })

        return { salas: response.data }
    } catch(err) {
        return { erro: err }
    }
}

// Página inicial do professor: banner, cards de resumo e a lista "Minhas salas"
export default async function ProfessorPage(){
    const resultado = await buscarSalas()

    // Fora do try/catch: o redirect do Next funciona lançando um erro
    if("erro" in resultado) sessaoExpiradaNaPagina(resultado.erro)

    return (
        <main>
            <PageBanner titulo="Bem-vindo ao Protutal!" />

            <div className={styles.conteudo}>
                <CardsResumo />

                <section id="salas" className={styles.secao}>
                    <h2 className={styles.titulo}>Minhas salas</h2>

                    {"erro" in resultado
                        ? <ErroCarregamento mensagem={getErrorMessage(resultado.erro)} />
                        : <ListaSalas salas={resultado.salas} />
                    }
                </section>
            </div>
        </main>
    )
}
