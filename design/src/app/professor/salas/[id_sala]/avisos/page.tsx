import { getAutenticado } from '@/lib/apiServer'
import { getErrorMessage, getErrorStatus } from '@/lib/getErrorMessage'
import { sessaoExpiradaNaPagina } from '@/lib/sessaoExpirada'
import { Aviso } from '@/lib/types'
import { ErroCarregamento } from '../../../components/erroCarregamento'
import { ListaAvisos } from './components/listaAvisos'

interface Props {
    params: Promise<{ id_sala: string }>;
}

// Aba "Avisos" (Figma p03, cartão "Enviar aviso para a sala", e p02, o modal).
// Lista os avisos da sala na rota A4 (GET /salas/:id/avisos), do mais recente para o mais antigo
export default async function AvisosSalaPage({ params }: Props){
    const { id_sala } = await params
    const resultado = await getAutenticado<Aviso[]>(`/salas/${encodeURIComponent(id_sala)}/avisos`)

    // Fora do try/catch: o redirect do Next funciona lançando um erro
    if("erro" in resultado) sessaoExpiradaNaPagina(resultado.erro)

    if("erro" in resultado){
        return <ErroCarregamento mensagem={getErrorMessage(resultado.erro)} status={getErrorStatus(resultado.erro)} />
    }

    return <ListaAvisos idSala={Number(id_sala)} avisos={resultado.dados} />
}
