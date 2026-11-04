import React, { useCallback } from "react";
import { View, StyleSheet } from "react-native";

import { Header } from "../../../components/Header";
import { Loader } from "../../../components/Loader";
import { EmptyState } from "../../../components/EmptyState";
import { ErrorState } from "../../../components/ErrorState";
import { ListaSalasPorAno } from "../../../components/ListaSalasPorAno";

import { api } from "../../../services/api";
import { useBuscar } from "../../../lib/useBuscar";
import { getErrorMessage } from "../../../lib/getErrorMessage";
import { Sala } from "../../../lib/types";
import { ProfessorScreenProps } from "../../../routes/professor.routes";
import { colors } from "../../../styles/theme";

// "Anos Passados" (site: professor/tutoria/historico): salas de anos letivos anteriores (P20),
// agrupadas por ano. Cada sala abre a aba Tutorias, onde as tutorias finalizadas ficam como histórico
export default function HistoricoTutoria({ navigation }: ProfessorScreenProps<"HistoricoTutoria">){
    const buscar = useCallback(async () => {
        const salas = (await api.get<Sala[]>("/salas")).data;

        return salas.filter((s) => s.ano_letivo < new Date().getFullYear());
    }, [])

    const { dados, erro, carregando, atualizando, atualizar, tentarNovamente } = useBuscar(buscar);

    function vazio(){
        if(carregando) return <Loader />;
        if(!dados) return <ErrorState message={getErrorMessage(erro)} onRetry={tentarNovamente} />;

        return <EmptyState title="Ainda não foi finalizado nenhum projeto de tutoria" />;
    }

    return (
        <View style={styles.container}>
            <Header title="Anos Passados" onBack={navigation.goBack} onNotificacoes={() => navigation.navigate("Notificacoes")} />

            <ListaSalasPorAno
            salas={carregando ? [] : dados ?? []}
            onAbrir={(sala) => navigation.navigate("Sala", { id_sala: sala.id_sala, nome: sala.nome, subaba: "tutorias" })}
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
    }
})
