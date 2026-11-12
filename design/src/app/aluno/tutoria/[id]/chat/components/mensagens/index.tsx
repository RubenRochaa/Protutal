import styles from './styles.module.scss'
import { getAutenticado } from '@/lib/apiServer'
import { getErrorMessage } from '@/lib/getErrorMessage'
import { sessaoExpiradaNaPagina } from '@/lib/sessaoExpirada'
import { MensagemTutoria } from '@/lib/types'
import { ToastErro } from '../../../../../components/toastErro'
import { ListaMensagens } from '../listaMensagens'

interface Props {
    idTutoria: number;
}

// Mensagens da tutoria (rota O2), da mais antiga para a mais recente.
// A finalizada também lista, como histórico
export async function Mensagens({ idTutoria }: Props){
    const resultado = await getAutenticado<MensagemTutoria[]>(`/tutorias/${idTutoria}/mensagens`)

    if("erro" in resultado){
        // Fora do try/catch: o redirect do Next funciona lançando um erro
        sessaoExpiradaNaPagina(resultado.erro)

        return <ToastErro mensagem={getErrorMessage(resultado.erro)} />
    }

    if(resultado.dados.length === 0){
        return (
            <div className={styles.vazio}>
                <p>Nenhuma mensagem ainda. Envie sua dúvida para o tutor.</p>
            </div>
        )
    }

    return <ListaMensagens mensagens={resultado.dados} />
}
