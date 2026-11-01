import { getAutenticado } from '@/lib/apiServer'
import { getErrorMessage, getErrorStatus } from '@/lib/getErrorMessage'
import { sessaoExpiradaNaPagina } from '@/lib/sessaoExpirada'
import { TutorSala } from '@/lib/types'
import { ErroCarregamento } from '../../../components/erroCarregamento'
import { ListaTutores } from './components/listaTutores'

interface Props {
    params: Promise<{ id_sala: string }>;
}

// Aba "Tutores" (Figma p06, coluna "Tutores" e "Remover?").
// Lista os tutores ativos na rota P24 (GET /salas/:id/tutores)
export default async function TutoresSalaPage({ params }: Props){
    const { id_sala } = await params
    const resultado = await getAutenticado<TutorSala[]>(`/salas/${encodeURIComponent(id_sala)}/tutores`)

    // Fora do try/catch: o redirect do Next funciona lançando um erro
    if("erro" in resultado) sessaoExpiradaNaPagina(resultado.erro)

    if("erro" in resultado){
        return <ErroCarregamento mensagem={getErrorMessage(resultado.erro)} status={getErrorStatus(resultado.erro)} />
    }

    return <ListaTutores tutores={resultado.dados} />
}
