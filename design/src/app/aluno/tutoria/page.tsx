import styles from './page.module.scss'
import { Suspense } from 'react'
import { Card } from '@/components/card'
import { Loading } from '@/components/loading'
import { PageBanner } from '@/components/pageBanner'
import { ListaTutorias, TITULO_TUTORIAS } from './components/listaTutorias'
import { QueroSerTutor, TITULO_QUERO_SER_TUTOR } from './components/queroSerTutor'

// Tela de tutoria do aluno: primeiro a seção "Quero ser tutor" (GET /alunos/me/salas e A13)
// e, abaixo, "Minhas tutorias" (rota A3).
// Cada bloco busca a própria rota dentro do seu Suspense
export default function TutoriaAlunoPage(){
    return (
        <main>
            <PageBanner titulo="Tutoria" />

            <div className={styles.conteudo}>
                <Suspense fallback={<Card titulo={TITULO_QUERO_SER_TUTOR} sublinhado><Loading /></Card>}>
                    <QueroSerTutor />
                </Suspense>

                <Suspense fallback={<Card titulo={TITULO_TUTORIAS} sublinhado><Loading /></Card>}>
                    <ListaTutorias />
                </Suspense>
            </div>
        </main>
    )
}
