import styles from './styles.module.scss'
import { Suspense } from 'react'
import { Card } from '@/components/card'
import { Loading } from '@/components/loading'
import { getErrorMessage } from '@/lib/getErrorMessage'
import { sessaoExpiradaNaPagina } from '@/lib/sessaoExpirada'
import { ToastErro } from '../../../../../components/toastErro'
import { SeloStatus } from '../../../../../components/seloStatus'
import { TutoriaNaoEncontrada } from '../../../../components/tutoriaNaoEncontrada'
import { buscarTutoria } from '../../../../buscarTutoria'
import { BotaoAtualizar } from '../botaoAtualizar'
import { Mensagens } from '../mensagens'
import { FormMensagem } from '../formMensagem'

interface Props {
    id: string;
}

// Quadro do chat: acha a tutoria na A3 (nome do tutor e status) e,
// dentro dele, as mensagens (O2) no próprio Suspense e o campo de envio (O1)
export async function ChatTutoria({ id }: Props){
    const resultado = await buscarTutoria(id)

    if("erro" in resultado){
        // Fora do try/catch: o redirect do Next funciona lançando um erro
        sessaoExpiradaNaPagina(resultado.erro)

        return <ToastErro mensagem={getErrorMessage(resultado.erro)} />
    }

    const { tutoria } = resultado

    if(!tutoria) return <TutoriaNaoEncontrada />

    const ativa = tutoria.status === "ativa"

    return (
        <Card>
            <div className={styles.topo}>
                <h2 className={styles.titulo}>
                    <span className={styles.rotulo}>Chat com o tutor:</span> {tutoria.tutor.nome}
                </h2>

                {!ativa && <SeloStatus texto="Finalizada" cor="cinza" />}

                {/* Não há tempo real: o aluno busca as mensagens novas por este botão */}
                <BotaoAtualizar />
            </div>

            <Suspense fallback={<div className={styles.carregando}><Loading /></div>}>
                <Mensagens idTutoria={tutoria.id_tutoria} />
            </Suspense>

            {ativa
                ? <FormMensagem idTutoria={tutoria.id_tutoria} />
                : (
                    <p className={styles.finalizada} role="status">
                        Esta tutoria foi finalizada. O histórico continua disponível para leitura.
                    </p>
                )}
        </Card>
    )
}
