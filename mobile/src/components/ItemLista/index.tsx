import React, { ReactNode, useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";

import { useTema, type TemaAtual } from "../../lib/useTema";
import { fonts, radius, shadows, spacing } from "../../styles/theme";

interface ItemListaProps {
    titulo: string;
    // Linhas de baixo (ex.: "2ª série · 2026")
    detalhes?: (string | null | undefined | false)[];
    // Selos, botões ou outro conteúdo embaixo das linhas
    children?: ReactNode;
    // Com onPress o item inteiro é tocável e mostra a seta
    onPress?: () => void;
    accessibilityLabel?: string;
}

// Item de lista (ListItem do site): título, linhas de detalhe e a seta quando abre outra tela
export function ItemLista({ titulo, detalhes = [], children, onPress, accessibilityLabel }: ItemListaProps){
    const temaAtual = useTema();
    const styles = useMemo(() => makeStyles(temaAtual), [temaAtual]);
    const { colors } = temaAtual;
    const conteudo = (
        <>
            <View style={styles.dados}>
                <Text style={styles.titulo}>{titulo}</Text>
                {detalhes.filter(Boolean).map((linha, i) => (
                    <Text key={i} style={styles.detalhe}>{linha}</Text>
                ))}
                {children}
            </View>

            {onPress && <Feather name="chevron-right" size={22} color={colors.gray700} />}
        </>
    );

    if(onPress){
        return (
            <TouchableOpacity
            style={styles.item}
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel ?? titulo}
            >
                {conteudo}
            </TouchableOpacity>
        )
    }

    return <View style={styles.item}>{conteudo}</View>;
}

const makeStyles = ({ colors, fontSizes, fs }: TemaAtual) => StyleSheet.create({
    item:{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: colors.gray300,
        borderRadius: radius.cardSm,
        backgroundColor: colors.white,
        ...shadows.cardLeve
    },
    dados:{
        flex: 1,
        gap: spacing.xs
    },
    titulo:{
        fontFamily: fonts.semibold,
        fontSize: fontSizes.base,
        color: colors.black
    },
    detalhe:{
        fontFamily: fonts.regular,
        fontSize: fs(13),
        color: colors.gray700
    }
})
