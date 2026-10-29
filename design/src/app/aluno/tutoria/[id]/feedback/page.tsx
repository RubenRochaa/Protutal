import styles from './page.module.scss'
import Link from 'next/link'
import { Suspense } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Card } from '@/components/card'
import { EmptyState } from '@/components/emptyState'
import { Loading } from '@/components/loading'
import { PageBanner } from '@/components/pageBanner'
import { getErrorMessage } from '@/lib/getErrorMessage'
import { sessaoExpiradaNaPagina } from '@/lib/sessaoExpirada'
import { ToastErro } from '../../../components/toastErro'
import { TutoriaNaoEncontrada } from '../../components/tutoriaNaoEncontrada'
import { buscarTutoria } from '../../buscarTutoria'
import { FormFeedback } from './components/formFeedback'

interface Props {
    params: Promise<{ id: string }>;
}

const TITULO = "Avaliar meu tutor"

// Acha a tutoria na A3: só a ativa mostra o formulário (a A10 recusa a finalizada com 409)
async function AvaliacaoTutor({ id }: { id: string }){
    const resultado = await buscarTutoria(id)

    if("erro" in resultado){
        // Fora do try/catch: o redirect do Next funciona lançando um erro
        sessaoExpiradaNaPagina(resultado.erro)

        return <ToastErro mensagem={getErrorMessage(resultado.erro)} />
    }

    const { tutoria } = resultado

    if(!tutoria) return <TutoriaNaoEncontrada />

    if(tutoria.status !== "ativa"){
        return (
            <Card titulo={TITULO} sublinhado>
                <EmptyState mensagem="Esta tutoria foi finalizada. Não é mais possível avaliar o tutor." />
            </Card>
        )
    }

    return <FormFeedback idTutoria={tutoria.id_tutoria} tutor={tutoria.tutor.nome} />
}

// Tela "Avaliar o tutor" do aluno (rota A10). Sem Figma: segue o formulário com upload
// do detalhe da atividade
export default async function FeedbackTutorPage({ params }: Props){
    const { id } = await params

    return (
        <main>
            <PageBanner titulo={TITULO} />

            <div className={styles.conteudo}>
                <Link href={`/aluno/tutoria/${encodeURIComponent(id)}`} className={styles.voltar}>
                    <ArrowLeft size={20} aria-hidden="true" />
                    Voltar para a tutoria
                </Link>

                <Suspense key={id} fallback={<Card titulo={TITULO} sublinhado><Loading /></Card>}>
                    <AvaliacaoTutor id={id} />
                </Suspense>
            </div>
        </main>
    )
}
