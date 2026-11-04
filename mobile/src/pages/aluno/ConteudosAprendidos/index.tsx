import React, { useCallback } from "react";
import { View, Text, StyleSheet, SectionList, RefreshControl } from "react-native";
import { Feather } from "@expo/vector-icons";

import { Header } from "../../../components/Header";
import { Badge } from "../../../components/Badge";
import { Loader } from "../../../components/Loader";
import { EmptyState } from "../../../components/EmptyState";
import { ErrorState } from "../../../components/ErrorState";

import { api } from "../../../services/api";
import { useBuscar } from "../../../lib/useBuscar";
import { getErrorMessage } from "../../../lib/getErrorMessage";
import { formatarNota } from "../../../lib/formatacao";
import { MASCOTES } from "../../../lib/mascotes";
import { ConteudosDominados, MediaConteudo } from "../../../lib/types";
import { AlunoScreenProps } from "../../../routes/aluno.routes";
import { colors, fonts, fontSizes, radius, shadows, spacing } from "../../../styles/theme";

interface Secao {
    titulo: string;
    faixa: "dominado" | "com_dificuldade";
    data: MediaConteudo[];
}

// Tela "Conteúdos aprendidos" (layout do print "Conteúdos dominados"), rota A7 ?id_sala=.
// A faixa vem pronta da API (tabela Faixa_desempenho). Sem "5 de 12": o aluno não tem rota
// com o total de conteúdos da sala
export default function ConteudosAprendidos({ navigation, route }: AlunoScreenProps<"ConteudosAprendidos">){
    const { id_sala, nome_sala } = route.params;

    const buscar = useCallback(async () => {
        const response = await api.get<ConteudosDominados>("/alunos/me/conteudos-dominados", { params: { id_sala } });

        return response.data;
    }, [id_sala])

    const { dados, erro, carregando, atualizando, atualizar, tentarNovamente } = useBuscar(buscar);

    const dominados = dados?.dominado ?? [];
    const comDificuldade = dados?.com_dificuldade ?? [];

    function renderVazio(){
        if(carregando) return <Loader />;
        if(!dados) return <ErrorState message={getErrorMessage(erro)} onRetry={tentarNovamente} />;

        return <EmptyState title="Ainda não há conteúdos com nota nesta sala." image={MASCOTES.desempenho} />;
    }

    // Seções só aparecem quando há dados; sem nenhum conteúdo, a lista mostra o estado vazio
    const secoes: Secao[] = dados && (dominados.length > 0 || comDificuldade.length > 0)
        ? [
            { titulo: "Conteúdos dominados", faixa: "dominado", data: dominados },
            { titulo: "Precisa reforçar", faixa: "com_dificuldade", data: comDificuldade },
        ]
        : [];

    return (
        <View style={styles.container}>
            <Header title="Conteúdos aprendidos" onBack={navigation.goBack} />

            <SectionList
            sections={secoes}
            keyExtractor={(item, indice) => `${item.id_conteudo}-${indice}`}
            ListHeaderComponent={
                <View style={styles.resumo}>
                    <View style={styles.iconeResumo}>
                        <Feather name="globe" size={26} color={colors.white} />
                    </View>

                    <View style={styles.dados}>
                        <Text style={styles.tituloResumo}>Sala {nome_sala}</Text>
                        <Text style={styles.textoSecundario}>Conteúdos dominados</Text>
                    </View>

                    {dados && <Badge label={String(dominados.length)} />}
                </View>
            }
            renderSectionHeader={({ section }) => (
                <View style={styles.cabecalho}>
                    <Text style={styles.tituloSecao} accessibilityRole="header">{section.titulo}</Text>
                    {section.data.length === 0 && (
                        <Text style={styles.textoSecundario}>
                            {section.faixa === "dominado" ? "Nenhum conteúdo dominado ainda." : "Nenhum conteúdo para reforçar."}
                        </Text>
                    )}
                </View>
            )}
            renderItem={({ item, section }) => (
                <View style={styles.item}>
                    <Feather
                    name={section.faixa === "dominado" ? "check-circle" : "alert-circle"}
                    size={24}
                    color={section.faixa === "dominado" ? colors.green500 : colors.red700}
                    />
                    <Text style={styles.nome}>{item.nome}</Text>
                    <Text style={styles.media}>Média {formatarNota(item.media)}</Text>
                </View>
            )}
            ListEmptyComponent={renderVazio()}
            stickySectionHeadersEnabled={false}
            ItemSeparatorComponent={() => <View style={styles.separador} />}
            contentContainerStyle={styles.lista}
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
    resumo:{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        padding: spacing.lg,
        marginBottom: spacing.sm,
        borderWidth: 1,
        borderColor: colors.gray300,
        borderRadius: radius.cardSm,
        backgroundColor: colors.white,
        ...shadows.cardLeve
    },
    iconeResumo:{
        width: 52,
        height: 52,
        borderRadius: 26,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.red700
    },
    dados:{
        flex: 1
    },
    tituloResumo:{
        fontFamily: fonts.semibold,
        fontSize: fontSizes.destaque,
        color: colors.black
    },
    cabecalho:{
        gap: spacing.xs,
        paddingTop: spacing.lg,
        paddingBottom: spacing.md
    },
    tituloSecao:{
        fontFamily: fonts.semibold,
        fontSize: fontSizes.tituloCard,
        color: colors.red700
    },
    item:{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: colors.gray300,
        borderRadius: radius.cardSm,
        backgroundColor: colors.gray100
    },
    nome:{
        flex: 1,
        fontFamily: fonts.semibold,
        fontSize: 15,
        color: colors.black
    },
    media:{
        fontFamily: fonts.medium,
        fontSize: 14,
        color: colors.gray700
    },
    textoSecundario:{
        fontFamily: fonts.regular,
        fontSize: 13,
        color: colors.gray700
    },
    separador:{
        height: spacing.sm
    }
})
