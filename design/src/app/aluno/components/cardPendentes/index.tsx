import styles from './styles.module.scss'
import { Card } from '@/components/card'
import { EmptyState } from '@/components/emptyState'
import { ListItem } from '@/components/listItem'
import { getAutenticado } from '@/lib/apiServer'
import { getErrorMessage } from '@/lib/getErrorMessage'
import { sessaoExpiradaNaPagina } from '@/lib/sessaoExpirada'
import { AtividadeAluno } from '@/lib/types'
import { ToastErro } from '../toastErro'

const TITULO = "Atividades pendentes"

// A API já ordena pelo prazo mais próximo; o card mostra só as primeiras
const LIMITE = 5

// Card "Atividades pendentes": atividades sem resposta do aluno (rota A1)
export async function CardPendentes(){
    const resultado = await getAutenticado<AtividadeAluno[]>("/alunos/me/atividades", { status: "pendente" })

    if("erro" in resultado){
        // Fora do try/catch: o redirect do Next funciona lançando um erro
        sessaoExpiradaNaPagina(resultado.erro)

        return <Card titulo={TITULO}><ToastErro mensagem={getErrorMessage(resultado.erro)} /></Card>
    }

    if(resultado.dados.length === 0){
        return <Card titulo={TITULO}><EmptyState mensagem="Nenhuma atividade pendente." /></Card>
    }

    return (
        <Card titulo={TITULO}>
            <ul className={styles.lista}>
                {resultado.dados.slice(0, LIMITE).map((atividade) => (
                    <li key={atividade.id_atividade}>
                        <ListItem>{atividade.titulo}</ListItem>
                    </li>
                ))}
            </ul>
        </Card>
    )
}
