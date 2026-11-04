import React from "react";
import { View, Text, Image, StyleSheet, ScrollView } from "react-native";

import { Header } from "../../../components/Header";
import { CardResumo } from "../../../components/CardResumo";

import { MASCOTES } from "../../../lib/mascotes";
import { ProfessorScreenProps } from "../../../routes/professor.routes";
import { colors, fonts, fontSizes, radius, spacing } from "../../../styles/theme";

// Tela inicial do professor (layout do Figma "Home", cards do site em professor/components/cardsResumo).
// Nenhuma rota da API devolve números prontos para estes cards: como no site,
// cada um mostra só o que a tela faz (sem dado inventado). "Minhas salas" fica na aba Salas
export default function Inicio({ navigation }: ProfessorScreenProps<"PainelProfessor">){
    return (
        <View style={styles.container}>
            <Header title="Início" onNotificacoes={() => navigation.navigate("Notificacoes")} />

            <ScrollView contentContainerStyle={styles.conteudo}>
                {/* Banner do site: mascote e boas-vindas */}
                <View style={styles.banner}>
                    <Image source={MASCOTES.telaInicial} style={styles.mascote} resizeMode="contain" accessibilityIgnoresInvertColors />
                    <Text style={styles.boasVindas}>Bem-vindo ao Protutal!</Text>
                </View>

                <CardResumo
                icone="users"
                titulo="Alunos em tutoria"
                subtitulo="Ver tutores e tutorados por série"
                onPress={() => navigation.navigate("Tutoria", { screen: "TutoriaAnos" })}
                />

                <CardResumo
                icone="bar-chart-2"
                titulo="Desempenho por trimestre"
                subtitulo="Médias por etapa dos tutorados e tutores"
                onPress={() => navigation.navigate("Desempenho", { screen: "DesempenhoSalas" })}
                />

                <CardResumo
                icone="bell"
                titulo="Notificações"
                subtitulo="Pedidos para ser tutor e contestações de nota"
                onPress={() => navigation.navigate("Notificacoes")}
                />

                <CardResumo
                icone="download"
                titulo="Exportar notas"
                subtitulo="Baixar as notas da sala em planilha"
                onPress={() => navigation.navigate("ExportarNotas")}
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
        gap: spacing.lg,
        padding: spacing.lg
    },
    banner:{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        padding: spacing.lg,
        borderRadius: radius.card,
        backgroundColor: colors.wine800
    },
    mascote:{
        width: 72,
        height: 72
    },
    boasVindas:{
        flex: 1,
        fontFamily: fonts.semibold,
        fontSize: fontSizes.destaque,
        color: colors.white
    }
})
