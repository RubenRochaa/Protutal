import React, { ReactNode } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";

import { colors, fonts, fontSizes, radius, shadows, spacing } from "../../styles/theme";

interface CardResumoProps {
    icone: React.ComponentProps<typeof Feather>["name"];
    titulo: string;
    subtitulo?: string;
    onPress: () => void;
    children?: ReactNode;
}

// Card das telas de Início (aluno e tutor) no layout do Figma:
// ícone, título, resumo e a seta para a tela completa
export function CardResumo({ icone, titulo, subtitulo, onPress, children }: CardResumoProps){
    return (
        <View style={styles.card}>
            <TouchableOpacity style={styles.cabecalho} onPress={onPress} accessibilityRole="button" accessibilityLabel={`${titulo}. ${subtitulo ?? ""}`}>
                <View style={styles.icone}>
                    <Feather name={icone} size={24} color={colors.white} />
                </View>

                <View style={styles.dados}>
                    <Text style={styles.titulo}>{titulo}</Text>
                    {subtitulo && <Text style={styles.subtitulo}>{subtitulo}</Text>}
                </View>

                <Feather name="chevron-right" size={22} color={colors.gray700} />
            </TouchableOpacity>

            {children}
        </View>
    )
}

const styles = StyleSheet.create({
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
    titulo:{
        fontFamily: fonts.semibold,
        fontSize: fontSizes.tituloCard,
        color: colors.black
    },
    subtitulo:{
        fontFamily: fonts.regular,
        fontSize: 14,
        color: colors.gray700
    }
})
