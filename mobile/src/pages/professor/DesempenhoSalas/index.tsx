import React, { useCallback } from "react";
import { View, Text, StyleSheet } from "react-native";

import { Header } from "../../../components/Header";
import { Loader } from "../../../components/Loader";
import { EmptyState } from "../../../components/EmptyState";
import { ErrorState } from "../../../components/ErrorState";
import { ListaSalasPorAno } from "../../../components/ListaSalasPorAno";

import { api } from "../../../services/api";
import { useBuscar } from "../../../lib/useBuscar";
import { getErrorMessage } from "../../../lib/getErrorMessage";
import { MASCOTES } from "../../../lib/mascotes";
import { Sala } from "../../../lib/types";
import { ProfessorScreenProps } from "../../../routes/professor.routes";
import { colors, fonts } from "../../../styles/theme";

// Aba "Desempenho" (site: professor/desempenho). As rotas de desempenho são por sala (P13 e P14),
// então aqui o professor escolhe a sala (P20) e abre a aba Desempenho dela
export default function DesempenhoSalas({ navigation }: ProfessorScreenProps<"DesempenhoSalas">){
    const buscar = useCallback(async () => (await api.get<Sala[]>("/salas")).data, [])
    const { dados, erro, carregando, atualizando, atualizar, tentarNovamente } = useBuscar(buscar);

    function vazio(){
        if(carregando) return <Loader />;
        if(!dados) return <ErrorState message={getErrorMessage(erro)} onRetry={tentarNovamente} />;

        return <EmptyState image={MASCOTES.desempenho} title={`Você ainda não tem salas. Crie uma sala na aba "Salas".`} />;
    }

    return (
        <View style={styles.container}>
            <Header title="Desempenhos" onNotificacoes={() => navigation.navigate("Notificacoes")} />

            <ListaSalasPorAno
            salas={carregando ? [] : dados ?? []}
            onAbrir={(sala) => navigation.navigate("Sala", { id_sala: sala.id_sala, nome: sala.nome, subaba: "desempenho" })}
            topo={<Text style={styles.ajuda}>Escolha a sala para ver o desempenho dos tutorados e dos tutores.</Text>}
            vazio={vazio()}
            atualizando={atualizando}
            onAtualizar={atualizar}
            />
        </View>
    )
}

const styles = StyleSheet.create({
    container:{
        flex: 1,
        backgroundColor: colors.white
    },
    ajuda:{
        fontFamily: fonts.regular,
        fontSize: 14,
        color: colors.gray700
    }
})
