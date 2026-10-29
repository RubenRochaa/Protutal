import lista from '@/app/professor/lista.module.scss'
import styles from './page.module.scss'
import { Download } from 'lucide-react'
import { getAutenticado } from '@/lib/apiServer'
import { getErrorMessage, getErrorStatus } from '@/lib/getErrorMessage'
import { sessaoExpiradaNaPagina } from '@/lib/sessaoExpirada'
import { FeedbacksResposta, TutorSala } from '@/lib/types'
import { formatarData, formatarMedia, formatarNota } from '@/lib/formatacao'
import { etapaDaUrl } from '@/lib/validacao'
import { Card } from '@/components/card'
import { ListItem } from '@/components/listItem'
import { EmptyState } from '@/components/emptyState'
import { Etiqueta } from '@/components/etiqueta'
import { FiltroAbas } from '@/components/filtroAbas'
import { FiltroSelect } from '@/components/filtroSelect'
import { ErroCarregamento } from '../../../components/erroCarregamento'

interface Props {
    params: Promise<{ id_sala: string }>;
    searchParams: Promise<{ etapa?: string | string[]; id_tutor_sala?: string | string[] }>;
}

const OPCOES_ETAPA = [
    { valor: "", rotulo: "Todas as etapas" },
    { valor: "1", rotulo: "1ª etapa" },
    { valor: "2", rotulo: "2ª etapa" },
    { valor: "3", rotulo: "3ª etapa" },
]

// Aba "Feedbacks" (sem Figma): o que os alunos tutorados escreveram sobre os tutores.
// T7 (GET /feedbacks?id_sala=&etapa=&id_tutor_sala=). O filtro de ano não entra:
// todos os feedbacks de uma sala são do mesmo ano letivo.
// A rubrica é uma URL pública do Cloudinary: o download abre direto, sem token.
export default async function FeedbacksSalaPage({ params, searchParams }: Props){
    const { id_sala } = await params
    const busca = await searchParams
    const etapa = etapaDaUrl(busca.etapa)
    const tutor = typeof busca.id_tutor_sala === "string" && /^[1-9]\d*$/.test(busca.id_tutor_sala) ? busca.id_tutor_sala : ""

    const [resultado, tutores] = await Promise.all([
        getAutenticado<FeedbacksResposta>("/feedbacks", {
            id_sala,
            ...(etapa ? { etapa } : {}),
            ...(tutor ? { id_tutor_sala: tutor } : {})
        }),
        getAutenticado<TutorSala[]>(`/salas/${encodeURIComponent(id_sala)}/tutores`)
    ])

    // Fora do try/catch: o redirect do Next funciona lançando um erro
    if("erro" in resultado) sessaoExpiradaNaPagina(resultado.erro)

    if("erro" in resultado){
        return <ErroCarregamento mensagem={getErrorMessage(resultado.erro)} status={getErrorStatus(resultado.erro)} />
    }

    const { resumo, feedbacks } = resultado.dados
    const opcoesTutor = "dados" in tutores
        ? [{ valor: "", rotulo: "Todos os tutores" }, ...tutores.dados.map((t) => ({ valor: String(t.id_tutor_sala), rotulo: t.aluno.nome }))]
        : null

    return (
        <div className={lista.tela}>
            <p className={lista.ajuda}>
                Avaliações que os alunos tutorados fizeram dos tutores, com a rubrica enviada.
            </p>

            <FiltroAbas parametro="etapa" opcoes={OPCOES_ETAPA} valor={etapa} rotulo="Filtrar feedbacks por etapa" />

            {opcoesTutor && (
                <div className={lista.filtros}>
                    <FiltroSelect parametro="id_tutor_sala" label="Tutor" opcoes={opcoesTutor} valor={tutor} />
                </div>
            )}

            <div className={styles.resumo}>
                <span>Total: <strong>{resumo.total_feedbacks}</strong></span>
                <span>Média das notas: <strong>{formatarMedia(resumo.media_notas, "Sem feedback")}</strong></span>
            </div>

            <Card titulo={`Feedbacks (${feedbacks.length})`} sublinhado>
                {feedbacks.length === 0 ? (
                    <EmptyState mensagem={etapa || tutor
                        ? "Nenhum feedback com esses filtros."
                        : "Os alunos ainda não enviaram feedback sobre os tutores desta sala."}
                    />
                ) : (
                    <ul className={lista.lista}>
                        {feedbacks.map((f) => (
                            <li key={f.id_feedback}>
                                <ListItem direita={<span className={lista.valor}>{formatarNota(f.nota)}</span>}>
                                    <span className={lista.nome}>Tutor {f.tutor.nome}</span>
                                    <span className={lista.detalhe}>
                                        por {f.aluno.nome} · {formatarData(f.data)}
                                    </span>
                                    {f.comentario && <span className={lista.texto}>{f.comentario}</span>}
                                    <span className={lista.etiquetas}>
                                        <Etiqueta>{f.etapa}ª etapa</Etiqueta>
                                        <a href={f.rubrica_file} target="_blank" rel="noopener noreferrer" className={styles.rubrica}>
                                            <Download size={14} aria-hidden="true" />
                                            Baixar rubrica
                                        </a>
                                    </span>
                                </ListItem>
                            </li>
                        ))}
                    </ul>
                )}
            </Card>
        </div>
    )
}
