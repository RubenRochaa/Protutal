import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";

import { IconeStatus } from "../IconeStatus";
import { useTema, type TemaAtual } from "../../lib/useTema";
import { fonts, radius } from "../../styles/theme";

interface BadgeProps {
    label: string;
    // Mesmas variantes da Etiqueta do site
    variant?: "neutro" | "destaque" | "sucesso";
}

// Etiqueta de status em formato de pílula (ex.: "Ativa", "Finalizada", "Pendente").
// No modo daltônico ganha um ícone ao lado do texto
export function Badge({ label, variant = "neutro" }: BadgeProps){
    const temaAtual = useTema();
    const styles = useMemo(() => makeStyles(temaAtual), [temaAtual]);

    return (
        <View style={[styles.badge, styles[variant]]}>
            <IconeStatus texto={label} color={styles.texto[variant].color} size={temaAtual.fs(13)} />
            <Text style={[styles.rotulo, { color: styles.texto[variant].color }]} numberOfLines={1}>
                {label}
            </Text>
        </View>
    )
}

const makeStyles = ({ colors, fontSizes }: TemaAtual) => ({
    ...StyleSheet.create({
        badge:{
            alignSelf: "flex-start",
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
            paddingVertical: 2,
            paddingHorizontal: 10,
            borderRadius: radius.pill,
            overflow: "hidden"
        },
        rotulo:{
            fontFamily: fonts.medium,
            fontSize: fontSizes.selo
        },
        neutro:{
            backgroundColor: colors.gray300
        },
        destaque:{
            backgroundColor: colors.destaque
        },
        sucesso:{
            backgroundColor: colors.sucesso
        }
    }),
    texto: {
        neutro: { color: colors.gray700 },
        destaque: { color: colors.textoSobreDestaque },
        sucesso: { color: colors.textoSobreSucesso }
    }
})
