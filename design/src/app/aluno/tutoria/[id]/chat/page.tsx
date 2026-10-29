import styles from './page.module.scss'
import Link from 'next/link'
import { Suspense } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Loading } from '@/components/loading'
import { PageBanner } from '@/components/pageBanner'
import { ChatTutoria } from './components/chatTutoria'

interface Props {
    params: Promise<{ id: string }>;
}

// Tela "Chat com tutor" do aluno (print do Chat, rotas O2 e O1).
// O banner e o "Voltar" aparecem na hora; a tutoria (A3) e as mensagens carregam nos Suspense
export default async function ChatTutoriaPage({ params }: Props){
    const { id } = await params

    return (
        <main>
            <PageBanner titulo="Chat com tutor" />

            <div className={styles.conteudo}>
                <Link href={`/aluno/tutoria/${encodeURIComponent(id)}`} className={styles.voltar}>
                    <ArrowLeft size={20} aria-hidden="true" />
                    Voltar para a tutoria
                </Link>

                <Suspense key={id} fallback={<Loading />}>
                    <ChatTutoria id={id} />
                </Suspense>
            </div>
        </main>
    )
}
