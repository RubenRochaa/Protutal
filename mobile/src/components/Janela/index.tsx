import React, { ReactNode, useMemo } from "react";
import { View, Text, StyleSheet, Modal, Pressable, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";

import { EvitarTeclado, RolagemTeclado } from "../EvitarTeclado";
import { ToastHost } from "../../contexts/ToastContext";
import { useTema, type TemaAtual } from "../../lib/useTema";
import { fonts, radius, spacing } from "../../styles/theme";

interface JanelaProps {
    visivel: boolean;
    titulo: string;
    onClose: () => void;
    children: ReactNode;
    // Toque na parte escura de fora fecha a janela (usado no painel de Acessibilidade)
    fecharAoTocarFora?: boolean;
}

// Janela que sobe de baixo (o Modal do site), com título, botão de fechar e rolagem.
// Mesma moldura do ModalResolverContestacao; o EvitarTeclado mantém os campos visíveis
export function Janela({ visivel, titulo, onClose, children, fecharAoTocarFora = false }: JanelaProps){
    const temaAtual = useTema();
    const styles = useMemo(() => makeStyles(temaAtual), [temaAtual]);
    const { colors } = temaAtual;
    return (
        <Modal visible={visivel} animationType="slide" transparent onRequestClose={onClose}>
            <EvitarTeclado style={styles.fundo}>
                {fecharAoTocarFora && (
                    <Pressable
                    style={StyleSheet.absoluteFill}
                    onPress={onClose}
                    accessibilityRole="button"
                    accessibilityLabel="Fechar"
                    />
                )}

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
            <ToastHost ativo={visivel} />
        </Modal>
    )
}

const makeStyles = ({ colors, fontSizes }: TemaAtual) => StyleSheet.create({
    fundo:{
        flex: 1,
        justifyContent: "flex-end",
        backgroundColor: colors.overlay
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
