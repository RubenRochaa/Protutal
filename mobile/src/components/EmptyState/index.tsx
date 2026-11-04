import React from "react";
import { View, Text, Image, StyleSheet, ImageSourcePropType } from "react-native";

import { MASCOTES } from "../../lib/mascotes";
import { colors, fonts, spacing } from "../../styles/theme";

interface EmptyStateProps {
    title: string;
    description?: string;
    // Imagem do mascote (padrão: o de áreas vazias, como no site)
    image?: ImageSourcePropType;
}

// Lista ou área sem dados: mascote do Protutal com uma mensagem
export function EmptyState({ title, description, image = MASCOTES.areasVazias }: EmptyStateProps){
    return (
        <View style={styles.container}>
            <Image source={image} style={styles.mascote} resizeMode="contain" accessibilityIgnoresInvertColors />

            <Text style={styles.titulo}>{title}</Text>
            {description && <Text style={styles.descricao}>{description}</Text>}
        </View>
    )
}

const styles = StyleSheet.create({
    container:{
        alignItems: "center",
        gap: spacing.sm,
        paddingVertical: spacing.xxl,
        paddingHorizontal: spacing.lg
    },
    mascote:{
        width: 140,
        height: 140
    },
    titulo:{
        fontFamily: fonts.semibold,
        fontSize: 16,
        color: colors.black,
        textAlign: "center"
    },
    descricao:{
        fontFamily: fonts.regular,
        fontSize: 14,
        color: colors.gray700,
        textAlign: "center"
    }
})
