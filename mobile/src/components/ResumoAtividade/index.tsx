import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";

import { useTema, type TemaAtual } from "../../lib/useTema";
import { fonts, radius, shadows, spacing } from "../../styles/theme";

interface ResumoAtividadeProps {
    titulo: string;
    // Ex.: "Relevo · 1ª etapa · Prova dissertativa"
    detalhe: string;
}

// Card do topo das telas de envio de resposta e de contestação (Figma):
// ícone de documento, "Atividade: título" e a linha de detalhe
export function ResumoAtividade({ titulo, detalhe }: ResumoAtividadeProps){
    const temaAtual = useTema();
    const styles = useMemo(() => makeStyles(temaAtual), [temaAtual]);
    const { colors } = temaAtual;
    return (
        <View style={styles.card}>
            <View style={styles.icone}>
                <Feather name="file-text" size={24} color={colors.textoSobreDestaque} />
            </View>

            <View style={styles.dados}>
                <Text style={styles.titulo} accessibilityRole="header">
                    <Text style={styles.rotulo}>Atividade: </Text>
                    {titulo}
                </Text>
                <Text style={styles.detalhe}>{detalhe}</Text>
            </View>
        </View>
    )
}

const makeStyles = ({ colors, fontSizes }: TemaAtual) => StyleSheet.create({
    card:{
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
    icone:{
        width: 48,
        height: 48,
        borderRadius: 24,
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
        fontSize: fontSizes.base,
        color: colors.black
    },
    rotulo:{
        color: colors.red700
    },
    detalhe:{
        fontFamily: fonts.regular,
        fontSize: fontSizes.rotulo,
        color: colors.gray700
    }
})
