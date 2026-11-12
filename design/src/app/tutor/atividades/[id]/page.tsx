import pagina from '../../pagina.module.scss'
import lista from '@/app/professor/lista.module.scss'
import Link from 'next/link'
import { Suspense } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Loading } from '@/components/loading'
import { PageBanner } from '@/components/pageBanner'
import { DetalheAtividade } from './components/detalheAtividade'

interface Props {
    params: Promise<{ id: string }>;
}

// Detalhe da atividade do tutor (prints 6 e 7): dados da atividade (A2), alunos com resposta
// e nota (P12) e o lançamento de nota no modal "Envio do aluno" (T3)
export default async function AtividadeTutorPage({ params }: Props){
    const { id } = await params

    return (
        <main>
            <PageBanner titulo="Atividade" />

            <div className={pagina.conteudo}>
                <Link href="/tutor/atividades" className={lista.voltar}>
                    <ArrowLeft size={20} aria-hidden="true" /> Voltar para Atividades
                </Link>

                <Suspense key={id} fallback={<Loading />}>
                    <DetalheAtividade id={id} />
                </Suspense>
            </div>
        </main>
    )
}
