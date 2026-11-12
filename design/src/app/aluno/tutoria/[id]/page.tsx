import styles from './page.module.scss'
import Link from 'next/link'
import { Suspense } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Loading } from '@/components/loading'
import { PageBanner } from '@/components/pageBanner'
import { DetalheTutoria } from './components/detalheTutoria'

interface Props {
    params: Promise<{ id: string }>;
}

// Tela "Detalhe da tutoria" do aluno (print "Tutoria").
// O banner e o "Voltar" aparecem na hora; a tutoria (A3) carrega dentro do Suspense,
// e cada bloco que depende da sala tem o próprio Suspense lá dentro
export default async function DetalheTutoriaPage({ params }: Props){
    const { id } = await params

    return (
        <main>
            <PageBanner titulo="Tutoria" />

            <div className={styles.conteudo}>
                <Link href="/aluno/tutoria" className={styles.voltar}>
                    <ArrowLeft size={20} aria-hidden="true" />
                    Voltar para Minhas tutorias
                </Link>

                <Suspense key={id} fallback={<Loading />}>
                    <DetalheTutoria id={id} />
                </Suspense>
            </div>
        </main>
    )
}
