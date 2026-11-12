import pagina from '@/app/professor/page.module.scss'
import { Loading } from '@/components/loading'

// Aparece ao trocar de tela na área do aluno (o Header do layout continua na tela).
// Dentro de cada página, os blocos que buscam dados já têm o próprio Suspense.
export default function LoadingAluno(){
    return (
        <main className={pagina.conteudo}>
            <Loading size="grande" />
        </main>
    )
}
