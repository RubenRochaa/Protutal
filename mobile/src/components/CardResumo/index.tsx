import React, { ReactNode, useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";

import { Contador } from "../Contador";
import { useTema, type TemaAtual } from "../../lib/useTema";
import { fonts, radius, shadows, spacing } from "../../styles/theme";

interface CardResumoProps {
    icone: React.ComponentProps<typeof Feather>["name"];
    titulo: string;
    subtitulo?: string;
    onPress: () => void;
    children?: ReactNode;
    // Bolinha de notificação ao lado do título (ex.: contestações pendentes do tutor)
    contador?: number;
}

// Card das telas de Início (aluno e tutor) no layout do Figma:
// ícone, título, resumo e a seta para a tela completa
export function CardResumo({ icone, titulo, subtitulo, onPress, children, contador }: CardResumoProps){
    const temaAtual = useTema();
    const styles = useMemo(() => makeStyles(temaAtual), [temaAtual]);
    const { colors } = temaAtual;
    return (
        <View style={styles.card}>
            <TouchableOpacity style={styles.cabecalho} onPress={onPress} accessibilityRole="button" accessibilityLabel={`${titulo}. ${subtitulo ?? ""}`}>
                <View style={styles.icone}>
                    <Feather name={icone} size={24} color={colors.textoSobreDestaque} />
                </View>

                <View style={styles.dados}>
                    <View style={styles.linhaTitulo}>
                        <Text style={styles.titulo}>{titulo}</Text>
                        <Contador valor={contador} />
                    </View>
                    {subtitulo && <Text style={styles.subtitulo}>{subtitulo}</Text>}
                </View>

                <Feather name="chevron-right" size={22} color={colors.gray700} />
            </TouchableOpacity>

            {children}
        </View>
    )
}

const makeStyles = ({ colors, fontSizes, fs }: TemaAtual) => StyleSheet.create({
    card:{
        gap: spacing.md,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: colors.gray300,
        borderRadius: radius.card,
        backgroundColor: colors.white,
        ...shadows.cardLeve
    },
    cabecalho:{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md
    },
    icone:{
        width: 48,
        height: 48,
        borderRadius: radius.cardSm,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.gray700
    },
    dados:{
        flex: 1,
        gap: 2
    },
    linhaTitulo:{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm
    },
    titulo:{
        flexShrink: 1,
        fontFamily: fonts.semibold,
        fontSize: fontSizes.tituloCard,
        color: colors.black
    },
    subtitulo:{
        fontFamily: fonts.regular,
        fontSize: fs(14),
        color: colors.gray700
    }
})
