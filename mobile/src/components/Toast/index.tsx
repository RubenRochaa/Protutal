import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";

import { colors, fonts, radius, shadows, spacing } from "../../styles/theme";

export type ToastType = "sucesso" | "erro";

interface ToastProps {
    type: ToastType;
    message: string;
    onClose: () => void;
}

// Aviso que aparece embaixo da tela, no lugar do toast (sonner) do site.
// Verde para sucesso, vermelho para erro, com botão de fechar.
export function Toast({ type, message, onClose }: ToastProps){
    const sucesso = type === "sucesso";

    return (
        <View
        style={[styles.container, sucesso ? styles.sucesso : styles.erro]}
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
        >
            <Feather
            name={sucesso ? "check-circle" : "alert-circle"}
            size={20}
            color={sucesso ? colors.green500 : colors.red700}
            />

            <Text style={styles.texto}>{message}</Text>

            <TouchableOpacity onPress={onClose} accessibilityLabel="Fechar aviso" hitSlop={10}>
                <Feather name="x" size={18} color={colors.gray700} />
            </TouchableOpacity>
        </View>
    )
}

const styles = StyleSheet.create({
    container:{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        borderRadius: radius.item,
        borderWidth: 1,
        ...shadows.card
    },
    sucesso:{
        borderColor: colors.green500,
        backgroundColor: "#ECFDF3"
    },
    erro:{
        borderColor: colors.red700,
        backgroundColor: "#FFF0F0"
    },
    texto:{
        flex: 1,
        fontFamily: fonts.medium,
        fontSize: 14,
        color: colors.black
    }
})
