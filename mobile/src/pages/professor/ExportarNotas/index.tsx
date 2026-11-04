import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, ScrollView, RefreshControl } from "react-native";
import { Feather } from "@expo/vector-icons";

import { Header } from "../../../components/Header";
import { Card } from "../../../components/Card";
import { Select } from "../../../components/Select";
import { Loader } from "../../../components/Loader";
import { EmptyState } from "../../../components/EmptyState";
import { ErrorState } from "../../../components/ErrorState";
import { Etapa, FiltroEtapa } from "../../../components/FiltroEtapa";
import { BotaoExportarNotas } from "../../../components/BotaoExportarNotas";

import { api } from "../../../services/api";
import { useBuscar } from "../../../lib/useBuscar";
import { getErrorMessage } from "../../../lib/getErrorMessage";
import { Sala } from "../../../lib/types";
import { ProfessorScreenProps } from "../../../routes/professor.routes";
import { colors, fonts, radius, spacing } from "../../../styles/theme";

// Tela "Exportar notas" (layout do Figma; site: exportar-notas). A P15 exporta as notas de UMA sala,
// com filtro opcional de etapa: "turma" e "disciplina" do Figma viraram um único select de sala (P20)
// e "trimestre" virou "etapa" (são 3)
export default function ExportarNotas({ navigation, route }: ProfessorScreenProps<"ExportarNotas">){
    const [sala, setSala] = useState(route.params?.id_sala ? String(route.params.id_sala) : "");
    const [etapa, setEtapa] = useState<Etapa>("");

    const buscar = useCallback(async () => (await api.get<Sala[]>("/salas")).data, [])
    const { dados, erro, carregando, atualizando, atualizar, tentarNovamente } = useBuscar(buscar);

    function conteudo(){
        if(carregando) return <Loader />;
        if(!dados) return <ErrorState message={getErrorMessage(erro)} onRetry={tentarNovamente} />;

        if(dados.length === 0){
            return <EmptyState title={`Você ainda não tem salas. Crie uma sala na aba "Salas".`} />;
        }

        // Salas do ano mais novo primeiro
        const ordenadas = [...dados].sort((a, b) => b.ano_letivo - a.ano_letivo || a.nome.localeCompare(b.nome));

        return (
            <Card>
                <Text style={styles.ajuda}>
                    A planilha (.xlsx) traz as notas lançadas na sala, com aluno, atividade, etapa, conteúdo, tutor e nota.
                </Text>

                <Select
                label="Sala"
                placeholder="Selecione a sala"
                options={ordenadas.map((s) => ({ value: String(s.id_sala), label: `${s.nome} (${s.serie}ª série, ${s.ano_letivo})` }))}
                value={sala}
                onChange={setSala}
                />

                <FiltroEtapa etapa={etapa} onChange={setEtapa} />

                <BotaoExportarNotas idSala={sala ? Number(sala) : null} filtros={{ etapa }} />
            </Card>
        )
    }

    return (
        <View style={styles.container}>
            <Header title="Exportar notas" onBack={navigation.goBack} onNotificacoes={() => navigation.navigate("Notificacoes")} />

            <ScrollView
            contentContainerStyle={styles.conteudo}
            refreshControl={
                <RefreshControl refreshing={atualizando} onRefresh={atualizar} colors={[colors.red700]} tintColor={colors.red700} />
            }
            >
                <View style={styles.explicacao}>
                    <Feather name="file-text" size={32} color={colors.red700} />
                    <Text style={styles.textoExplicacao}>
                        Exporte as notas dos alunos para uma planilha compatível com o Excel. Depois é só salvar
                        no celular ou compartilhar.
                    </Text>
                </View>

                {conteudo()}
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
    explicacao:{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        padding: spacing.lg,
        borderRadius: radius.card,
        backgroundColor: colors.gray100
    },
    textoExplicacao:{
        flex: 1,
        fontFamily: fonts.regular,
        fontSize: 14,
        color: colors.black
    },
    ajuda:{
        fontFamily: fonts.regular,
        fontSize: 14,
        color: colors.gray700
    }
})
