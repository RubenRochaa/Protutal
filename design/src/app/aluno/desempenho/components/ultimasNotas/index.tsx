import styles from './styles.module.scss'
import Link from 'next/link'
import { Card } from '@/components/card'
import { getErrorMessage } from '@/lib/getErrorMessage'
import { sessaoExpiradaNaPagina } from '@/lib/sessaoExpirada'
import { formatarData, formatarNota } from '@/lib/formatacao'
import { StatusContestacao } from '@/lib/types'
import { buscarDesempenho } from '../../../buscas'
import { ToastErro } from '../../../components/toastErro'
import { SeloStatus } from '../../../components/seloStatus'
import { BotaoContestar } from '../../../components/botaoContestar'

export const TITULO_NOTAS = "Últimas atividades e notas"

// Status da contestação -> texto e cor do selo (usado também em Minhas contestações)
export const SELO_CONTESTACAO: Record<StatusContestacao, { texto: string; cor: "verde" | "vermelho" | "cinza" }> = {
    pendente: { texto: "Contestação pendente", cor: "cinza" },
    aceita: { texto: "Contestação aceita", cor: "verde" },
    recusada: { texto: "Contestação recusada", cor: "vermelho" },
}

interface Props {
    etapa: string;
}

// Lista das notas (A6 notas[]), da correção mais recente para a mais antiga.
// Cada linha leva ao detalhe da atividade; sem contestação, aparece o botão "Contestar nota"
export async function UltimasNotas({ etapa }: Props){
    const resultado = await buscarDesempenho(etapa, "")

    if("erro" in resultado){
        // Fora do try/catch: o redirect do Next funciona lançando um erro
        sessaoExpiradaNaPagina(resultado.erro)

        return <Card titulo={TITULO_NOTAS} sublinhado><ToastErro mensagem={getErrorMessage(resultado.erro)} /></Card>
    }

    if(resultado.dados.notas.length === 0) return null

    // A A6 ordena por etapa; aqui a mais recente vem primeiro (datas ISO comparam como texto)
    const notas = [...resultado.dados.notas].sort((a, b) => b.data_lancamento.localeCompare(a.data_lancamento))

    return (
        <Card titulo={TITULO_NOTAS} sublinhado>
            <ul className={styles.lista}>
                {notas.map((nota) => (
                    <li key={nota.id_nota} className={styles.item}>
                        <span className={styles.bolinha} aria-hidden="true" />

                        <div className={styles.dados}>
                            <Link href={`/aluno/atividades/${nota.atividade.id_atividade}`} className={styles.titulo}>
                                {nota.atividade.titulo}
                            </Link>

                            <p className={styles.info}>
                                {nota.conteudo.nome} · {nota.atividade.etapa}ª etapa · Corrigida em {formatarData(nota.data_lancamento)}
                            </p>

                            {nota.contestacao_status && (
                                <SeloStatus
                                texto={SELO_CONTESTACAO[nota.contestacao_status].texto}
                                cor={SELO_CONTESTACAO[nota.contestacao_status].cor}
                                />
                            )}
                        </div>

                        <div className={styles.direita}>
                            <p className={styles.nota}>
                                <span className={styles.oculto}>Nota </span>
                                {formatarNota(nota.valor)}
                            </p>

                            {nota.contestacao_status === null && (
                                <BotaoContestar
                                idNota={nota.id_nota}
                                idAtividade={nota.atividade.id_atividade}
                                tituloAtividade={nota.atividade.titulo}
                                />
                            )}
                        </div>
                    </li>
                ))}
            </ul>
        </Card>
    )
}
