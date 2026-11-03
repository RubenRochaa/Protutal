import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";

import { Header } from "../../components/Header";
import { EmptyState } from "../../components/EmptyState";
import { MASCOTES } from "../../lib/mascotes";
import { colors, spacing } from "../../styles/theme";

interface EmConstrucaoProps {
    title: string;
    onBack?: () => void;
    onNotificacoes?: () => void;
}

// Tela PROVISÓRIA usada em todas as abas até as telas reais serem feitas
export default function EmConstrucao({ title, onBack, onNotificacoes }: EmConstrucaoProps){
    return (
        <View style={styles.container}>
            <Header title={title} onBack={onBack} onNotificacoes={onNotificacoes} />

            <ScrollView contentContainerStyle={styles.conteudo}>
                <EmptyState
                image={MASCOTES.atividades}
                title="Em construção"
                description="Esta tela será feita nas próximas partes do app."
                />
            </ScrollView>
        </View>
    )
}

const styles = StyleSheet.create({
    container:{
        flex: 1,
        backgroundColor: colors.white
    },
    conteudo:{
        flexGrow: 1,
        justifyContent: "center",
        padding: spacing.lg
    }
})
