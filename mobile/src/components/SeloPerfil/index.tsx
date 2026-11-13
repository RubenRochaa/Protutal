import React, { useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { useTema, type TemaAtual } from "../../lib/useTema";
import { fonts, radius, sizes, spacing } from "../../styles/theme";

interface SeloPerfilProps {
    rotulo: "Professor" | "Aluno" | "Tutor";
    // Só para quem é tutor: troca entre a área do aluno e a do tutor
    onTrocar?: () => void;
    // Bolinha no ícone de troca: pedido de tutoria aceito e a área do tutor ainda não foi aberta
    bolinha?: boolean;
}

// Selo do tipo de conta, igual ao do Header do site: só informa, não é clicável.
// Para o tutor, o ícone de troca ao lado leva para a outra área.
export function SeloPerfil({ rotulo, onTrocar, bolinha = false }: SeloPerfilProps){
    const temaAtual = useTema();
    const styles = useMemo(() => makeStyles(temaAtual), [temaAtual]);
    const { colors } = temaAtual;
    const tituloTroca = rotulo === "Aluno" ? "Ir para a área do tutor" : "Ir para a área do aluno";

    return (
        <View style={styles.container}>
            {/* Fonte limitada: com o nível máximo o selo não pode empurrar os ícones do Header para fora */}
            <Text style={styles.selo} numberOfLines={1} maxFontSizeMultiplier={1.2}>{rotulo}</Text>

            {onTrocar && (
                <TouchableOpacity
                onPress={onTrocar}
                style={styles.troca}
                accessibilityRole="button"
                accessibilityLabel={tituloTroca}
                accessibilityHint={bolinha ? "Pedido de tutoria aceito" : undefined}
                hitSlop={8}
                >
                    <MaterialCommunityIcons name="swap-horizontal" size={22} color={colors.textoSobreDestaque} />
                    {/* Sem número, no estilo "claro" do Contador (o Header é vermelho) */}
                    {bolinha && <View style={styles.bolinha} pointerEvents="none" />}
                </TouchableOpacity>
            )}
        </View>
    )
}

const makeStyles = ({ colors, fontSizes }: TemaAtual) => StyleSheet.create({
    container:{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.xs
    },
    // No fundo vermelho do Header o selo fica branco com texto vermelho
    // Um pouco menor que o do site (largura mínima e laterais) para a linha de cima caber em 360 px
    selo:{
        minWidth: 56,
        minHeight: sizes.alturaSelo,
        lineHeight: sizes.alturaSelo,
        paddingHorizontal: 6,
        borderRadius: radius.pill,
        overflow: "hidden",
        backgroundColor: colors.white,
        color: colors.red700,
        fontFamily: fonts.medium,
        fontSize: Math.min(fontSizes.selo, 14),
        textAlign: "center"
    },
    // Mesma caixa dos ícones do Header: 28 px + hitSlop de 8 px = área de toque de 44 px
    troca:{
        width: 28,
        height: 28,
        alignItems: "center",
        justifyContent: "center"
    },
    bolinha:{
        position: "absolute",
        top: -2,
        right: -2,
        width: 10,
        height: 10,
        borderRadius: radius.pill,
        borderWidth: 1.5,
        borderColor: colors.red700,
        backgroundColor: colors.white
    }
})
