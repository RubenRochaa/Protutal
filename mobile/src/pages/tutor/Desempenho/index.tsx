import React, { useCallback } from "react";
import { View, Text, StyleSheet, FlatList, RefreshControl } from "react-native";

import { Header } from "../../../components/Header";
import { Loader } from "../../../components/Loader";
import { EmptyState } from "../../../components/EmptyState";
import { ErrorState } from "../../../components/ErrorState";
import { BlocoVinculo } from "./BlocoVinculo";

import { api } from "../../../services/api";
import { useBuscar } from "../../../lib/useBuscar";
import { getErrorMessage } from "../../../lib/getErrorMessage";
import { MASCOTES } from "../../../lib/mascotes";
import { DesempenhoVinculo } from "../../../lib/types";
import { TutorScreenProps } from "../../../routes/tutor.routes";
import { colors, fonts, spacing } from "../../../styles/theme";

// Tela "Meu desempenho" do tutor (layout do Figma, regras do site em /tutor/desempenho):
// um bloco por sala em que é ou foi tutor (rota T6, ativos primeiro), com o feedback dos alunos
// e as avaliações do professor. As notas dos tutorados não entram no desempenho do tutor
export default function Desempenho(_props: TutorScreenProps<"DesempenhoTutor">){
    const buscar = useCallback(async () => {
        return (await api.get<DesempenhoVinculo[]>("/tutores/me/desempenho")).data;
    }, [])

    const { dados, erro, carregando, atualizando, atualizar, tentarNovamente } = useBuscar(buscar);

    // Sem nenhuma avaliação nem feedback em nenhuma sala: a tela mostra só o aviso, como o site
    const semDados = !!dados && dados.every((item) => item.feedback.quantidade === 0 && item.avaliacoes_professor.quantidade === 0);

    function vazio(){
        if(carregando) return <Loader />;
        if(!dados) return <ErrorState message={getErrorMessage(erro)} onRetry={tentarNovamente} />;

        return <EmptyState image={MASCOTES.desempenho} title="Você ainda não tem avaliações nem feedbacks." />;
    }

    return (
        <View style={styles.container}>
            <Header title="Meu desempenho" />

            <FlatList
            data={carregando || semDados ? [] : dados ?? []}
            keyExtractor={(item) => String(item.id_tutor_sala)}
            renderItem={({ item }) => <BlocoVinculo vinculo={item} />}
            contentContainerStyle={styles.lista}
            ItemSeparatorComponent={() => <View style={styles.separador} />}
            ListHeaderComponent={
                <Text style={styles.explicacao}>
                    Dois indicadores lado a lado, por sala: a média dos feedbacks dos seus tutorados e a média das
                    avaliações do professor. As notas dos tutorados não entram no seu desempenho.
                </Text>
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
    explicacao:{
        marginBottom: spacing.lg,
        fontFamily: fonts.regular,
        fontSize: 14,
        color: colors.gray700
    },
    separador:{
        height: spacing.lg
    }
})
