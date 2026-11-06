import React, { ReactNode } from "react";
import { View, Text, StyleSheet, Modal, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";

import { EvitarTeclado, RolagemTeclado } from "../EvitarTeclado";
import { ToastHost } from "../../contexts/ToastContext";
import { colors, fonts, fontSizes, radius, spacing } from "../../styles/theme";

interface JanelaProps {
    visivel: boolean;
    titulo: string;
    onClose: () => void;
    children: ReactNode;
}

// Janela que sobe de baixo (o Modal do site), com título, botão de fechar e rolagem.
// Mesma moldura do ModalResolverContestacao; o EvitarTeclado mantém os campos visíveis
export function Janela({ visivel, titulo, onClose, children }: JanelaProps){
    return (
        <Modal visible={visivel} animationType="slide" transparent onRequestClose={onClose}>
            <EvitarTeclado style={styles.fundo}>
                <View style={styles.janela}>
                    <View style={styles.cabecalho}>
                        <Text style={styles.titulo} accessibilityRole="header">{titulo}</Text>
                        <TouchableOpacity onPress={onClose} accessibilityRole="button" accessibilityLabel="Fechar" hitSlop={10}>
                            <Feather name="x" size={24} color={colors.gray700} />
                        </TouchableOpacity>
                    </View>

                    <RolagemTeclado contentContainerStyle={styles.conteudo}>
                        {children}
                    </RolagemTeclado>
                </View>
            </EvitarTeclado>

            {/* Avisos dentro da janela do Modal, para aparecerem por cima dela */}
            <ToastHost />
        </Modal>
    )
}

const styles = StyleSheet.create({
    fundo:{
        flex: 1,
        justifyContent: "flex-end",
        backgroundColor: "rgba(0,0,0,0.4)"
    },
    janela:{
        maxHeight: "90%",
        borderTopLeftRadius: radius.card,
        borderTopRightRadius: radius.card,
        backgroundColor: colors.white
    },
    cabecalho:{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: spacing.md,
        padding: spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: colors.gray300
    },
    titulo:{
        flex: 1,
        fontFamily: fonts.semibold,
        fontSize: fontSizes.tituloCard,
        color: colors.red700
    },
    conteudo:{
        gap: spacing.md,
        padding: spacing.lg,
        paddingBottom: spacing.xxl
    }
})
