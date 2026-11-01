import pagina from '../pagina.module.scss'
import lista from '@/app/professor/lista.module.scss'
import { Suspense } from 'react'
import { Loading } from '@/components/loading'
import { PageBanner } from '@/components/pageBanner'
import { FiltroSelect } from '@/components/filtroSelect'
import { etapaDaUrl } from '@/lib/validacao'
import { buscarTutorias, idDaUrl, salasDasTutorias } from '../buscas'
import { ColunasAtividades } from './components/colunasAtividades'

interface Props {
    searchParams: Promise<{ id_sala?: string | string[]; etapa?: string | string[] }>;
}

const OPCOES_ETAPA = [
    { valor: "", rotulo: "Todas as etapas" },
    { valor: "1", rotulo: "1ª etapa" },
    { valor: "2", rotulo: "2ª etapa" },
    { valor: "3", rotulo: "3ª etapa" },
]

// Tela "Atividades" do tutor (print 4, rota T2): filtros de sala e etapa em cima
// e as duas colunas (não corrigidas / corrigidas) carregando no Suspense
export default async function AtividadesTutorPage({ searchParams }: Props){
    const busca = await searchParams
    const etapa = etapaDaUrl(busca.etapa)

    // Salas distintas das tutorias (T1, a mesma busca do layout). Sala fora da lista = sem filtro
    const tutorias = await buscarTutorias("")
    const salas = "dados" in tutorias ? salasDasTutorias(tutorias.dados) : []
    const idSalaUrl = idDaUrl(busca.id_sala)
    const idSala = salas.some((s) => String(s.id_sala) === idSalaUrl) ? idSalaUrl : ""

    const opcoesSala = [
        { valor: "", rotulo: "Todas as salas" },
        ...salas.map((s) => ({ valor: String(s.id_sala), rotulo: `Sala ${s.nome}` }))
    ]

    return (
        <main>
            <PageBanner titulo="Atividades" />

            <div className={pagina.conteudo}>
                <div className={lista.filtros}>
                    <FiltroSelect parametro="id_sala" label="Sala" opcoes={opcoesSala} valor={idSala} />
                    <FiltroSelect parametro="etapa" label="Etapa" opcoes={OPCOES_ETAPA} valor={etapa} />
                </div>

                {/* key: ao trocar um filtro, o Suspense mostra o Loading de novo enquanto busca */}
                <Suspense key={`${idSala}-${etapa}`} fallback={<Loading />}>
                    <ColunasAtividades idSala={idSala} etapa={etapa} />
                </Suspense>
            </div>
        </main>
    )
}
