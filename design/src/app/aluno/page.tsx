import styles from './page.module.scss'
import { Suspense } from 'react'
import { Card } from '@/components/card'
import { Loading } from '@/components/loading'
import { PageBanner } from '@/components/pageBanner'
import { CardTutoria } from './components/cardTutoria'
import { CardNotas } from './components/cardNotas'
import { CardPendentes } from './components/cardPendentes'
import { MASCOTES } from '@/lib/mascotes'

// Página inicial do aluno: banner e os 3 cards do Figma.
// Cada card busca a própria rota; o Suspense deixa um carregar sem esperar os outros
export default function AlunoPage(){
    return (
        <main>
            <PageBanner titulo="Bem-vindo ao Protutal!" imagem={MASCOTES.telaInicial} />

            <div className={styles.grade}>
                <Suspense fallback={<Card titulo="Minha tutoria"><Loading /></Card>}>
                    <CardTutoria />
                </Suspense>

                <Suspense fallback={<Card titulo="Minhas notas e evolução"><Loading /></Card>}>
                    <CardNotas />
                </Suspense>

                <Suspense fallback={<Card titulo="Atividades pendentes"><Loading /></Card>}>
                    <CardPendentes />
                </Suspense>
            </div>
        </main>
    )
}
