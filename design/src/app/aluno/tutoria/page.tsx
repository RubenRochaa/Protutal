import styles from './page.module.scss'
import { Suspense } from 'react'
import { Card } from '@/components/card'
import { Loading } from '@/components/loading'
import { PageBanner } from '@/components/pageBanner'
import { ListaTutorias, TITULO_TUTORIAS } from './components/listaTutorias'
import { QueroSerTutor, TITULO_QUERO_SER_TUTOR } from './components/queroSerTutor'

// Tela "Minhas tutorias" do aluno (rota A3) e, no fim, a seção "Quero ser tutor"
// (GET /alunos/me/salas e A13).
// Cada bloco busca a própria rota dentro do seu Suspense
export default function TutoriaAlunoPage(){
    return (
        <main>
            <PageBanner titulo="Tutoria" />

            <div className={styles.conteudo}>
                <Suspense fallback={<Card titulo={TITULO_TUTORIAS} sublinhado><Loading /></Card>}>
                    <ListaTutorias />
                </Suspense>

                <Suspense fallback={<Card titulo={TITULO_QUERO_SER_TUTOR} sublinhado><Loading /></Card>}>
                    <QueroSerTutor />
                </Suspense>
            </div>
        </main>
    )
}
