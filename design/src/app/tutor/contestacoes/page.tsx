import pagina from '../pagina.module.scss'
import { Suspense } from 'react'
import { Loading } from '@/components/loading'
import { PageBanner } from '@/components/pageBanner'
import { FiltroAbas } from '@/components/filtroAbas'
import { getAutenticado } from '@/lib/apiServer'
import { getErrorMessage, getErrorStatus } from '@/lib/getErrorMessage'
import { sessaoExpiradaNaPagina } from '@/lib/sessaoExpirada'
import { Contestacao } from '@/lib/types'
import { ErroCarregamento } from '@/app/professor/components/erroCarregamento'
import { ListaContestacoes } from './components/listaContestacoes'

interface Props {
    searchParams: Promise<{ status?: string | string[] }>;
}

// Na URL: sem ?status= = Pendentes (padrão); "resolvidas"; "todas"
const OPCOES_FILTRO = [
    { valor: "", rotulo: "Pendentes" },
    { valor: "resolvidas", rotulo: "Resolvidas" },
    { valor: "todas", rotulo: "Todas" },
]

// Tela "Contestações" do tutor (sem print; segue a do professor).
// P16 mostra as contestações das atividades que ele criou; T4 resolve
export default async function ContestacoesTutorPage({ searchParams }: Props){
    const { status } = await searchParams
    const filtro = status === "resolvidas" || status === "todas" ? status : ""

    return (
        <main>
            <PageBanner titulo="Contestações" />

            <div className={pagina.conteudo}>
                <FiltroAbas parametro="status" opcoes={OPCOES_FILTRO} valor={filtro} rotulo="Filtrar contestações por situação" />

                <Suspense key={filtro} fallback={<Loading />}>
                    <BlocoContestacoes filtro={filtro} />
                </Suspense>
            </div>
        </main>
    )
}

// A P16 só filtra um status por vez: "Resolvidas" busca todas e tira as pendentes
async function BlocoContestacoes({ filtro }: { filtro: string }){
    const resultado = await getAutenticado<Contestacao[]>(
        "/contestacoes",
        filtro === "" ? { status: "pendente" } : undefined
    )

    if("erro" in resultado){
        // Fora do try/catch: o redirect do Next funciona lançando um erro
        sessaoExpiradaNaPagina(resultado.erro)

        return <ErroCarregamento mensagem={getErrorMessage(resultado.erro)} status={getErrorStatus(resultado.erro)} />
    }

    const contestacoes = filtro === "resolvidas"
        ? resultado.dados.filter((c) => c.status !== "pendente")
        : resultado.dados

    return <ListaContestacoes contestacoes={contestacoes} filtro={filtro} />
}
