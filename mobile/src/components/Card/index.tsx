import React, { ReactNode, useMemo } from "react";
import { View, Text, StyleSheet, ViewStyle, StyleProp, TouchableOpacity } from "react-native";

import { useTema, type TemaAtual } from "../../lib/useTema";
import { fonts, radius, shadows, spacing } from "../../styles/theme";

interface CardProps {
    title?: string;
    // Link do cabeçalho do card (ex.: "Ver todas")
    action?: {
        label: string;
        onPress: () => void;
    };
    children: ReactNode;
    style?: StyleProp<ViewStyle>;
}

// Card do site: borda cinza, raio 12, sombra leve e título vermelho com linha embaixo
export function Card({ title, action, children, style }: CardProps){
    const temaAtual = useTema();
    const styles = useMemo(() => makeStyles(temaAtual), [temaAtual]);
    return (
        <View style={[styles.card, style]}>
            {(title || action) && (
                <View style={styles.cabecalho}>
                    {title && <Text style={styles.titulo} accessibilityRole="header">{title}</Text>}

                    {action && (
                        <TouchableOpacity onPress={action.onPress} hitSlop={8}>
                            <Text style={styles.acao}>{action.label}</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}

            {children}
        </View>
    )
}

const makeStyles = ({ colors, fontSizes }: TemaAtual) => StyleSheet.create({
    card:{
        gap: spacing.md,
        paddingTop: spacing.lg,
        paddingHorizontal: spacing.xl,
        paddingBottom: spacing.xl,
        borderWidth: 1,
        borderColor: colors.gray300,
        borderRadius: radius.cardSm,
        backgroundColor: colors.white,
        ...shadows.cardLeve
    },
    cabecalho:{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: spacing.md,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: colors.gray300
    },
    titulo:{
        flex: 1,
        fontFamily: fonts.semibold,
        fontSize: fontSizes.tituloCard,
        color: colors.red700
    },
    acao:{
        fontFamily: fonts.medium,
        fontSize: fontSizes.acaoCard,
        color: colors.red700
    }
})
