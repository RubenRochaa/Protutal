import pagina from '../pagina.module.scss'
import lista from '@/app/professor/lista.module.scss'
import styles from './page.module.scss'
import { Suspense } from 'react'
import { Download } from 'lucide-react'
import { Card } from '@/components/card'
import { Loading } from '@/components/loading'
import { ListItem } from '@/components/listItem'
import { EmptyState } from '@/components/emptyState'
import { Etiqueta } from '@/components/etiqueta'
import { PageBanner } from '@/components/pageBanner'
import { FiltroAbas } from '@/components/filtroAbas'
import { FiltroSelect } from '@/components/filtroSelect'
import { getErrorMessage, getErrorStatus } from '@/lib/getErrorMessage'
import { sessaoExpiradaNaPagina } from '@/lib/sessaoExpirada'
import { formatarData, formatarMedia, formatarNota } from '@/lib/formatacao'
import { etapaDaUrl } from '@/lib/validacao'
import { ErroCarregamento } from '@/app/professor/components/erroCarregamento'
import { buscarFeedbacks, idDaUrl } from '../buscas'

interface Props {
    searchParams: Promise<{ etapa?: string | string[]; ano?: string | string[]; id_aluno?: string | string[] }>;
}

const OPCOES_ETAPA = [
    { valor: "", rotulo: "Todas as etapas" },
    { valor: "1", rotulo: "1ª etapa" },
    { valor: "2", rotulo: "2ª etapa" },
    { valor: "3", rotulo: "3ª etapa" },
]

// Tela "Feedbacks" do tutor (sem print; segue a do professor): o que os tutorados escreveram
// sobre ele, com a rubrica (rota T7). A rubrica é uma URL pública: abre direto, sem token
export default async function FeedbacksTutorPage({ searchParams }: Props){
    const busca = await searchParams
    const etapa = etapaDaUrl(busca.etapa)
    const ano = idDaUrl(busca.ano)
    const idAluno = idDaUrl(busca.id_aluno)

    return (
        <main>
            <PageBanner titulo="Feedbacks" />

            <div className={pagina.conteudo}>
                <p className={lista.ajuda}>Avaliações que os seus tutorados fizeram de você, com a rubrica enviada.</p>

                <FiltroAbas parametro="etapa" opcoes={OPCOES_ETAPA} valor={etapa} rotulo="Filtrar feedbacks por etapa" />

                <Suspense key={`${etapa}-${ano}-${idAluno}`} fallback={<Loading />}>
                    <BlocoFeedbacks etapa={etapa} ano={ano} idAluno={idAluno} />
                </Suspense>
            </div>
        </main>
    )
}

interface BlocoProps {
    etapa: string;
    ano: string;
    idAluno: string;
}

// Duas buscas na T7: sem filtro (para montar as opções de ano e tutorado, que a T1 não traz)
// e com os filtros (a lista e o resumo). Sem filtros, o cache() faz uma requisição só
async function BlocoFeedbacks({ etapa, ano, idAluno }: BlocoProps){
    const [todos, resultado] = await Promise.all([
        buscarFeedbacks("", "", ""),
        buscarFeedbacks(etapa, ano, idAluno)
    ])

    // Fora do try/catch: o redirect do Next funciona lançando um erro
    if("erro" in resultado) sessaoExpiradaNaPagina(resultado.erro)

    if("erro" in resultado){
        return <ErroCarregamento mensagem={getErrorMessage(resultado.erro)} status={getErrorStatus(resultado.erro)} />
    }

    const base = "dados" in todos ? todos.dados.feedbacks : resultado.dados.feedbacks
    const anos = [...new Set(base.map((f) => f.sala.ano_letivo))].sort((a, b) => b - a)
    const alunos = [...new Map(base.map((f) => [f.aluno.id_aluno, f.aluno.nome])).entries()]
        .sort((a, b) => a[1].localeCompare(b[1], "pt-BR"))

    const opcoesAno = [{ valor: "", rotulo: "Todos os anos" }, ...anos.map((a) => ({ valor: String(a), rotulo: String(a) }))]
    const opcoesAluno = [{ valor: "", rotulo: "Todos os tutorados" }, ...alunos.map(([id, nome]) => ({ valor: String(id), rotulo: nome }))]

    const { resumo, feedbacks } = resultado.dados
    const filtrado = etapa !== "" || ano !== "" || idAluno !== ""

    return (
        <>
            <div className={lista.filtros}>
                <FiltroSelect parametro="ano" label="Ano letivo" opcoes={opcoesAno} valor={opcoesAno.some((o) => o.valor === ano) ? ano : ""} />
                <FiltroSelect parametro="id_aluno" label="Tutorado" opcoes={opcoesAluno} valor={opcoesAluno.some((o) => o.valor === idAluno) ? idAluno : ""} />
            </div>

            <div className={styles.resumo}>
                <span>Total: <strong>{resumo.total_feedbacks}</strong></span>
                <span>Média das notas: <strong>{formatarMedia(resumo.media_notas, "—")}</strong></span>
            </div>

            <Card titulo={`Feedbacks (${feedbacks.length})`} sublinhado>
                {feedbacks.length === 0 ? (
                    <EmptyState mensagem={filtrado ? "Nenhum feedback com esses filtros." : "Você ainda não recebeu feedbacks."} />
                ) : (
                    <ul className={lista.lista}>
                        {feedbacks.map((f) => (
                            <li key={f.id_feedback}>
                                <ListItem direita={<span className={lista.valor}>{formatarNota(f.nota)}</span>}>
                                    <span className={lista.nome}>{f.aluno.nome}</span>
                                    <span className={lista.detalhe}>Sala {f.sala.nome} ({f.sala.ano_letivo}) · {formatarData(f.data)}</span>
                                    {f.comentario && <span className={lista.texto}>{f.comentario}</span>}
                                    <span className={lista.etiquetas}>
                                        <Etiqueta>{f.etapa}ª etapa</Etiqueta>
                                        <a href={f.rubrica_file} target="_blank" rel="noopener noreferrer" className={styles.rubrica}>
                                            <Download size={14} aria-hidden="true" />
                                            Abrir rubrica
                                        </a>
                                    </span>
                                </ListItem>
                            </li>
                        ))}
                    </ul>
                )}
            </Card>
        </>
    )
}
