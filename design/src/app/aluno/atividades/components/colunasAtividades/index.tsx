import styles from './styles.module.scss'
import { Card } from '@/components/card'
import { EmptyState } from '@/components/emptyState'
import { getAutenticado } from '@/lib/apiServer'
import { getErrorMessage } from '@/lib/getErrorMessage'
import { sessaoExpiradaNaPagina } from '@/lib/sessaoExpirada'
import { AtividadeAluno } from '@/lib/types'
import { ToastErro } from '../../../components/toastErro'
import { ItemAtividade } from '../itemAtividade'
import { MASCOTES } from '@/lib/mascotes'

const MSG_FILTRO_VAZIO = "Nenhuma atividade nesta etapa."

interface Props {
    // "" = todas as etapas (não envia o filtro)
    etapa: string;
}

interface ColunaProps {
    titulo: string;
    atividades: AtividadeAluno[];
    vazio: string;
}

// Prazo em milissegundos, para comparar na ordenação
function prazo(atividade: AtividadeAluno){
    return new Date(atividade.data_entrega).getTime()
}

function Coluna({ titulo, atividades, vazio }: ColunaProps){
    return (
        <Card titulo={titulo}>
            {atividades.length === 0 ? (
                <EmptyState mensagem={vazio} imagem={MASCOTES.atividades} />
            ) : (
                <ul className={styles.lista}>
                    {atividades.map((atividade) => (
                        <li key={atividade.id_atividade}>
                            <ItemAtividade atividade={atividade} />
                        </li>
                    ))}
                </ul>
            )}
        </Card>
    )
}

// Busca as atividades do aluno (rota A1) uma vez só e separa em duas colunas.
// Cada coluna é ordenada aqui no front, sem mudar a chamada à API
export async function ColunasAtividades({ etapa }: Props){
    const resultado = await getAutenticado<AtividadeAluno[]>(
        "/alunos/me/atividades",
        etapa ? { etapa } : undefined
    )

    if("erro" in resultado){
        // Fora do try/catch: o redirect do Next funciona lançando um erro
        sessaoExpiradaNaPagina(resultado.erro)

        return <ToastErro mensagem={getErrorMessage(resultado.erro)} />
    }

    const pendentes = resultado.dados.filter((atividade) => atividade.status === "pendente")
    const entregues = resultado.dados.filter((atividade) => atividade.status !== "pendente")

    // Não entregues: prazo mais antigo primeiro (atrasadas no topo, depois as que vencem antes)
    const naoEntregues = [...pendentes].sort((a, b) => prazo(a) - prazo(b))
    // Realizadas: prazo mais recente primeiro
    const realizadas = [...entregues].sort((a, b) => prazo(b) - prazo(a))

    return (
        // "Não entregues" vem primeiro em todas as larguras (à esquerda no desktop, em cima no celular),
        // porque é o que o aluno precisa fazer
        <div className={styles.grade}>
            <Coluna
            titulo={`Atividades não entregues (${naoEntregues.length})`}
            atividades={naoEntregues}
            vazio={etapa ? MSG_FILTRO_VAZIO : "Nenhuma atividade pendente. Bom trabalho!"}
            />

            <Coluna
            titulo={`Atividades realizadas (${realizadas.length})`}
            atividades={realizadas}
            vazio={etapa ? MSG_FILTRO_VAZIO : "Você ainda não entregou nenhuma atividade."}
            />
        </div>
    )
}
