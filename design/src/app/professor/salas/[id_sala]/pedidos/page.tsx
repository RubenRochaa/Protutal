import { getAutenticado } from '@/lib/apiServer'
import { getErrorMessage, getErrorStatus } from '@/lib/getErrorMessage'
import { sessaoExpiradaNaPagina } from '@/lib/sessaoExpirada'
import { PedidoTutoria } from '@/lib/types'
import { ErroCarregamento } from '../../../components/erroCarregamento'
import { ListaPedidos } from '../../../components/listaPedidos'

interface Props {
    params: Promise<{ id_sala: string }>;
}

// Aba "Pedidos" (Figma p08 e p05). A P26 (GET /pedidos-tutoria) devolve os pedidos
// pendentes de TODAS as salas do professor: aqui ficam só os desta sala (decisão D2)
export default async function PedidosSalaPage({ params }: Props){
    const { id_sala } = await params
    const resultado = await getAutenticado<PedidoTutoria[]>("/pedidos-tutoria")

    // Fora do try/catch: o redirect do Next funciona lançando um erro
    if("erro" in resultado) sessaoExpiradaNaPagina(resultado.erro)

    if("erro" in resultado){
        return <ErroCarregamento mensagem={getErrorMessage(resultado.erro)} status={getErrorStatus(resultado.erro)} />
    }

    const pedidos = resultado.dados.filter((pedido) => String(pedido.sala_pedido.id_sala) === id_sala)

    return (
        <ListaPedidos
        pedidos={pedidos}
        mensagemVazia="Nenhum pedido pendente nesta sala. Os alunos matriculados pedem para ser tutor pela área deles."
        />
    )
}
