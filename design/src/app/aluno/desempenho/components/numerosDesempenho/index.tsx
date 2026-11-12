import styles from './styles.module.scss'
import { Card } from '@/components/card'
import { EmptyState } from '@/components/emptyState'
import { getErrorMessage } from '@/lib/getErrorMessage'
import { sessaoExpiradaNaPagina } from '@/lib/sessaoExpirada'
import { formatarNota } from '@/lib/formatacao'
import { buscarConteudosDominados, buscarDesempenho } from '../../../buscas'
import { ToastErro } from '../../../components/toastErro'
import { MASCOTES } from '@/lib/mascotes'

interface Props {
    // "" = todas as etapas
    etapa: string;
}

// Mensagem de "sem notas" da tela inteira. Os outros blocos da A6 somem nesse caso
function mensagemSemNotas(etapa: string){
    return etapa
        ? `Você ainda não tem notas na ${etapa}ª etapa.`
        : "Suas notas aparecerão aqui quando o tutor corrigir suas atividades."
}

// Linha de números: média geral e total de notas (A6) e quantos conteúdos
// estão em cada faixa (A7). Se só a A7 falhar, os números da A6 continuam aparecendo
export async function NumerosDesempenho({ etapa }: Props){
    const [resultado, resultadoConteudos] = await Promise.all([
        buscarDesempenho(etapa, ""),
        buscarConteudosDominados("")
    ])

    // Fora do try/catch: o redirect do Next funciona lançando um erro
    if("erro" in resultado) sessaoExpiradaNaPagina(resultado.erro)
    if("erro" in resultadoConteudos) sessaoExpiradaNaPagina(resultadoConteudos.erro)

    if("erro" in resultado) return <ToastErro mensagem={getErrorMessage(resultado.erro)} />

    const { media, total_notas } = resultado.dados.media_geral

    if(total_notas === 0) return <Card><EmptyState mensagem={mensagemSemNotas(etapa)} imagem={MASCOTES.desempenho} /></Card>

    // A A7 não aceita filtro de etapa: as contagens são sempre de todas as etapas
    const conteudos = "dados" in resultadoConteudos ? resultadoConteudos.dados : null

    const numeros = [
        { rotulo: etapa ? `Média da ${etapa}ª etapa` : "Média geral", valor: media === null ? "—" : formatarNota(media) },
        { rotulo: "Notas lançadas", valor: String(total_notas) },
        { rotulo: "Conteúdos dominados", valor: conteudos ? String(conteudos.dominado?.length ?? 0) : "—" },
        { rotulo: "Conteúdos com dificuldade", valor: conteudos ? String(conteudos.com_dificuldade?.length ?? 0) : "—" },
    ]

    return (
        <section aria-label="Resumo do desempenho" className={styles.secao}>
            <dl className={styles.numeros}>
                {numeros.map((numero) => (
                    <div key={numero.rotulo} className={styles.numero}>
                        <dt className={styles.rotulo}>{numero.rotulo}</dt>
                        <dd className={styles.valor}>{numero.valor}</dd>
                    </div>
                ))}
            </dl>

            {"erro" in resultadoConteudos && <ToastErro mensagem={getErrorMessage(resultadoConteudos.erro)} />}
        </section>
    )
}
