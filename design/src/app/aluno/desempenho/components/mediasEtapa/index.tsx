import { Card } from '@/components/card'
import { getErrorMessage } from '@/lib/getErrorMessage'
import { sessaoExpiradaNaPagina } from '@/lib/sessaoExpirada'
import { buscarDesempenho } from '../../../buscas'
import { GraficoEtapas } from '../../../components/graficoEtapas'
import { ToastErro } from '../../../components/toastErro'

export const TITULO_ETAPAS = "Média por etapa"

interface Props {
    etapa: string;
}

// Gráfico de linha das médias por etapa (A6 por_etapa), o mesmo da tela inicial.
// Com filtro, a A6 manda só a etapa escolhida; etapa sem nota fica "sem nota", nunca 0
export async function MediasEtapa({ etapa }: Props){
    const resultado = await buscarDesempenho(etapa, "")

    if("erro" in resultado){
        // Fora do try/catch: o redirect do Next funciona lançando um erro
        sessaoExpiradaNaPagina(resultado.erro)

        return <Card titulo={TITULO_ETAPAS} sublinhado><ToastErro mensagem={getErrorMessage(resultado.erro)} /></Card>
    }

    // Sem notas, a linha de números já mostra o aviso da tela
    if(resultado.dados.media_geral.total_notas === 0) return null

    return (
        <Card titulo={TITULO_ETAPAS} sublinhado>
            <GraficoEtapas etapas={resultado.dados.por_etapa} />
        </Card>
    )
}
