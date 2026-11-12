import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { useTema, type TemaAtual } from "../../lib/useTema";
import { fonts } from "../../styles/theme";

interface MensagemErroProps {
    mensagem: string;
}

// Erro de formulário. No modo daltônico ganha um ícone ao lado do texto,
// para o erro não depender só da cor vermelha (como o CircleAlert do site)
export function MensagemErro({ mensagem }: MensagemErroProps){
    const temaAtual = useTema();
    const styles = useMemo(() => makeStyles(temaAtual), [temaAtual]);
    const { colors, daltonico, fs } = temaAtual;

    return (
        <View style={styles.linha} accessibilityRole="alert">
            {daltonico && (
                <MaterialCommunityIcons
                name="alert-circle-outline"
                size={fs(15)}
                color={colors.red700}
                accessibilityElementsHidden
                importantForAccessibility="no"
                />
            )}

            <Text style={styles.texto}>{mensagem}</Text>
        </View>
    )
}

const makeStyles = ({ colors, fs }: TemaAtual) => StyleSheet.create({
    linha:{
        flexDirection: "row",
        alignItems: "center",
        gap: 4
    },
    texto:{
        flexShrink: 1,
        fontFamily: fonts.regular,
        fontSize: fs(13),
        color: colors.red700
    }
})
