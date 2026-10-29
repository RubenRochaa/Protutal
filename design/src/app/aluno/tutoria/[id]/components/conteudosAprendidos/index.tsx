import styles from './styles.module.scss'
import { Card } from '@/components/card'
import { EmptyState } from '@/components/emptyState'
import { ListItem } from '@/components/listItem'
import { getErrorMessage } from '@/lib/getErrorMessage'
import { sessaoExpiradaNaPagina } from '@/lib/sessaoExpirada'
import { formatarNota } from '@/lib/formatacao'
import { MediaConteudo } from '@/lib/types'
import { buscarConteudosDominados } from '../../../../buscas'
import { ToastErro } from '../../../../components/toastErro'

export const TITULO_CONTEUDOS = "Conteúdos aprendidos"

interface Props {
    idSala: number;
}

function ListaConteudos({ conteudos }: { conteudos: MediaConteudo[] }){
    return conteudos.map((conteudo) => (
        <ListItem key={conteudo.id_conteudo} direita={<span className={styles.media}>Média {formatarNota(conteudo.media)}</span>}>
            {conteudo.nome}
        </ListItem>
    ))
}

// Bloco "Conteúdos aprendidos" (rota A7 ?id_sala=): a faixa "dominado", como no print,
// e abaixo "Precisa reforçar" (faixa "com_dificuldade"). A faixa vem pronta da API
export async function ConteudosAprendidos({ idSala }: Props){
    const resultado = await buscarConteudosDominados(String(idSala))

    if("erro" in resultado){
        // Fora do try/catch: o redirect do Next funciona lançando um erro
        sessaoExpiradaNaPagina(resultado.erro)

        return <Card titulo={TITULO_CONTEUDOS} sublinhado><ToastErro mensagem={getErrorMessage(resultado.erro)} /></Card>
    }

    const dominados = resultado.dados.dominado ?? []
    const comDificuldade = resultado.dados.com_dificuldade ?? []

    if(dominados.length === 0 && comDificuldade.length === 0){
        return <Card titulo={TITULO_CONTEUDOS} sublinhado><EmptyState mensagem="Ainda não há conteúdos com nota nesta sala." /></Card>
    }

    return (
        <Card titulo={TITULO_CONTEUDOS} sublinhado>
            {dominados.length > 0
                ? <ListaConteudos conteudos={dominados} />
                : <p className={styles.vazio}>Nenhum conteúdo dominado ainda.</p>}

            {comDificuldade.length > 0 && (
                <>
                    <h3 className={styles.subtitulo}>Precisa reforçar</h3>
                    <ListaConteudos conteudos={comDificuldade} />
                </>
            )}
        </Card>
    )
}
