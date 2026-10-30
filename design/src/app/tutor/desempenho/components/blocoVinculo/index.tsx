import styles from './styles.module.scss'
import lista from '@/app/professor/lista.module.scss'
import { Download } from 'lucide-react'
import { Card } from '@/components/card'
import { Mascote } from '@/components/mascote'
import { ListItem } from '@/components/listItem'
import { EmptyState } from '@/components/emptyState'
import { Etiqueta } from '@/components/etiqueta'
import { GraficoEtapas } from '@/components/graficoEtapas'
import { formatarData, formatarMedia, formatarNota } from '@/lib/formatacao'
import { DesempenhoTutorVinculo } from '@/lib/types'
import { MASCOTES } from '@/lib/mascotes'

interface Props {
    vinculo: DesempenhoTutorVinculo;
}

// Um vínculo de tutor (uma sala): números, gráfico do feedback por etapa e as duas listas.
// Média null = sem nota: aparece "Sem feedback"/"Sem avaliação", nunca 0
export function BlocoVinculo({ vinculo }: Props){
    const { feedback, avaliacoes_professor: avaliacoes } = vinculo

    return (
        <Card className={styles.bloco}>
            <div className={styles.topo}>
                <Mascote imagem={MASCOTES.desempenho} className={styles.mascote} />
                <h2 className={styles.titulo}>Sala {vinculo.sala.nome} · {vinculo.sala.ano_letivo}</h2>
                {vinculo.revogado && (
                    <Etiqueta>
                        {vinculo.data_revogacao ? `Revogado em ${formatarData(vinculo.data_revogacao)}` : "Revogado"}
                    </Etiqueta>
                )}
            </div>

            <dl className={styles.numeros}>
                <div>
                    <dt>Média dos feedbacks dos alunos</dt>
                    <dd>{formatarMedia(feedback.media_geral, "Sem feedback")}</dd>
                </div>
                <div>
                    <dt>Feedbacks recebidos</dt>
                    <dd>{feedback.quantidade}</dd>
                </div>
                <div>
                    <dt>Média das avaliações do professor</dt>
                    <dd>{formatarMedia(avaliacoes.media_geral, "Sem avaliação")}</dd>
                </div>
                <div>
                    <dt>Avaliações do professor</dt>
                    <dd>{avaliacoes.quantidade}</dd>
                </div>
            </dl>

            <div className={styles.colunas}>
                <section className={styles.secao}>
                    <h3 className={styles.subtitulo}>Feedback dos alunos por etapa</h3>
                    <GraficoEtapas etapas={feedback.por_etapa} />
                </section>

                <section className={styles.secao}>
                    <h3 className={styles.subtitulo}>Avaliações do professor</h3>
                    {avaliacoes.avaliacoes.length === 0 ? (
                        <EmptyState mensagem="O professor ainda não avaliou você nesta sala." imagem={MASCOTES.desempenho} />
                    ) : (
                        <ul className={lista.lista}>
                            {avaliacoes.avaliacoes.map((a) => (
                                <li key={a.id_avaliacao}>
                                    <ListItem direita={<span className={lista.valor}>{formatarNota(a.nota)}</span>}>
                                        <span className={lista.nome}>{a.professor.nome}</span>
                                        <span className={lista.detalhe}>{formatarData(a.data)}</span>
                                        <span className={lista.texto}>{a.comentario}</span>
                                    </ListItem>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </div>

            <section className={styles.secao}>
                <h3 className={styles.subtitulo}>Feedbacks dos alunos</h3>
                {feedback.feedbacks.length === 0 ? (
                    <EmptyState mensagem="Nenhum feedback dos alunos nesta sala." imagem={MASCOTES.desempenho} />
                ) : (
                    <ul className={lista.lista}>
                        {feedback.feedbacks.map((f) => (
                            <li key={f.id_feedback}>
                                <ListItem direita={<span className={lista.valor}>{formatarNota(f.nota)}</span>}>
                                    <span className={lista.nome}>{f.aluno.nome}</span>
                                    <span className={lista.detalhe}>{formatarData(f.data)}</span>
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
            </section>
        </Card>
    )
}
