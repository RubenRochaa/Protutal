import styles from './styles.module.scss'
import pagina from '../../../../../pagina.module.scss'
import { getAutenticado } from '@/lib/apiServer'
import { getErrorMessage, getErrorStatus } from '@/lib/getErrorMessage'
import { sessaoExpiradaNaPagina } from '@/lib/sessaoExpirada'
import { MensagemTutoria } from '@/lib/types'
import { ErroCarregamento } from '@/app/professor/components/erroCarregamento'
import { ListaMensagensTutor } from '../listaMensagensTutor'

interface Props {
    idTutoria: number;
    // "comunicado" = só as mensagens com assunto
    tipo: string;
}

// Mensagens da tutoria (rota O2), da mais antiga para a mais recente.
// A finalizada também lista, como histórico
export async function MensagensTutor({ idTutoria, tipo }: Props){
    const resultado = await getAutenticado<MensagemTutoria[]>(
        `/tutorias/${idTutoria}/mensagens`,
        tipo ? { tipo } : undefined
    )

    if("erro" in resultado){
        // Fora do try/catch: o redirect do Next funciona lançando um erro
        sessaoExpiradaNaPagina(resultado.erro)

        const mensagem = getErrorMessage(resultado.erro)
        const status = getErrorStatus(resultado.erro)

        // Vínculo revogado: mensagem fixa, sem toast
        if(status === 403 && mensagem.includes("revogado")){
            return <p className={pagina.aviso} role="status">{mensagem}.</p>
        }

        return <ErroCarregamento mensagem={mensagem} status={status} />
    }

    if(resultado.dados.length === 0){
        return (
            <div className={styles.vazio}>
                <p>{tipo ? "Nenhum comunicado enviado ainda." : "Nenhuma mensagem ainda. Escreva para o seu tutorado."}</p>
            </div>
        )
    }

    return <ListaMensagensTutor mensagens={resultado.dados} />
}
