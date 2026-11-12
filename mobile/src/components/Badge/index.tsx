import React from "react";
import { Text, StyleSheet } from "react-native";

import { colors, fonts, fontSizes, radius } from "../../styles/theme";

interface BadgeProps {
    label: string;
    // Mesmas variantes da Etiqueta do site
    variant?: "neutro" | "destaque" | "sucesso";
}

// Etiqueta de status em formato de pílula (ex.: "Ativa", "Finalizada", "Pendente")
export function Badge({ label, variant = "neutro" }: BadgeProps){
    return (
        <Text style={[styles.badge, styles[variant]]} numberOfLines={1}>
            {label}
        </Text>
    )
}

const styles = StyleSheet.create({
    badge:{
        alignSelf: "flex-start",
        paddingVertical: 2,
        paddingHorizontal: 10,
        borderRadius: radius.pill,
        overflow: "hidden",
        fontFamily: fonts.medium,
        fontSize: fontSizes.selo
    },
    neutro:{
        backgroundColor: colors.gray300,
        color: colors.gray700
    },
    destaque:{
        backgroundColor: colors.red700,
        color: colors.white
    },
    sucesso:{
        backgroundColor: colors.green500,
        color: colors.black
    }
})
