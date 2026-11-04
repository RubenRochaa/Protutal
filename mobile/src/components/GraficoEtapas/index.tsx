import React from "react";
import { View, StyleSheet } from "react-native";
import Svg, { Line, Circle, Text as SvgText, G } from "react-native-svg";

import { MediaEtapa } from "../../lib/types";
import { colors, fonts } from "../../styles/theme";

interface GraficoEtapasProps {
    // As 3 etapas da rota A6; media null = etapa ainda sem nota
    etapas: Pick<MediaEtapa, "etapa" | "media">[];
}

// Mesmas medidas do GraficoEtapas do site (o SVG estica junto com a tela pelo viewBox)
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

// Gráfico de linha das médias por etapa, desenhado com react-native-svg (sem biblioteca de gráfico).
// Etapa sem nota não ganha ponto, e a linha só liga etapas vizinhas que têm nota
export function GraficoEtapas({ etapas }: GraficoEtapasProps){
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
        <View style={styles.quadro} accessible accessibilityRole="image" accessibilityLabel={`Média por etapa. ${descricao}`}>
            <Svg width="100%" height={ALTURA} viewBox={`0 0 ${LARGURA} ${ALTURA}`}>
                {/* Linhas de referência: notas 0, 5 e 10 */}
                {[0, 5, 10].map((nota) => (
                    <G key={nota}>
                        <Line x1={24} x2={LARGURA - 8} y1={posicaoY(nota)} y2={posicaoY(nota)} stroke={colors.gray300} strokeWidth={1} />
                        <SvgText x={18} y={posicaoY(nota) + 4} fontSize={10} fill={colors.gray700} textAnchor="end" fontFamily={fonts.regular}>
                            {nota}
                        </SvgText>
                    </G>
                ))}

                {pontos.slice(1).map((p, i) => {
                    const anterior = pontos[i]
                    if(anterior.y === null || p.y === null) return null

                    return <Line key={p.etapa} x1={anterior.x} y1={anterior.y} x2={p.x} y2={p.y} stroke={colors.red700} strokeWidth={2.5} />
                })}

                {pontos.map((p) => (
                    <G key={p.etapa}>
                        {p.y !== null && p.media !== null && (
                            <>
                                <Circle cx={p.x} cy={p.y} r={5} fill={colors.red700} />
                                <SvgText x={p.x} y={p.y - 12} fontSize={12} fill={colors.black} textAnchor="middle" fontFamily={fonts.semibold}>
                                    {formatarMedia(p.media)}
                                </SvgText>
                            </>
                        )}

                        <SvgText x={p.x} y={BASE + 20} fontSize={11} fill={colors.gray700} textAnchor="middle" fontFamily={fonts.medium}>
                            {`${p.etapa}ª etapa`}
                        </SvgText>

                        {p.media === null && (
                            <SvgText x={p.x} y={BASE + 34} fontSize={10} fill={colors.gray500} textAnchor="middle" fontFamily={fonts.regular}>
                                sem nota
                            </SvgText>
                        )}
                    </G>
                ))}
            </Svg>
        </View>
    )
}

const styles = StyleSheet.create({
    quadro:{
        width: "100%"
    }
})
