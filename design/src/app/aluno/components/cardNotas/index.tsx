import { Card } from '@/components/card'
import { EmptyState } from '@/components/emptyState'
import { getAutenticado } from '@/lib/apiServer'
import { getErrorMessage } from '@/lib/getErrorMessage'
import { sessaoExpiradaNaPagina } from '@/lib/sessaoExpirada'
import { DesempenhoAluno } from '@/lib/types'
import { GraficoEtapas } from '../graficoEtapas'
import { ToastErro } from '../toastErro'

const TITULO = "Minhas notas e evolução"

// Card "Minhas notas e evolução": média de cada etapa (rota A6), em gráfico de linha
export async function CardNotas(){
    const resultado = await getAutenticado<DesempenhoAluno>("/alunos/me/desempenho")

    if("erro" in resultado){
        // Fora do try/catch: o redirect do Next funciona lançando um erro
        sessaoExpiradaNaPagina(resultado.erro)

        return <Card titulo={TITULO}><ToastErro mensagem={getErrorMessage(resultado.erro)} /></Card>
    }

    const etapas = resultado.dados.por_etapa

    if(etapas.every((item) => item.media === null)){
        return <Card titulo={TITULO}><EmptyState mensagem="Você ainda não tem notas lançadas." /></Card>
    }

    return (
        <Card titulo={TITULO}>
            <GraficoEtapas etapas={etapas} />
        </Card>
    )
}
