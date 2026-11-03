import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { colors, fonts, fontSizes, radius, sizes, spacing } from "../../styles/theme";

interface SeloPerfilProps {
    rotulo: "Professor" | "Aluno" | "Tutor";
    // Só para quem é tutor: troca entre a área do aluno e a do tutor
    onTrocar?: () => void;
}

// Selo do tipo de conta, igual ao do Header do site: só informa, não é clicável.
// Para o tutor, o ícone de troca ao lado leva para a outra área.
export function SeloPerfil({ rotulo, onTrocar }: SeloPerfilProps){
    const tituloTroca = rotulo === "Aluno" ? "Ir para a área do tutor" : "Ir para a área do aluno";

    return (
        <View style={styles.container}>
            <Text style={styles.selo} numberOfLines={1}>{rotulo}</Text>

            {onTrocar && (
                <TouchableOpacity
                onPress={onTrocar}
                style={styles.troca}
                accessibilityRole="button"
                accessibilityLabel={tituloTroca}
                hitSlop={8}
                >
                    <MaterialCommunityIcons name="swap-horizontal" size={22} color={colors.white} />
                </TouchableOpacity>
            )}
        </View>
    )
}

const styles = StyleSheet.create({
    container:{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.xs
    },
    // No fundo vermelho do Header o selo fica branco com texto vermelho
    selo:{
        minWidth: sizes.larguraSelo,
        height: sizes.alturaSelo,
        lineHeight: sizes.alturaSelo,
        paddingHorizontal: 10,
        borderRadius: radius.pill,
        overflow: "hidden",
        backgroundColor: colors.white,
        color: colors.red700,
        fontFamily: fonts.medium,
        fontSize: fontSizes.selo,
        textAlign: "center"
    },
    troca:{
        padding: 2
    }
})
