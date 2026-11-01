import { getAutenticado } from '@/lib/apiServer'
import { getErrorMessage, getErrorStatus } from '@/lib/getErrorMessage'
import { sessaoExpiradaNaPagina } from '@/lib/sessaoExpirada'
import { Contestacao } from '@/lib/types'
import { ErroCarregamento } from '../../../components/erroCarregamento'
import { ListaContestacoes } from './components/listaContestacoes'

interface Props {
    params: Promise<{ id_sala: string }>;
    searchParams: Promise<{ status?: string | string[] }>;
}

const STATUS_VALIDOS = ["pendente", "aceita", "recusada"]

// Aba "Contestações" (sem Figma; padrão "Lista com filtro").
// P16 (GET /contestacoes?id_sala=&status=). O professor dono da sala também resolve (T4).
export default async function ContestacoesSalaPage({ params, searchParams }: Props){
    const { id_sala } = await params
    const { status } = await searchParams
    const filtro = typeof status === "string" && STATUS_VALIDOS.includes(status) ? status : ""

    const resultado = await getAutenticado<Contestacao[]>("/contestacoes", {
        id_sala,
        ...(filtro ? { status: filtro } : {})
    })

    // Fora do try/catch: o redirect do Next funciona lançando um erro
    if("erro" in resultado) sessaoExpiradaNaPagina(resultado.erro)

    if("erro" in resultado){
        return <ErroCarregamento mensagem={getErrorMessage(resultado.erro)} status={getErrorStatus(resultado.erro)} />
    }

    return <ListaContestacoes contestacoes={resultado.dados} filtro={filtro} />
}
