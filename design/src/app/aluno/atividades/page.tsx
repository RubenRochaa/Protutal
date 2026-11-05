import styles from './page.module.scss'
import { Suspense } from 'react'
import { Loading } from '@/components/loading'
import { PageBanner } from '@/components/pageBanner'
import { FiltroEtapa } from './components/filtroEtapa'
import { ColunasAtividades } from './components/colunasAtividades'

const ETAPAS_VALIDAS = ["1", "2", "3"]

interface Props {
    searchParams: Promise<{ etapa?: string | string[] }>;
}

// Tela "Minhas atividades" do aluno (B1, rota A1).
// O banner e o filtro aparecem na hora; as colunas carregam dentro do Suspense
export default async function AtividadesAlunoPage({ searchParams }: Props){
    const { etapa: etapaUrl } = await searchParams

    // Só 1, 2 ou 3 vão para a API. Qualquer outro valor (ex.: ?etapa=9) vira "Todas",
    // porque a A1 responderia 400
    const etapa = typeof etapaUrl === "string" && ETAPAS_VALIDAS.includes(etapaUrl) ? etapaUrl : ""

    return (
        <main>
            <PageBanner titulo="Atividades" />

            <div className={styles.conteudo}>
                <div className={styles.filtro}>
                    <FiltroEtapa etapa={etapa} />
                </div>

                {/* key: ao trocar a etapa, o Suspense mostra o Loading de novo enquanto busca */}
                <Suspense key={etapa} fallback={<Loading />}>
                    <ColunasAtividades etapa={etapa} />
                </Suspense>
            </div>
        </main>
    )
}
