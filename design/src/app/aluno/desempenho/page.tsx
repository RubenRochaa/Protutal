import styles from './page.module.scss'
import { Suspense } from 'react'
import { Card } from '@/components/card'
import { Loading } from '@/components/loading'
import { PageBanner } from '@/components/pageBanner'
import { FiltroEtapa } from '../components/filtroEtapa'
import { NumerosDesempenho } from './components/numerosDesempenho'
import { MediasEtapa, TITULO_ETAPAS } from './components/mediasEtapa'
import { MediasConteudo, TITULO_CONTEUDO } from './components/mediasConteudo'
import { UltimasNotas, TITULO_NOTAS } from './components/ultimasNotas'
import { MinhasContestacoes, TITULO_CONTESTACOES } from './components/minhasContestacoes'

const ETAPAS_VALIDAS = ["1", "2", "3"]

interface Props {
    searchParams: Promise<{ etapa?: string | string[] }>;
}

// Tela "Meu desempenho" do aluno (print de Notas, rotas A6, A7 e A9).
// Cada bloco fica no próprio Suspense. Os blocos da A6 dividem uma requisição só (cache em ../buscas)
export default async function DesempenhoAlunoPage({ searchParams }: Props){
    const { etapa: etapaUrl } = await searchParams

    // Mesma regra de "Minhas atividades": qualquer valor fora de 1, 2 e 3 vira "Todas"
    // (a A6 responderia 400)
    const etapa = typeof etapaUrl === "string" && ETAPAS_VALIDAS.includes(etapaUrl) ? etapaUrl : ""

    return (
        <main>
            <PageBanner titulo="Meu desempenho" />

            <div className={styles.conteudo}>
                <div className={styles.filtro}>
                    <FiltroEtapa etapa={etapa} caminho="/aluno/desempenho" />
                </div>

                {/* key: ao trocar a etapa, cada Suspense mostra o Loading de novo enquanto busca */}
                <Suspense key={`numeros-${etapa}`} fallback={<Loading />}>
                    <NumerosDesempenho etapa={etapa} />
                </Suspense>

                <div className={styles.grade}>
                    <Suspense key={`etapas-${etapa}`} fallback={<Card titulo={TITULO_ETAPAS} sublinhado><Loading /></Card>}>
                        <MediasEtapa etapa={etapa} />
                    </Suspense>

                    <Suspense key={`conteudo-${etapa}`} fallback={<Card titulo={TITULO_CONTEUDO} sublinhado><Loading /></Card>}>
                        <MediasConteudo etapa={etapa} />
                    </Suspense>
                </div>

                <Suspense key={`notas-${etapa}`} fallback={<Card titulo={TITULO_NOTAS} sublinhado><Loading /></Card>}>
                    <UltimasNotas etapa={etapa} />
                </Suspense>

                {/* A A9 não tem filtro de etapa: este bloco não depende do filtro */}
                <Suspense fallback={<Card titulo={TITULO_CONTESTACOES} sublinhado><Loading /></Card>}>
                    <MinhasContestacoes />
                </Suspense>
            </div>
        </main>
    )
}
