import styles from './styles.module.scss'
import Link from 'next/link'
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

// Leva para a tela "Minhas atividades", com a lista completa
function VerTodas(){
    return <Link href="/aluno/atividades" className={styles.verTodas}>Ver todas</Link>
}

// Card "Atividades pendentes": atividades sem resposta do aluno (rota A1)
export async function CardPendentes(){
    const resultado = await getAutenticado<AtividadeAluno[]>("/alunos/me/atividades", { status: "pendente" })

    if("erro" in resultado){
        // Fora do try/catch: o redirect do Next funciona lançando um erro
        sessaoExpiradaNaPagina(resultado.erro)

        return <Card titulo={TITULO}><ToastErro mensagem={getErrorMessage(resultado.erro)} /></Card>
    }

    // A A1 também traz as pendentes de tutorias finalizadas, que não dá mais para responder
    const pendentes = resultado.dados.filter((atividade) => atividade.pode_responder)

    if(pendentes.length === 0){
        return (
            <Card titulo={TITULO}>
                <EmptyState mensagem="Nenhuma atividade pendente." imagem={null} />
                <VerTodas />
            </Card>
        )
    }

    return (
        <Card titulo={TITULO}>
            <ul className={styles.lista}>
                {pendentes.slice(0, LIMITE).map((atividade) => (
                    <li key={atividade.id_atividade}>
                        {/* O item inteiro leva ao detalhe da atividade */}
                        <Link href={`/aluno/atividades/${atividade.id_atividade}`} className={styles.item}>
                            <ListItem>{atividade.titulo}</ListItem>
                        </Link>
                    </li>
                ))}
            </ul>

            <VerTodas />
        </Card>
    )
}
