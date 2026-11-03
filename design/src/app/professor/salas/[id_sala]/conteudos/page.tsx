import { getAutenticado } from '@/lib/apiServer'
import { getErrorMessage, getErrorStatus } from '@/lib/getErrorMessage'
import { sessaoExpiradaNaPagina } from '@/lib/sessaoExpirada'
import { ConteudoSala } from '@/lib/types'
import { ErroCarregamento } from '../../../components/erroCarregamento'
import { ListaConteudos } from './components/listaConteudos'

interface Props {
    params: Promise<{ id_sala: string }>;
}

// Aba "Conteúdos" (sem Figma; segue o padrão "Lista com filtro" de Minhas salas).
// Lista os conteúdos de Geografia da sala na rota P2 (GET /salas/:id/conteudos)
export default async function ConteudosSalaPage({ params }: Props){
    const { id_sala } = await params
    const resultado = await getAutenticado<ConteudoSala[]>(`/salas/${encodeURIComponent(id_sala)}/conteudos`)

    // Fora do try/catch: o redirect do Next funciona lançando um erro
    if("erro" in resultado) sessaoExpiradaNaPagina(resultado.erro)

    if("erro" in resultado){
        return <ErroCarregamento mensagem={getErrorMessage(resultado.erro)} status={getErrorStatus(resultado.erro)} />
    }

    return <ListaConteudos idSala={Number(id_sala)} conteudos={resultado.dados} />
}
