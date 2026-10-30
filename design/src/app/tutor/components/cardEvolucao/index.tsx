import lista from '@/app/professor/lista.module.scss'
import { Card } from '@/components/card'
import { EmptyState } from '@/components/emptyState'
import { GraficoEtapas } from '@/components/graficoEtapas'
import { getErrorMessage } from '@/lib/getErrorMessage'
import { sessaoExpiradaNaPagina } from '@/lib/sessaoExpirada'
import { ToastErro } from '@/app/aluno/components/toastErro'
import { buscarDesempenho } from '../../buscas'

const TITULO = "Minhas notas e evolução"

// Card "Minhas notas e evolução": média dos feedbacks dos alunos por etapa (rota T6).
// A T6 traz um item por vínculo, com os ativos primeiro: usamos o primeiro não revogado
export async function CardEvolucao(){
    const resultado = await buscarDesempenho()

    if("erro" in resultado){
        // Fora do try/catch: o redirect do Next funciona lançando um erro
        sessaoExpiradaNaPagina(resultado.erro)

        return <Card titulo={TITULO}><ToastErro mensagem={getErrorMessage(resultado.erro)} /></Card>
    }

    const vinculo = resultado.dados.find((v) => !v.revogado)

    if(!vinculo || vinculo.feedback.quantidade === 0){
        return <Card titulo={TITULO}><EmptyState mensagem="Você ainda não recebeu feedbacks dos alunos." /></Card>
    }

    return (
        <Card titulo={TITULO}>
            <GraficoEtapas etapas={vinculo.feedback.por_etapa} />
            <span className={lista.detalhe}>Média dos feedbacks dos alunos · Sala {vinculo.sala.nome}</span>
        </Card>
    )
}
