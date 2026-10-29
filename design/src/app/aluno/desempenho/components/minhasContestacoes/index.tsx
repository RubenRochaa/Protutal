import styles from './styles.module.scss'
import { Card } from '@/components/card'
import { EmptyState } from '@/components/emptyState'
import { getAutenticado } from '@/lib/apiServer'
import { getErrorMessage } from '@/lib/getErrorMessage'
import { sessaoExpiradaNaPagina } from '@/lib/sessaoExpirada'
import { formatarData, formatarNota } from '@/lib/formatacao'
import { ContestacaoAluno } from '@/lib/types'
import { ToastErro } from '../../../components/toastErro'
import { SeloStatus } from '../../../components/seloStatus'
import { SELO_CONTESTACAO } from '../ultimasNotas'

export const TITULO_CONTESTACOES = "Minhas contestações"

// Histórico das contestações do aluno (rota A9), da mais recente para a mais antiga:
// status, justificativa enviada e a decisão do tutor quando já foi resolvida
export async function MinhasContestacoes(){
    const resultado = await getAutenticado<ContestacaoAluno[]>("/alunos/me/contestacoes")

    if("erro" in resultado){
        // Fora do try/catch: o redirect do Next funciona lançando um erro
        sessaoExpiradaNaPagina(resultado.erro)

        return <Card titulo={TITULO_CONTESTACOES} sublinhado><ToastErro mensagem={getErrorMessage(resultado.erro)} /></Card>
    }

    if(resultado.dados.length === 0){
        return <Card titulo={TITULO_CONTESTACOES} sublinhado><EmptyState mensagem="Você não abriu nenhuma contestação." /></Card>
    }

    return (
        <Card titulo={TITULO_CONTESTACOES} sublinhado>
            <ul className={styles.lista}>
                {resultado.dados.map((contestacao) => (
                    <li key={contestacao.id_contestacao} className={styles.item}>
                        <div className={styles.topo}>
                            <div className={styles.atividade}>
                                <p className={styles.titulo}>{contestacao.atividade.titulo}</p>
                                <p className={styles.info}>
                                    {contestacao.atividade.conteudo.nome} · {contestacao.atividade.etapa}ª etapa ·
                                    Tutor {contestacao.tutor.nome}
                                </p>
                            </div>

                            <SeloStatus
                            texto={SELO_CONTESTACAO[contestacao.status].texto}
                            cor={SELO_CONTESTACAO[contestacao.status].cor}
                            />
                        </div>

                        {/* "valor" é a nota atual: se a contestação foi aceita, já é a nota nova */}
                        <p className={styles.nota}>
                            <span className={styles.rotulo}>Nota{contestacao.status === "aceita" ? " atual" : ""}:</span> {formatarNota(contestacao.nota.valor)}
                        </p>

                        <div className={styles.bloco}>
                            <p className={styles.rotulo}>Sua justificativa · enviada em {formatarData(contestacao.data_envio)}</p>
                            <p className={styles.texto}>{contestacao.comentario}</p>
                        </div>

                        {contestacao.decisao && (
                            <div className={styles.bloco}>
                                <p className={styles.rotulo}>
                                    Decisão do tutor
                                    {contestacao.data_resolucao && <> · {formatarData(contestacao.data_resolucao)}</>}
                                </p>
                                <p className={styles.texto}>{contestacao.decisao}</p>
                            </div>
                        )}
                    </li>
                ))}
            </ul>
        </Card>
    )
}
