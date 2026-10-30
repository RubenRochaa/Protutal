import styles from './pagina.module.scss'
import { Suspense } from 'react'
import { Card } from '@/components/card'
import { Loading } from '@/components/loading'
import { PageBanner } from '@/components/pageBanner'
import { CardTutoria } from './components/cardTutoria'
import { CardPendentes } from './components/cardPendentes'
import { CardEvolucao } from './components/cardEvolucao'
import { CardContestacoes } from './components/cardContestacoes'

// Início do tutor (print 1): banner e os 4 cards.
// Cada card busca a própria rota; o Suspense deixa um carregar sem esperar os outros
export default function TutorPage(){
    return (
        <main>
            <PageBanner titulo="Bem-vindo ao Protutal!" />

            <div className={styles.grade}>
                <CardTutoria />

                <Suspense fallback={<Card titulo="Atividades pendentes"><Loading /></Card>}>
                    <CardPendentes />
                </Suspense>

                <Suspense fallback={<Card titulo="Minhas notas e evolução"><Loading /></Card>}>
                    <CardEvolucao />
                </Suspense>

                <Suspense fallback={<Card titulo="Avaliações com justificativa"><Loading /></Card>}>
                    <CardContestacoes />
                </Suspense>
            </div>
        </main>
    )
}
