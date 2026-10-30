import styles from './styles.module.scss'
import { EmptyState } from '@/components/emptyState'
import { getAutenticado } from '@/lib/apiServer'
import { getErrorMessage, getErrorStatus } from '@/lib/getErrorMessage'
import { sessaoExpiradaNaPagina } from '@/lib/sessaoExpirada'
import { formatarDataHora } from '@/lib/formatacao'
import { AvisoSala } from '@/lib/types'
import { ToastErro } from '@/app/aluno/components/toastErro'
import { MASCOTES } from '@/lib/mascotes'

interface TituloProps {
    nomeSala: string;
}

// Título do bloco, usado também no fallback do Suspense
export function TituloAvisosSala({ nomeSala }: TituloProps){
    return <h3 className={styles.nomeSala}>Avisos · Sala {nomeSala}</h3>
}

interface Props {
    idSala: number;
    nomeSala: string;
}

// Bloco "Avisos da sala" (rota A4) dentro da seção de cada sala do tutor.
// Cópia adaptada do bloco do aluno, sem o Card (a seção já fica dentro do Card "Anexar materiais")
export async function AvisosSala({ idSala, nomeSala }: Props){
    const resultado = await getAutenticado<AvisoSala[]>(`/salas/${idSala}/avisos`)

    if("erro" in resultado){
        // Fora do try/catch: o redirect do Next funciona lançando um erro
        sessaoExpiradaNaPagina(resultado.erro)

        // 403: sem acesso aos avisos da sala. Estado da tela, sem toast
        if(getErrorStatus(resultado.erro) === 403){
            return (
                <>
                    <TituloAvisosSala nomeSala={nomeSala} />
                    <EmptyState mensagem="Você não tem acesso aos avisos desta sala." imagem={MASCOTES.badRequest} />
                </>
            )
        }

        return (
            <>
                <TituloAvisosSala nomeSala={nomeSala} />
                <ToastErro mensagem={getErrorMessage(resultado.erro)} />
            </>
        )
    }

    if(resultado.dados.length === 0){
        return (
            <>
                <TituloAvisosSala nomeSala={nomeSala} />
                <EmptyState mensagem="Nenhum aviso publicado." />
            </>
        )
    }

    // A A4 já manda o mais recente primeiro; a ordenação só garante isso
    const avisos = [...resultado.dados].sort((a, b) => b.data_publicacao.localeCompare(a.data_publicacao))

    return (
        <>
            <TituloAvisosSala nomeSala={nomeSala} />

            {avisos.map((aviso) => (
                <article key={aviso.id_aviso} className={styles.aviso}>
                    <h4 className={styles.titulo}>{aviso.titulo}</h4>
                    <p className={styles.texto}>{aviso.conteudo}</p>
                    <p className={styles.info}>
                        Prof. {aviso.professor.nome} · {formatarDataHora(aviso.data_publicacao)}
                    </p>
                </article>
            ))}
        </>
    )
}
