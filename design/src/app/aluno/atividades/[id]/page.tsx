import styles from './page.module.scss'
import Link from 'next/link'
import { Suspense } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Loading } from '@/components/loading'
import { PageBanner } from '@/components/pageBanner'
import { DetalheAtividade } from './components/detalheAtividade'

interface Props {
    params: Promise<{ id: string }>;
}

// Tela "Detalhe da atividade" do aluno (lote B1, rotas A2 e A14).
// O banner e o "Voltar" aparecem na hora; a atividade carrega dentro do Suspense
export default async function DetalheAtividadePage({ params }: Props){
    const { id } = await params

    return (
        <main>
            <PageBanner titulo="Detalhe da atividade" />

            <div className={styles.conteudo}>
                <Link href="/aluno/atividades" className={styles.voltar}>
                    <ArrowLeft size={20} aria-hidden="true" />
                    Voltar para Minhas atividades
                </Link>

                <Suspense key={id} fallback={<Loading />}>
                    <DetalheAtividade id={id} />
                </Suspense>
            </div>
        </main>
    )
}
