import React, { useMemo } from "react";
import { View, Text, Image, StyleSheet } from "react-native";

import { Button } from "../Button";
import { MASCOTES } from "../../lib/mascotes";
import { useTema, type TemaAtual } from "../../lib/useTema";
import { fonts, spacing } from "../../styles/theme";

interface ErrorStateProps {
    message: string;
    onRetry: () => void;
}

// Falha ao carregar (sem conexão, erro 500...): mascote, a mensagem e "Tentar novamente".
// O toast com o mesmo erro já foi mostrado pelo useBuscar
export function ErrorState({ message, onRetry }: ErrorStateProps){
    const temaAtual = useTema();
    const styles = useMemo(() => makeStyles(temaAtual), [temaAtual]);
    return (
        <View style={styles.container}>
            <Image source={MASCOTES.badRequest} style={styles.mascote} resizeMode="contain" accessibilityIgnoresInvertColors />

            <Text style={styles.mensagem}>{message}</Text>

            <Button title="Tentar novamente" variant="secundario" onPress={onRetry} style={styles.botao} />
        </View>
    )
}

const makeStyles = ({ colors, fs }: TemaAtual) => StyleSheet.create({
    container:{
        alignItems: "center",
        gap: spacing.md,
        paddingVertical: spacing.xxl,
        paddingHorizontal: spacing.lg
    },
    mascote:{
        width: 140,
        height: 140
    },
    mensagem:{
        fontFamily: fonts.medium,
        fontSize: fs(15),
        color: colors.black,
        textAlign: "center"
    },
    botao:{
        width: 200
    }
})
