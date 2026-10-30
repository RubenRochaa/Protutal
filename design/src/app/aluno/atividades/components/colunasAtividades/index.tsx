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
    className: string;
}

function Coluna({ titulo, atividades, vazio, className }: ColunaProps){
    return (
        <Card titulo={titulo} className={className}>
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
// A ordem da API (prazo mais próximo primeiro) é mantida em cada coluna
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

    const naoEntregues = resultado.dados.filter((atividade) => atividade.status === "pendente")
    const realizadas = resultado.dados.filter((atividade) => atividade.status !== "pendente")

    return (
        // "Não entregues" vem primeiro no HTML: no celular e no tablet fica em cima,
        // porque é o que o aluno precisa fazer. No desktop o CSS põe "Realizadas" à esquerda, como no Figma
        <div className={styles.grade}>
            <Coluna
            titulo="Atividades não entregues"
            atividades={naoEntregues}
            vazio={etapa ? MSG_FILTRO_VAZIO : "Nenhuma atividade pendente. Bom trabalho!"}
            className={styles.naoEntregues}
            />

            <Coluna
            titulo="Atividades realizadas"
            atividades={realizadas}
            vazio={etapa ? MSG_FILTRO_VAZIO : "Você ainda não entregou nenhuma atividade."}
            className={styles.realizadas}
            />
        </div>
    )
}
