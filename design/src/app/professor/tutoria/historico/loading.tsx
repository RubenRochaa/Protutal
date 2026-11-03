import pagina from '../../page.module.scss'
import { PageBanner } from '@/components/pageBanner'
import { Loading } from '@/components/loading'

// Aparece enquanto a página busca os dados na API: o Header e o banner continuam na tela
export default function LoadingHistorico(){
    return (
        <main>
            <PageBanner titulo="Anos Passados" />

            <div className={pagina.conteudo}>
                <Loading size="grande" />
            </div>
        </main>
    )
}
