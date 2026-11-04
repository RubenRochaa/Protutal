import React, { useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, RefreshControl } from "react-native";

import { Header } from "../../../components/Header";
import { Card } from "../../../components/Card";
import { Loader } from "../../../components/Loader";
import { ItemLista } from "../../../components/ItemLista";
import { ErrorState } from "../../../components/ErrorState";

import { api } from "../../../services/api";
import { useBuscar } from "../../../lib/useBuscar";
import { getErrorMessage } from "../../../lib/getErrorMessage";
import { Sala } from "../../../lib/types";
import { ProfessorScreenProps } from "../../../routes/professor.routes";
import { colors, fonts, spacing } from "../../../styles/theme";

const SERIES = [3, 2, 1];

// Aba "Tutoria" ("Anos de Tutoria" do site, em professor/tutoria): as salas do ano atual (P20)
// ficam nos cartões de 3ª, 2ª e 1ª série, e cada sala abre a aba Tutorias dela.
// O último cartão leva ao histórico dos anos anteriores
export default function TutoriaAnos({ navigation }: ProfessorScreenProps<"TutoriaAnos">){
    const buscar = useCallback(async () => (await api.get<Sala[]>("/salas")).data, [])
    const { dados, erro, carregando, atualizando, atualizar, tentarNovamente } = useBuscar(buscar);

    const ano = new Date().getFullYear();

    function conteudo(){
        if(carregando) return <Loader />;
        if(!dados) return <ErrorState message={getErrorMessage(erro)} onRetry={tentarNovamente} />;

        return (
            <>
                {SERIES.map((serie) => {
                    const salas = dados.filter((s) => s.serie === serie && s.ano_letivo === ano);

                    return (
                        <Card key={serie} title={`${serie}ª série`}>
                            {salas.length === 0 ? (
                                <Text style={styles.vazio}>Nenhuma sala da {serie}ª série em {ano}</Text>
                            ) : salas.map((sala) => (
                                <ItemLista
                                key={sala.id_sala}
                                titulo="Ver tutores e tutorados"
                                detalhes={[sala.nome]}
                                onPress={() => navigation.navigate("Sala", { id_sala: sala.id_sala, nome: sala.nome, subaba: "tutorias" })}
                                accessibilityLabel={`Ver tutores e tutorados da sala ${sala.nome}`}
                                />
                            ))}
                        </Card>
                    )
                })}

                <ItemLista titulo="Histórico dos anos anteriores" onPress={() => navigation.navigate("HistoricoTutoria")} />
            </>
        )
    }

    return (
        <View style={styles.container}>
            <Header title="Anos de Tutoria" onNotificacoes={() => navigation.navigate("Notificacoes")} />

            <ScrollView
            contentContainerStyle={styles.conteudo}
            refreshControl={
                <RefreshControl refreshing={atualizando} onRefresh={atualizar} colors={[colors.red700]} tintColor={colors.red700} />
            }
            >
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
    vazio:{
        fontFamily: fonts.regular,
        fontSize: 14,
        color: colors.gray700
    }
})
