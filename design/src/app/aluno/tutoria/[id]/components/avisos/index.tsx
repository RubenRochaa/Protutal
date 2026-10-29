import styles from './styles.module.scss'
import { Card } from '@/components/card'
import { EmptyState } from '@/components/emptyState'
import { getAutenticado } from '@/lib/apiServer'
import { getErrorMessage, getErrorStatus } from '@/lib/getErrorMessage'
import { sessaoExpiradaNaPagina } from '@/lib/sessaoExpirada'
import { formatarDataHora } from '@/lib/formatacao'
import { AvisoSala } from '@/lib/types'
import { ToastErro } from '../../../../components/toastErro'

export const TITULO_AVISOS = "Avisos da sala"

interface Props {
    idSala: number;
}

// Bloco "Avisos da sala" (rota A4): avisos que o professor publicou para a sala.
// Não está no print do Figma; entrou porque a rota existe e não tinha tela
export async function Avisos({ idSala }: Props){
    const resultado = await getAutenticado<AvisoSala[]>(`/salas/${idSala}/avisos`)

    if("erro" in resultado){
        // Fora do try/catch: o redirect do Next funciona lançando um erro
        sessaoExpiradaNaPagina(resultado.erro)

        // 403: o aluno não está matriculado na sala. Estado da tela, sem toast
        if(getErrorStatus(resultado.erro) === 403){
            return <Card titulo={TITULO_AVISOS} sublinhado><EmptyState mensagem="Você não tem acesso aos avisos desta sala." /></Card>
        }

        return <Card titulo={TITULO_AVISOS} sublinhado><ToastErro mensagem={getErrorMessage(resultado.erro)} /></Card>
    }

    if(resultado.dados.length === 0){
        return <Card titulo={TITULO_AVISOS} sublinhado><EmptyState mensagem="Nenhum aviso publicado." /></Card>
    }

    // A A4 já manda o mais recente primeiro; a ordenação só garante isso
    const avisos = [...resultado.dados].sort((a, b) => b.data_publicacao.localeCompare(a.data_publicacao))

    return (
        <Card titulo={TITULO_AVISOS} sublinhado>
            {avisos.map((aviso) => (
                <article key={aviso.id_aviso} className={styles.aviso}>
                    <h3 className={styles.titulo}>{aviso.titulo}</h3>
                    <p className={styles.texto}>{aviso.conteudo}</p>
                    <p className={styles.info}>
                        Prof. {aviso.professor.nome} · {formatarDataHora(aviso.data_publicacao)}
                    </p>
                </article>
            ))}
        </Card>
    )
}
