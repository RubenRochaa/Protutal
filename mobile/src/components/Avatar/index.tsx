import React from "react";
import { View, Text, StyleSheet } from "react-native";

import { iniciais } from "../../lib/formatacao";
import { colors, fonts } from "../../styles/theme";

interface AvatarProps {
    nome: string;
    tamanho?: "normal" | "grande";
}

// Círculo com as iniciais do nome, como o AvatarIniciais do site (a API não tem foto)
export function Avatar({ nome, tamanho = "normal" }: AvatarProps){
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

const styles = StyleSheet.create({
    circulo:{
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.red700
    },
    grande:{
        width: 64,
        height: 64,
        borderRadius: 32
    },
    texto:{
        fontFamily: fonts.semibold,
        fontSize: 15,
        color: colors.white
    },
    textoGrande:{
        fontSize: 22
    }
})
