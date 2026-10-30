import pagina from '../pagina.module.scss'
import lista from '@/app/professor/lista.module.scss'
import { Suspense } from 'react'
import { Card } from '@/components/card'
import { Loading } from '@/components/loading'
import { EmptyState } from '@/components/emptyState'
import { PageBanner } from '@/components/pageBanner'
import { getErrorMessage, getErrorStatus } from '@/lib/getErrorMessage'
import { sessaoExpiradaNaPagina } from '@/lib/sessaoExpirada'
import { ErroCarregamento } from '@/app/professor/components/erroCarregamento'
import { buscarDesempenho } from '../buscas'
import { BlocoVinculo } from './components/blocoVinculo'

// Tela "Meu desempenho como tutor" (sem print; segue o painel P13 do professor), rota T6.
// O desempenho do tutor vem só de dois indicadores: feedback dos alunos e avaliação do professor
export default function DesempenhoTutorPage(){
    return (
        <main>
            <PageBanner titulo="Meu desempenho como tutor" />

            <div className={pagina.conteudo}>
                <p className={lista.ajuda}>
                    Dois indicadores lado a lado, por sala: a média dos feedbacks dos seus tutorados e a média das avaliações do professor.
                    As notas dos tutorados não entram no seu desempenho.
                </p>

                <Suspense fallback={<Loading />}>
                    <BlocoDesempenho />
                </Suspense>
            </div>
        </main>
    )
}

async function BlocoDesempenho(){
    const resultado = await buscarDesempenho()

    if("erro" in resultado){
        // Fora do try/catch: o redirect do Next funciona lançando um erro
        sessaoExpiradaNaPagina(resultado.erro)

        return <ErroCarregamento mensagem={getErrorMessage(resultado.erro)} status={getErrorStatus(resultado.erro)} />
    }

    const vazio = resultado.dados.every((v) => v.feedback.quantidade === 0 && v.avaliacoes_professor.quantidade === 0)

    if(vazio){
        return <Card><EmptyState mensagem="Você ainda não tem avaliações nem feedbacks." /></Card>
    }

    // Um bloco por vínculo (sala), com os ativos primeiro, na ordem da T6
    return resultado.dados.map((vinculo) => <BlocoVinculo key={vinculo.id_tutor_sala} vinculo={vinculo} />)
}
