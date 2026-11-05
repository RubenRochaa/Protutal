import styles from './styles.module.scss'

interface Props {
    // As 3 etapas da rota A6; media null = etapa ainda sem nota
    etapas: { etapa: number; media: number | null }[];
}

// Medidas do desenho (o SVG estica junto com o card pelo viewBox)
const LARGURA = 320
const ALTURA = 190
const TOPO = 28       // espaço para o valor em cima do ponto
const BASE = 150      // linha da nota 0
const MARGEM_X = 60   // distância da 1ª e da 3ª etapa até a borda

// Nota de 0 a 10 -> altura no desenho
function posicaoY(media: number){
    return BASE - (media / 10) * (BASE - TOPO)
}

function posicaoX(indice: number, total: number){
    if(total === 1) return LARGURA / 2
    return MARGEM_X + indice * ((LARGURA - 2 * MARGEM_X) / (total - 1))
}

function formatarMedia(media: number){
    return media.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })
}

// Gráfico de linha das médias por etapa, em SVG puro (sem biblioteca).
// Etapa sem nota não ganha ponto, e a linha só liga etapas vizinhas que têm nota.
export function GraficoEtapas({ etapas }: Props){
    const pontos = etapas.map((item, i) => ({
        ...item,
        x: posicaoX(i, etapas.length),
        y: item.media === null ? null : posicaoY(item.media),
    }))

    // Descrição para leitor de tela, ex.: "1ª etapa: 7,5; 2ª etapa: sem nota; ..."
    const descricao = pontos
        .map((p) => `${p.etapa}ª etapa: ${p.media === null ? "sem nota" : formatarMedia(p.media)}`)
        .join("; ")

    return (
        <div className={styles.quadro}>
            <svg
            viewBox={`0 0 ${LARGURA} ${ALTURA}`}
            className={styles.grafico}
            role="img"
            aria-label={`Média por etapa. ${descricao}`}
            >
                {/* Linhas de referência: notas 0, 5 e 10 */}
                {[0, 5, 10].map((nota) => (
                    <g key={nota}>
                        <line x1={24} x2={LARGURA - 8} y1={posicaoY(nota)} y2={posicaoY(nota)} className={styles.guia} />
                        <text x={18} y={posicaoY(nota) + 4} className={styles.escala}>{nota}</text>
                    </g>
                ))}

                {pontos.slice(1).map((p, i) => {
                    const anterior = pontos[i]
                    if(anterior.y === null || p.y === null) return null

                    return <line key={p.etapa} x1={anterior.x} y1={anterior.y} x2={p.x} y2={p.y} className={styles.linha} />
                })}

                {pontos.map((p) => (
                    <g key={p.etapa}>
                        {p.y !== null && p.media !== null && (
                            <>
                                <circle cx={p.x} cy={p.y} r={5} className={styles.ponto} />
                                <text x={p.x} y={p.y - 12} className={styles.valor}>{formatarMedia(p.media)}</text>
                            </>
                        )}

                        <text x={p.x} y={BASE + 20} className={styles.rotulo}>{p.etapa}ª etapa</text>
                        {p.media === null && (
                            <text x={p.x} y={BASE + 34} className={styles.semNota}>sem nota</text>
                        )}
                    </g>
                ))}
            </svg>
        </div>
    )
}
