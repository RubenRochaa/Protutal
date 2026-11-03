import styles from './styles.module.scss'
import { Card } from '@/components/card'
import { getErrorMessage } from '@/lib/getErrorMessage'
import { sessaoExpiradaNaPagina } from '@/lib/sessaoExpirada'
import { formatarNota } from '@/lib/formatacao'
import { ConteudosDominados } from '@/lib/types'
import { buscarConteudosDominados, buscarDesempenho } from '../../../buscas'
import { ToastErro } from '../../../components/toastErro'
import { SeloStatus } from '../../../components/seloStatus'
import { MASCOTES } from '@/lib/mascotes'

export const TITULO_CONTEUDO = "Média por conteúdo"

interface Props {
    etapa: string;
}

// A faixa vem da A7 (o front não calcula faixa): procura o conteúdo em cada lista
function faixaDoConteudo(idConteudo: number, conteudos: ConteudosDominados | null){
    if(conteudos?.dominado?.some((item) => item.id_conteudo === idConteudo)) return "dominado"
    if(conteudos?.com_dificuldade?.some((item) => item.id_conteudo === idConteudo)) return "com_dificuldade"

    return null
}

// Média de cada conteúdo (A6 por_conteudo) com uma barra de 0 a 10
// e o selo "Dominado" ou "Com dificuldade" vindo da A7
export async function MediasConteudo({ etapa }: Props){
    const [resultado, resultadoConteudos] = await Promise.all([
        buscarDesempenho(etapa, ""),
        buscarConteudosDominados("")
    ])

    // Fora do try/catch: o redirect do Next funciona lançando um erro
    if("erro" in resultado) sessaoExpiradaNaPagina(resultado.erro)
    if("erro" in resultadoConteudos) sessaoExpiradaNaPagina(resultadoConteudos.erro)

    if("erro" in resultado){
        return <Card titulo={TITULO_CONTEUDO} sublinhado><ToastErro mensagem={getErrorMessage(resultado.erro)} /></Card>
    }

    if(resultado.dados.media_geral.total_notas === 0) return null

    // Se a A7 falhar, a lista aparece sem os selos (o erro já vira toast na linha de números)
    const conteudos = "dados" in resultadoConteudos ? resultadoConteudos.dados : null

    return (
        <Card titulo={TITULO_CONTEUDO} sublinhado imagem={MASCOTES.desempenho}>
            {/* A A7 não filtra por etapa: com filtro, a média é da etapa e o selo é geral */}
            {etapa && conteudos && (
                <p className={styles.aviso}>A classificação Dominado/Com dificuldade considera todas as etapas.</p>
            )}

            <ul className={styles.lista}>
                {resultado.dados.por_conteudo.map((conteudo) => {
                    const faixa = faixaDoConteudo(conteudo.id_conteudo, conteudos)

                    return (
                        <li key={conteudo.id_conteudo} className={styles.item}>
                            <div className={styles.linha}>
                                <span className={styles.nome}>{conteudo.nome}</span>
                                {faixa === "dominado" && <SeloStatus texto="Dominado" cor="verde" />}
                                {faixa === "com_dificuldade" && <SeloStatus texto="Com dificuldade" cor="vermelho" />}
                                <span className={styles.media}>{formatarNota(conteudo.media)}</span>
                            </div>

                            {/* Barra só visual: a média já está escrita ao lado */}
                            <div className={styles.trilho} aria-hidden="true">
                                <div
                                className={faixa === "com_dificuldade" ? `${styles.barra} ${styles.barraBaixa}` : styles.barra}
                                style={{ width: `${Math.min(Math.max(conteudo.media, 0), 10) * 10}%` }}
                                />
                            </div>
                        </li>
                    )
                })}
            </ul>
        </Card>
    )
}
