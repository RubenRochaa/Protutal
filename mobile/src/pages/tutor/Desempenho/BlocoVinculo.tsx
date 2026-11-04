import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Linking } from "react-native";
import { Feather } from "@expo/vector-icons";

import { Card } from "../../../components/Card";
import { Badge } from "../../../components/Badge";
import { GraficoEtapas } from "../../../components/GraficoEtapas";
import { formatarData, formatarNota } from "../../../lib/formatacao";
import { DesempenhoVinculo } from "../../../lib/types";
import { colors, fonts, fontSizes, radius, spacing } from "../../../styles/theme";

interface BlocoVinculoProps {
    vinculo: DesempenhoVinculo;
}

interface IndicadorProps {
    rotulo: string;
    valor: string;
}

function Indicador({ rotulo, valor }: IndicadorProps){
    return (
        <View style={styles.indicador}>
            <Text style={styles.rotuloIndicador}>{rotulo}</Text>
            <Text style={styles.valorIndicador}>{valor}</Text>
        </View>
    )
}

// Bloco de uma sala (vínculo de tutor) no Meu desempenho, como o blocoVinculo do site:
// os dois indicadores lado a lado (feedback dos alunos e avaliação do professor),
// o gráfico do feedback por etapa e as listas de avaliações e feedbacks
export function BlocoVinculo({ vinculo }: BlocoVinculoProps){
    const { feedback, avaliacoes_professor: avaliacoes } = vinculo;

    return (
        <Card title={`Sala ${vinculo.sala.nome} · ${vinculo.sala.ano_letivo}`}>
            {vinculo.revogado && vinculo.data_revogacao && (
                <View style={styles.selo}>
                    <Badge label={`Revogado em ${formatarData(vinculo.data_revogacao)}`} />
                </View>
            )}

            <View style={styles.indicadores}>
                <Indicador
                rotulo="Média dos feedbacks dos alunos"
                valor={feedback.media_geral === null ? "Sem feedback" : formatarNota(feedback.media_geral)}
                />
                <Indicador rotulo="Feedbacks recebidos" valor={String(feedback.quantidade)} />
            </View>

            <View style={styles.indicadores}>
                <Indicador
                rotulo="Média das avaliações do professor"
                valor={avaliacoes.media_geral === null ? "Sem avaliação" : formatarNota(avaliacoes.media_geral)}
                />
                <Indicador rotulo="Avaliações do professor" valor={String(avaliacoes.quantidade)} />
            </View>

            <Text style={styles.subtitulo}>Feedback dos alunos por etapa</Text>
            <GraficoEtapas etapas={feedback.por_etapa} />

            <Text style={styles.subtitulo}>Avaliações do professor</Text>
            {avaliacoes.avaliacoes.length === 0 && (
                <Text style={styles.textoSecundario}>O professor ainda não avaliou você nesta sala.</Text>
            )}
            {avaliacoes.avaliacoes.map((avaliacao) => (
                <View key={avaliacao.id_avaliacao} style={styles.item}>
                    <View style={styles.linha}>
                        <Text style={styles.nome}>Prof. {avaliacao.professor.nome}</Text>
                        <Text style={styles.nota}>{formatarNota(avaliacao.nota)}</Text>
                    </View>
                    <Text style={styles.textoSecundario}>{formatarData(avaliacao.data)}</Text>
                    <Text style={styles.texto}>{avaliacao.comentario}</Text>
                </View>
            ))}

            <Text style={styles.subtitulo}>Feedbacks dos alunos</Text>
            {feedback.feedbacks.length === 0 && (
                <Text style={styles.textoSecundario}>Nenhum feedback dos alunos nesta sala.</Text>
            )}
            {feedback.feedbacks.map((item) => (
                <View key={item.id_feedback} style={styles.item}>
                    <View style={styles.linha}>
                        <Text style={styles.nome}>{item.aluno.nome}</Text>
                        <Text style={styles.nota}>{formatarNota(item.nota)}</Text>
                    </View>
                    <Text style={styles.textoSecundario}>{item.etapa}ª etapa · {formatarData(item.data)}</Text>
                    {item.comentario && <Text style={styles.texto}>{item.comentario}</Text>}

                    {item.rubrica_file && (
                        <TouchableOpacity style={styles.link} onPress={() => Linking.openURL(item.rubrica_file!)} accessibilityRole="link">
                            <Feather name="file-text" size={16} color={colors.red700} />
                            <Text style={styles.textoLink}>Abrir rubrica</Text>
                        </TouchableOpacity>
                    )}
                </View>
            ))}
        </Card>
    )
}

const styles = StyleSheet.create({
    selo:{
        alignItems: "flex-start"
    },
    indicadores:{
        flexDirection: "row",
        gap: spacing.md
    },
    indicador:{
        flex: 1,
        alignItems: "center",
        justifyContent: "space-between",
        gap: spacing.xs,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: colors.gray300,
        borderRadius: radius.cardSm,
        backgroundColor: colors.gray100
    },
    rotuloIndicador:{
        fontFamily: fonts.medium,
        fontSize: fontSizes.selo,
        color: colors.gray700,
        textAlign: "center"
    },
    valorIndicador:{
        fontFamily: fonts.bold,
        fontSize: fontSizes.destaque,
        color: colors.black,
        textAlign: "center"
    },
    subtitulo:{
        marginTop: spacing.sm,
        fontFamily: fonts.semibold,
        fontSize: fontSizes.base,
        color: colors.black
    },
    item:{
        gap: 2,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: colors.gray300,
        borderRadius: radius.item
    },
    linha:{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: spacing.sm
    },
    nome:{
        flex: 1,
        fontFamily: fonts.semibold,
        fontSize: 14,
        color: colors.black
    },
    nota:{
        fontFamily: fonts.bold,
        fontSize: fontSizes.base,
        color: colors.red700
    },
    texto:{
        fontFamily: fonts.regular,
        fontSize: 14,
        color: colors.black
    },
    textoSecundario:{
        fontFamily: fonts.regular,
        fontSize: 13,
        color: colors.gray700
    },
    link:{
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "flex-start",
        gap: spacing.xs,
        marginTop: spacing.xs
    },
    textoLink:{
        fontFamily: fonts.medium,
        fontSize: 14,
        color: colors.red700
    }
})
