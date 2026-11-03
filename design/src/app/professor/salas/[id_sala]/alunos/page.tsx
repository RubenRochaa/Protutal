import { getAutenticado } from '@/lib/apiServer'
import { getErrorMessage } from '@/lib/getErrorMessage'
import { sessaoExpiradaNaPagina } from '@/lib/sessaoExpirada'
import { AlunoSala } from '@/lib/types'
import { ErroCarregamento } from '../../../components/erroCarregamento'
import { ListaAlunos } from './components/listaAlunos'

interface Props {
    params: Promise<{ id_sala: string }>;
}

// Aba "Alunos" da sala (Figma p06, coluna "Alunos").
// Busca os matriculados na rota P23 (GET /salas/:id/alunos), no servidor.
// Sala inexistente ou de outro professor já foi barrada no layout (rota P1).
export default async function AlunosSalaPage({ params }: Props){
    const { id_sala } = await params
    const resultado = await getAutenticado<AlunoSala[]>(`/salas/${encodeURIComponent(id_sala)}/alunos`)

    // Fora do try/catch: o redirect do Next funciona lançando um erro
    if("erro" in resultado) sessaoExpiradaNaPagina(resultado.erro)

    if("erro" in resultado) return <ErroCarregamento mensagem={getErrorMessage(resultado.erro)} />;

    return <ListaAlunos idSala={Number(id_sala)} alunos={resultado.dados} />
}
