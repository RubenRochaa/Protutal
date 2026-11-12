import React, { useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";

import { useTema, type TemaAtual } from "../../lib/useTema";
import { fonts, radius, shadows, spacing } from "../../styles/theme";

export type ToastType = "sucesso" | "erro";

interface ToastProps {
    type: ToastType;
    message: string;
    onClose: () => void;
}

// Aviso que aparece no topo da tela, no lugar do toast (sonner) do site.
// A posição e a animação ficam no ToastHost (contexts/ToastContext).
// Verde para sucesso, vermelho para erro, com botão de fechar.
export function Toast({ type, message, onClose }: ToastProps){
    const temaAtual = useTema();
    const styles = useMemo(() => makeStyles(temaAtual), [temaAtual]);
    const { colors } = temaAtual;
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
            color={sucesso ? colors.toast.sucessoTexto : colors.toast.erroTexto}
            />

            <Text style={styles.texto}>{message}</Text>

            <TouchableOpacity onPress={onClose} accessibilityRole="button" accessibilityLabel="Fechar aviso" hitSlop={12}>
                <Feather name="x" size={18} color={colors.gray700} />
            </TouchableOpacity>
        </View>
    )
}

const makeStyles = ({ colors, fs }: TemaAtual) => StyleSheet.create({
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
        borderColor: colors.toast.sucessoBorda,
        backgroundColor: colors.toast.sucessoFundo
    },
    erro:{
        borderColor: colors.toast.erroBorda,
        backgroundColor: colors.toast.erroFundo
    },
    texto:{
        flex: 1,
        fontFamily: fonts.medium,
        fontSize: fs(14),
        color: colors.black
    }
})
