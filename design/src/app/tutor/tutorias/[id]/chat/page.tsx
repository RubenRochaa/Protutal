import pagina from '../../../pagina.module.scss'
import lista from '@/app/professor/lista.module.scss'
import Link from 'next/link'
import { Suspense } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Loading } from '@/components/loading'
import { PageBanner } from '@/components/pageBanner'
import { ChatTutor } from './components/chatTutor'

interface Props {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ tipo?: string | string[] }>;
}

// Tela "Chat com tutorado" (print 3, rotas O2 e O1).
// O banner e o "Voltar" aparecem na hora; a tutoria (T1) e as mensagens carregam nos Suspense
export default async function ChatTutorPage({ params, searchParams }: Props){
    const { id } = await params
    const { tipo } = await searchParams
    // A O2 só aceita ?tipo=comunicado; qualquer outro valor vira "Todas"
    const filtro = tipo === "comunicado" ? "comunicado" : ""

    return (
        <main>
            <PageBanner titulo="Chat com tutorado" />

            <div className={pagina.conteudo}>
                <Link href="/tutor/tutoria" className={lista.voltar}>
                    <ArrowLeft size={20} aria-hidden="true" />
                    Voltar para a tutoria
                </Link>

                <Suspense key={id} fallback={<Loading />}>
                    <ChatTutor id={id} tipo={filtro} />
                </Suspense>
            </div>
        </main>
    )
}
