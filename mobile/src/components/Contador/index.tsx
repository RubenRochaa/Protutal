import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";

import { useTema, type TemaAtual } from "../../lib/useTema";
import { fonts, radius } from "../../styles/theme";

interface ContadorProps {
    valor?: number;
    // "canto": em cima, à direita do ícone (o pai precisa envolver só o ícone). Sem isso, fica ao lado do texto
    canto?: boolean;
    // "claro": fundo branco e número vermelho, para ficar visível sobre vermelho (Header, botão primário)
    claro?: boolean;
}

// Texto da bolinha: acima de 9 mostra "9+" (também usado no tabBarBadge das abas)
export function textoContador(valor: number){
    return valor > 9 ? "9+" : String(valor);
}

// Texto lido pelo leitor de tela (ex.: "3 novidades")
export function descricaoContador(valor: number){
    return valor === 1 ? "1 novidade" : `${valor} novidades`;
}

// Bolinha vermelha com número, igual ao Contador do site. Com 0 (ou sem valor) não aparece
export function Contador({ valor, canto = false, claro = false }: ContadorProps){
    const temaAtual = useTema();
    const styles = useMemo(() => makeStyles(temaAtual), [temaAtual]);
    if(!valor || valor <= 0) return null;

    return (
        <View
        style={[styles.contador, canto && styles.canto, claro && styles.claro]}
        accessible
        accessibilityLabel={descricaoContador(valor)}
        pointerEvents="none"
        >
            <Text style={[styles.texto, claro && styles.textoClaro]}>{textoContador(valor)}</Text>
        </View>
    )
}

const makeStyles = ({ colors, fs }: TemaAtual) => StyleSheet.create({
    contador:{
        minWidth: 18,
        minHeight: 18,
        paddingHorizontal: 5,
        borderRadius: radius.pill,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.destaque
    },
    // Em cima do ícone: o contorno separa a bolinha do traço do ícone
    canto:{
        position: "absolute",
        top: -6,
        right: -8,
        borderWidth: 1.5,
        borderColor: colors.red700
    },
    claro:{
        backgroundColor: colors.white
    },
    texto:{
        fontFamily: fonts.bold,
        fontSize: fs(10),
        lineHeight: fs(13),
        color: colors.textoSobreDestaque,
        includeFontPadding: false
    },
    textoClaro:{
        color: colors.red700
    }
})
