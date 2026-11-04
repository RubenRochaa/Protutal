import React, { useCallback } from "react";
import { View, Text, StyleSheet, FlatList, RefreshControl } from "react-native";

import { Header } from "../../../components/Header";
import { Loader } from "../../../components/Loader";
import { ItemAviso } from "../../../components/ItemAviso";
import { EmptyState } from "../../../components/EmptyState";
import { ErrorState } from "../../../components/ErrorState";

import { api } from "../../../services/api";
import { useBuscar } from "../../../lib/useBuscar";
import { getErrorMessage, getErrorStatus } from "../../../lib/getErrorMessage";
import { MASCOTES } from "../../../lib/mascotes";
import { AvisoSala } from "../../../lib/types";
import { TutorScreenProps } from "../../../routes/tutor.routes";
import { colors, fonts, fontSizes, spacing } from "../../../styles/theme";

// Avisos que o professor publicou para a sala (rota A4), só leitura.
// No site ficam dentro da página Tutoria; aqui abrem pela sala na lista de tutorados
export default function AvisosSala({ navigation, route }: TutorScreenProps<"AvisosSala">){
    const { id_sala, nome_sala } = route.params;

    const buscar = useCallback(async () => {
        const avisos = (await api.get<AvisoSala[]>(`/salas/${id_sala}/avisos`)).data;

        // A A4 já manda o mais recente primeiro; a ordenação só garante isso
        return [...avisos].sort((a, b) => b.data_publicacao.localeCompare(a.data_publicacao));
    }, [id_sala])

    // 403 = o tutor não está matriculado na sala: é um estado da tela, sem toast
    const { dados, erro, carregando, atualizando, atualizar, tentarNovamente } = useBuscar(buscar, { semToast: [403] });

    function vazio(){
        if(carregando) return <Loader />;

        if(!dados){
            if(getErrorStatus(erro) === 403){
                return <EmptyState image={MASCOTES.badRequest} title="Você não tem acesso aos avisos desta sala." />;
            }

            return <ErrorState message={getErrorMessage(erro)} onRetry={tentarNovamente} />;
        }

        return <EmptyState title="Nenhum aviso publicado." />;
    }

    return (
        <View style={styles.container}>
            <Header title="Avisos da sala" onBack={navigation.goBack} />

            <FlatList
            data={carregando ? [] : dados ?? []}
            keyExtractor={(item) => String(item.id_aviso)}
            renderItem={({ item }) => <ItemAviso aviso={item} />}
            contentContainerStyle={styles.lista}
            ItemSeparatorComponent={() => <View style={styles.separador} />}
            ListHeaderComponent={<Text style={styles.titulo} accessibilityRole="header">Avisos · Sala {nome_sala}</Text>}
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
    separador:{
        height: spacing.md
    },
    titulo:{
        marginBottom: spacing.lg,
        fontFamily: fonts.semibold,
        fontSize: fontSizes.tituloCard,
        color: colors.red700
    }
})
