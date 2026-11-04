import React, { useEffect, useRef } from "react";
import { View, Animated, Easing, StyleSheet } from "react-native";

import { colors } from "../../styles/theme";

interface LoaderProps {
    // "pequeno" = dentro de botões; "medio" = seções e cards; "grande" = tela inteira
    size?: "pequeno" | "medio" | "grande";
    // "vermelho" = sobre fundo claro; "branco" = sobre fundo vermelho
    variant?: "vermelho" | "branco";
}

const MEDIDAS = {
    pequeno: { tamanho: 16, borda: 2 },
    medio: { tamanho: 32, borda: 3 },
    grande: { tamanho: 48, borda: 4 },
}

// Anel de carregamento igual ao do site: trilha bem clara e o arco de cima girando.
export function Loader({ size = "medio", variant = "vermelho" }: LoaderProps){
    const giro = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const animacao = Animated.loop(
            Animated.timing(giro, {
                toValue: 1,
                duration: 800,
                easing: Easing.linear,
                useNativeDriver: true
            })
        );

        animacao.start();
        return () => animacao.stop();
    }, [giro]);

    const { tamanho, borda } = MEDIDAS[size];
    const cor = variant === "branco" ? colors.white : colors.red700;
    const rotate = giro.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });

    const anel = {
        width: tamanho,
        height: tamanho,
        borderRadius: tamanho / 2,
        borderWidth: borda,
    }

    return (
        <View style={{ width: tamanho, height: tamanho }} accessibilityRole="progressbar" accessibilityLabel="Carregando">
            {/* Trilha */}
            <View style={[styles.anel, anel, { borderColor: cor, opacity: 0.25 }]} />

            {/* Arco */}
            <Animated.View
            style={[
                styles.anel,
                anel,
                { borderColor: "transparent", borderTopColor: cor, transform: [{ rotate }] }
            ]}
            />
        </View>
    )
}

const styles = StyleSheet.create({
    anel:{
        position: "absolute",
        top: 0,
        left: 0
    }
})
