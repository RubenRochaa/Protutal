"use client"

import styles from './styles.module.scss'
import lista from '@/app/professor/lista.module.scss'
import { useState } from 'react'
import { DesempenhoTutor } from '@/lib/types'
import { formatarMedia } from '@/lib/formatacao'
import { Card } from '@/components/card'
import { EmptyState } from '@/components/emptyState'
import { Etiqueta } from '@/components/etiqueta'
import { GraficoEtapas } from '@/components/graficoEtapas'

// Médias de um aluno, montadas na página a partir da P14
export interface DesempenhoAlunoSala {
    id_aluno: number;
    nome: string;
    media_geral: number | null;
    quantidade: number;
    por_etapa: { etapa: number; media: number | null }[];
}

interface Props {
    tutores: DesempenhoTutor[];
    alunos: DesempenhoAlunoSala[];
}

// Item escolhido para ver o gráfico por etapa
type Selecionado = { tipo: "aluno"; id: number } | { tipo: "tutor"; id: number } | null

// Duas colunas (p14). Clicar num nome mostra o gráfico por etapa embaixo (p09 e p20).
// Tutor: dois indicadores lado a lado, sem nota única (regra da P13): média do feedback
// dos alunos e média das avaliações do professor. Sem avaliação = "Sem avaliação", nunca 0.
export function PainelDesempenho({ tutores, alunos }: Props){
    const [selecionado, setSelecionado] = useState<Selecionado>(null);

    const alunoEscolhido = selecionado?.tipo === "aluno" ? alunos.find((a) => a.id_aluno === selecionado.id) : undefined
    const tutorEscolhido = selecionado?.tipo === "tutor" ? tutores.find((t) => t.id_tutor_sala === selecionado.id) : undefined

    function ativo(tipo: "aluno" | "tutor", id: number){
        return selecionado?.tipo === tipo && selecionado.id === id
    }

    return (
        <div className={lista.tela}>
            <p className={lista.ajuda}>
                Clique num aluno ou tutor para ver o gráfico por etapa. A média dos tutorados é a média das notas lançadas.
            </p>

            <div className={lista.duasColunas}>
                <Card titulo="Tutorados" sublinhado>
                    {alunos.length === 0 ? (
                        <EmptyState mensagem="Ainda não há notas lançadas nesta sala." />
                    ) : (
                        <ul className={lista.lista}>
                            {alunos.map((aluno) => (
                                <li key={aluno.id_aluno}>
                                    <button
                                    type="button"
                                    className={ativo("aluno", aluno.id_aluno) ? `${styles.item} ${styles.ativo}` : styles.item}
                                    aria-pressed={ativo("aluno", aluno.id_aluno)}
                                    onClick={() => setSelecionado({ tipo: "aluno", id: aluno.id_aluno })}
                                    >
                                        <span>
                                            <span className={lista.nome}>{aluno.nome}</span>
                                            <span className={lista.detalhe}>{aluno.quantidade} nota(s)</span>
                                        </span>
                                        <span className={lista.valor}>{formatarMedia(aluno.media_geral)}</span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </Card>

                <Card titulo="Tutores" sublinhado>
                    {tutores.length === 0 ? (
                        <EmptyState mensagem="A sala ainda não tem tutores." />
                    ) : (
                        <ul className={lista.lista}>
                            {tutores.map((tutor) => (
                                <li key={tutor.id_tutor_sala}>
                                    <button
                                    type="button"
                                    className={ativo("tutor", tutor.id_tutor_sala) ? `${styles.item} ${styles.ativo}` : styles.item}
                                    aria-pressed={ativo("tutor", tutor.id_tutor_sala)}
                                    onClick={() => setSelecionado({ tipo: "tutor", id: tutor.id_tutor_sala })}
                                    >
                                        <span>
                                            <span className={lista.nome}>{tutor.nome}</span>
                                            <span className={lista.detalhe}>
                                                Feedback dos alunos: {formatarMedia(tutor.feedback.media_geral, "Sem feedback")} ({tutor.feedback.quantidade})
                                            </span>
                                            <span className={lista.detalhe}>
                                                Avaliação do professor: {formatarMedia(tutor.avaliacoes_professor.media_geral, "Sem avaliação")} ({tutor.avaliacoes_professor.quantidade})
                                            </span>
                                            {tutor.revogado && (
                                                <span className={lista.etiquetas}><Etiqueta>Removido da sala</Etiqueta></span>
                                            )}
                                        </span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </Card>
            </div>

            {alunoEscolhido && (
                <Card titulo={`Média por etapa: ${alunoEscolhido.nome}`} sublinhado>
                    <GraficoEtapas etapas={alunoEscolhido.por_etapa} />
                </Card>
            )}

            {tutorEscolhido && (
                <Card titulo={`Feedback dos alunos por etapa: ${tutorEscolhido.nome}`} sublinhado>
                    <GraficoEtapas etapas={tutorEscolhido.feedback.por_etapa} />
                    <p className={lista.detalhe}>
                        A avaliação do professor só tem média geral: {formatarMedia(tutorEscolhido.avaliacoes_professor.media_geral, "Sem avaliação")}.
                    </p>
                </Card>
            )}
        </div>
    )
}
