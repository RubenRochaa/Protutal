import styles from './styles.module.scss'
import pagina from '../../../../../pagina.module.scss'
import { Suspense } from 'react'
import { Card } from '@/components/card'
import { Loading } from '@/components/loading'
import { EmptyState } from '@/components/emptyState'
import { Etiqueta } from '@/components/etiqueta'
import { FiltroAbas } from '@/components/filtroAbas'
import { getAutenticado } from '@/lib/apiServer'
import { getErrorMessage, getErrorStatus } from '@/lib/getErrorMessage'
import { sessaoExpiradaNaPagina } from '@/lib/sessaoExpirada'
import { MensagemTutoria } from '@/lib/types'
import { ErroCarregamento } from '@/app/professor/components/erroCarregamento'
import { BotaoAtualizar } from '@/app/aluno/tutoria/[id]/chat/components/botaoAtualizar'
import { buscarTutorias } from '../../../../../buscas'
import { MensagensTutor } from '../mensagensTutor'
import { FormMensagemTutor } from '../formMensagemTutor'
import { MASCOTES } from '@/lib/mascotes'

interface Props {
    // Vem da URL sem tratar
    id: string;
    // "comunicado" ou "" (todas)
    tipo: string;
}

const OPCOES_TIPO = [
    { valor: "", rotulo: "Todas" },
    { valor: "comunicado", rotulo: "Comunicados" },
]

// Quadro do chat: acha a tutoria na T1 (nome do aluno e status) e,
// dentro dele, as mensagens (O2) no próprio Suspense e o campo de envio (O1)
export async function ChatTutor({ id, tipo }: Props){
    const resultado = await buscarTutorias("")

    if("erro" in resultado){
        // Fora do try/catch: o redirect do Next funciona lançando um erro
        sessaoExpiradaNaPagina(resultado.erro)

        return <ErroCarregamento mensagem={getErrorMessage(resultado.erro)} status={getErrorStatus(resultado.erro)} />
    }

    const tutoria = resultado.dados.find((t) => String(t.id_tutoria) === id)

    if(!tutoria){
        // A T1 não lista tutorias de vínculos revogados. A O2 diz se foi esse o caso
        // (403 "Seu vínculo de tutor nesta sala foi revogado"): mensagem fixa, sem toast
        if(/^[1-9]\d*$/.test(id)){
            const mensagens = await getAutenticado<MensagemTutoria[]>(`/tutorias/${id}/mensagens`)

            if("erro" in mensagens){
                sessaoExpiradaNaPagina(mensagens.erro)

                const texto = getErrorMessage(mensagens.erro)
                if(getErrorStatus(mensagens.erro) === 403 && texto.includes("revogado")){
                    return <p className={pagina.aviso} role="status">{texto}. O chat desta tutoria não está mais disponível.</p>
                }
            }
        }

        return <Card><EmptyState mensagem="Tutoria não encontrada." imagem={MASCOTES.badRequest} /></Card>
    }

    const ativa = tutoria.status === "ativa"

    return (
        <Card>
            <div className={styles.topo}>
                <h2 className={styles.titulo}>
                    <span className={styles.rotulo}>Mensagens:</span> {tutoria.aluno.nome}
                </h2>

                {!ativa && <Etiqueta>Finalizada</Etiqueta>}

                {/* Não há tempo real: o tutor busca as mensagens novas por este botão */}
                <BotaoAtualizar />
            </div>

            <FiltroAbas parametro="tipo" opcoes={OPCOES_TIPO} valor={tipo} rotulo="Filtrar mensagens por tipo" />

            <Suspense key={tipo} fallback={<div className={styles.carregando}><Loading /></div>}>
                <MensagensTutor idTutoria={tutoria.id_tutoria} tipo={tipo} />
            </Suspense>

            {ativa
                ? <FormMensagemTutor idTutoria={tutoria.id_tutoria} />
                : (
                    <p className={styles.finalizada} role="status">
                        Esta tutoria foi finalizada. O histórico continua disponível para leitura.
                    </p>
                )}
        </Card>
    )
}
