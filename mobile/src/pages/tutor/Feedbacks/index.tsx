import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Linking } from "react-native";
import { Feather } from "@expo/vector-icons";

import { Header } from "../../../components/Header";
import { Badge } from "../../../components/Badge";
import { Select } from "../../../components/Select";
import { Loader } from "../../../components/Loader";
import { EmptyState } from "../../../components/EmptyState";
import { ErrorState } from "../../../components/ErrorState";
import { Etapa, FiltroEtapa } from "../../../components/FiltroEtapa";

import { api } from "../../../services/api";
import { useBuscar } from "../../../lib/useBuscar";
import { getErrorMessage } from "../../../lib/getErrorMessage";
import { formatarData, formatarNota } from "../../../lib/formatacao";
import { FeedbacksTutor } from "../../../lib/types";
import { TutorScreenProps } from "../../../routes/tutor.routes";
import { colors, fonts, fontSizes, radius, shadows, spacing } from "../../../styles/theme";

type Feedback = FeedbacksTutor["feedbacks"][number];

interface Dados {
    filtrado: FeedbacksTutor;
    // Opções dos filtros, tiradas da lista sem filtro (como o site)
    anos: number[];
    tutorados: { id_aluno: number; nome: string }[];
}

// Tela "Feedbacks" do tutor (layout do Figma "Feedback por Rúbrica", regras do site em /tutor/feedbacks):
// só leitura das avaliações que os tutorados fizeram (rota T7), com filtros de etapa, ano e tutorado.
// O tutor não preenche rubrica: quem avalia é o aluno
export default function Feedbacks(_props: TutorScreenProps<"FeedbacksRecebidos">){
    const [etapa, setEtapa] = useState<Etapa>("");
    const [ano, setAno] = useState("");
    const [idAluno, setIdAluno] = useState("");

    const buscar = useCallback(async (): Promise<Dados> => {
        const params: Record<string, string> = {};
        if(etapa) params.etapa = etapa;
        if(ano) params.ano = ano;
        if(idAluno) params.id_aluno = idAluno;

        const temFiltro = Object.keys(params).length > 0;

        const [todos, filtrado] = await Promise.all([
            api.get<FeedbacksTutor>("/feedbacks").then((r) => r.data),
            temFiltro ? api.get<FeedbacksTutor>("/feedbacks", { params }).then((r) => r.data) : null
        ]);

        const anos = [...new Set(todos.feedbacks.map((item) => item.sala.ano_letivo))].sort((a, b) => b - a);

        const tutorados: Dados["tutorados"] = [];
        for(const item of todos.feedbacks){
            if(!tutorados.some((t) => t.id_aluno === item.aluno.id_aluno)) tutorados.push(item.aluno);
        }
        tutorados.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

        return { filtrado: filtrado ?? todos, anos, tutorados };
    }, [etapa, ano, idAluno])

    const { dados, erro, carregando, atualizando, atualizar, tentarNovamente } = useBuscar(buscar);
    const comFiltro = etapa !== "" || ano !== "" || idAluno !== "";

    function renderFeedback({ item }: { item: Feedback }){
        return (
            <View style={styles.card}>
                <View style={styles.topo}>
                    <Text style={styles.nota}>{formatarNota(item.nota)}</Text>

                    <View style={styles.dados}>
                        <Text style={styles.nome}>{item.aluno.nome}</Text>
                        <Text style={styles.textoSecundario}>
                            Sala {item.sala.nome} ({item.sala.ano_letivo}) · {formatarData(item.data)}
                        </Text>
                    </View>

                    <Badge label={`${item.etapa}ª etapa`} variant="destaque" />
                </View>

                {item.comentario && <Text style={styles.texto}>{item.comentario}</Text>}

                {item.rubrica_file && (
                    <TouchableOpacity
                    style={styles.link}
                    onPress={() => Linking.openURL(item.rubrica_file!)}
                    accessibilityRole="link"
                    >
                        <Feather name="file-text" size={18} color={colors.red700} />
                        <Text style={styles.textoLink}>Abrir rubrica</Text>
                    </TouchableOpacity>
                )}
            </View>
        )
    }

    function vazio(){
        if(carregando) return <Loader />;
        if(!dados) return <ErrorState message={getErrorMessage(erro)} onRetry={tentarNovamente} />;

        return <EmptyState title={comFiltro ? "Nenhum feedback com esses filtros." : "Você ainda não recebeu feedbacks."} />;
    }

    const resumo = dados?.filtrado.resumo;

    return (
        <View style={styles.container}>
            <Header title="Feedbacks" />

            <FlatList
            data={carregando ? [] : dados?.filtrado.feedbacks ?? []}
            keyExtractor={(item) => String(item.id_feedback)}
            renderItem={renderFeedback}
            contentContainerStyle={styles.lista}
            ItemSeparatorComponent={() => <View style={styles.separador} />}
            ListHeaderComponent={
                <View style={styles.filtros}>
                    <Text style={styles.explicacao}>Avaliações que os seus tutorados fizeram de você, com a rubrica enviada.</Text>

                    <FiltroEtapa etapa={etapa} onChange={setEtapa} />

                    <Select
                    label="Ano letivo"
                    options={[{ value: "", label: "Todos os anos" }, ...(dados?.anos ?? []).map((item) => ({ value: String(item), label: String(item) }))]}
                    value={ano}
                    onChange={setAno}
                    />

                    <Select
                    label="Tutorado"
                    options={[
                        { value: "", label: "Todos os tutorados" },
                        ...(dados?.tutorados ?? []).map((item) => ({ value: String(item.id_aluno), label: item.nome }))
                    ]}
                    value={idAluno}
                    onChange={setIdAluno}
                    />

                    {resumo && !carregando && (
                        <View style={styles.resumo}>
                            <View style={styles.indicador}>
                                <Text style={styles.rotulo}>Total</Text>
                                <Text style={styles.valor}>{resumo.total_feedbacks}</Text>
                            </View>
                            <View style={styles.indicador}>
                                <Text style={styles.rotulo}>Média das notas</Text>
                                <Text style={styles.valor}>{resumo.media_notas === null ? "—" : formatarNota(resumo.media_notas)}</Text>
                            </View>
                        </View>
                    )}
                </View>
            }
            ListEmptyComponent={vazio()}
            refreshControl={
                <RefreshControl refreshing={atualizando} onRefresh={atualizar} colors={[colors.red700]} tintColor={colors.red700} />
            }
            />
        </View>
    )
}

const styles = StyleSheet.create({
    container:{
        flex: 1,
        backgroundColor: colors.white
    },
    lista:{
        flexGrow: 1,
        padding: spacing.lg
    },
    filtros:{
        gap: spacing.md,
        marginBottom: spacing.lg
    },
    explicacao:{
        fontFamily: fonts.regular,
        fontSize: 14,
        color: colors.gray700
    },
    resumo:{
        flexDirection: "row",
        gap: spacing.md
    },
    indicador:{
        flex: 1,
        alignItems: "center",
        gap: spacing.xs,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: colors.gray300,
        borderRadius: radius.cardSm
    },
    rotulo:{
        fontFamily: fonts.medium,
        fontSize: fontSizes.rotulo,
        color: colors.gray700
    },
    valor:{
        fontFamily: fonts.bold,
        fontSize: fontSizes.indicador,
        color: colors.black
    },
    separador:{
        height: spacing.md
    },
    card:{
        gap: spacing.sm,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: colors.gray300,
        borderRadius: radius.cardSm,
        backgroundColor: colors.white,
        ...shadows.cardLeve
    },
    topo:{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md
    },
    nota:{
        minWidth: 48,
        fontFamily: fonts.bold,
        fontSize: fontSizes.destaque,
        color: colors.red700,
        textAlign: "center"
    },
    dados:{
        flex: 1,
        gap: 2
    },
    nome:{
        fontFamily: fonts.semibold,
        fontSize: fontSizes.base,
        color: colors.black
    },
    texto:{
        fontFamily: fonts.regular,
        fontSize: 14,
        color: colors.black
    },
    textoSecundario:{
        fontFamily: fonts.regular,
        fontSize: 13,
        color: colors.gray700
    },
    link:{
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "flex-start",
        gap: spacing.xs
    },
    textoLink:{
        fontFamily: fonts.medium,
        fontSize: 14,
        color: colors.red700
    }
})
