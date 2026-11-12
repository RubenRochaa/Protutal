import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";

import { iniciais } from "../../lib/formatacao";
import { useTema, type TemaAtual } from "../../lib/useTema";
import { fonts } from "../../styles/theme";

interface AvatarProps {
    nome: string;
    tamanho?: "normal" | "grande";
}

// Círculo com as iniciais do nome, como o AvatarIniciais do site (a API não tem foto)
export function Avatar({ nome, tamanho = "normal" }: AvatarProps){
    const temaAtual = useTema();
    const styles = useMemo(() => makeStyles(temaAtual), [temaAtual]);
    const grande = tamanho === "grande";

    return (
        <View
        style={[styles.circulo, grande && styles.grande]}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        >
            <Text style={[styles.texto, grande && styles.textoGrande]}>{iniciais(nome)}</Text>
        </View>
    )
}

const makeStyles = ({ colors, fs }: TemaAtual) => StyleSheet.create({
    circulo:{
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.destaque
    },
    grande:{
        width: 64,
        height: 64,
        borderRadius: 32
    },
    texto:{
        fontFamily: fonts.semibold,
        fontSize: fs(15),
        color: colors.textoSobreDestaque
    },
    textoGrande:{
        fontSize: fs(22)
    }
})
