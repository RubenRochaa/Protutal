import styles from './styles.module.scss'
import { Card } from '@/components/card'
import { EmptyState } from '@/components/emptyState'
import { getAutenticado } from '@/lib/apiServer'
import { getErrorMessage } from '@/lib/getErrorMessage'
import { sessaoExpiradaNaPagina } from '@/lib/sessaoExpirada'
import { SalaAluno } from '@/lib/types'
import { ToastErro } from '../../../components/toastErro'
import { BotaoPedirTutoria } from '../botaoPedirTutoria'

export const TITULO_QUERO_SER_TUTOR = "Quero ser tutor"

// Seção "Quero ser tutor": as salas em que o aluno está matriculado (GET /alunos/me/salas).
// A API já diz se ele pode pedir (pode_pedir_tutoria) e, se não puder, o motivo
export async function QueroSerTutor(){
    const resultado = await getAutenticado<SalaAluno[]>("/alunos/me/salas")

    if("erro" in resultado){
        // Fora do try/catch: o redirect do Next funciona lançando um erro
        sessaoExpiradaNaPagina(resultado.erro)

        return <Card titulo={TITULO_QUERO_SER_TUTOR} sublinhado><ToastErro mensagem={getErrorMessage(resultado.erro)} /></Card>
    }

    if(resultado.dados.length === 0){
        return (
            <Card titulo={TITULO_QUERO_SER_TUTOR} sublinhado>
                <EmptyState mensagem="Você ainda não está matriculado em nenhuma sala." />
            </Card>
        )
    }

    return (
        <Card titulo={TITULO_QUERO_SER_TUTOR} sublinhado>
            <p className={styles.explicacao}>
                Escolha a sala em que você quer ajudar outros alunos. O professor da sala analisa o pedido.
            </p>

            <ul className={styles.lista}>
                {resultado.dados.map((sala) => (
                    <li key={sala.id_sala} className={styles.item}>
                        <div className={styles.sala}>
                            <p className={styles.nome}>Sala {sala.nome}</p>
                            <p className={styles.info}>
                                {sala.serie}ª série · {sala.ano_letivo} · Prof. {sala.professor.nome}
                            </p>
                        </div>

                        {sala.pode_pedir_tutoria
                            ? <BotaoPedirTutoria idSala={sala.id_sala} nomeSala={sala.nome} />
                            : (
                                <div className={styles.bloqueado}>
                                    <button
                                    type="button"
                                    disabled
                                    className={styles.desabilitado}
                                    aria-describedby={`motivo-${sala.id_sala}`}
                                    >
                                        Pedir para ser tutor
                                    </button>
                                    {sala.motivo && (
                                        <p id={`motivo-${sala.id_sala}`} className={styles.motivo}>{sala.motivo.mensagem}</p>
                                    )}
                                </div>
                            )}
                    </li>
                ))}
            </ul>
        </Card>
    )
}
