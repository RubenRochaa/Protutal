import React, { useCallback, useState } from "react";
import { View, StyleSheet, FlatList, RefreshControl } from "react-native";

import { Header } from "../../../components/Header";
import { Loader } from "../../../components/Loader";
import { EmptyState } from "../../../components/EmptyState";
import { ErrorState } from "../../../components/ErrorState";
import { AbasSegmentadas } from "../../../components/AbasSegmentadas";
import { Etapa, FiltroEtapa } from "../../../components/FiltroEtapa";
import { ItemAtividade } from "./ItemAtividade";

import { api } from "../../../services/api";
import { useBuscar } from "../../../lib/useBuscar";
import { getErrorMessage } from "../../../lib/getErrorMessage";
import { MASCOTES } from "../../../lib/mascotes";
import { AtividadeAluno } from "../../../lib/types";
import { AlunoScreenProps } from "../../../routes/aluno.routes";
import { colors, spacing } from "../../../styles/theme";

type Aba = "pendentes" | "realizadas";

const MSG_FILTRO_VAZIO = "Nenhuma atividade nesta etapa.";

// Prazo em milissegundos, para comparar na ordenação
function prazo(atividade: AtividadeAluno){
    return new Date(atividade.data_entrega).getTime()
}

// Tela "Minhas atividades" (rota A1 - GET /alunos/me/atividades).
// Busca uma vez e separa nas abas Pendentes e Realizadas, com a mesma ordem do site
export default function Atividades({ navigation }: AlunoScreenProps<"ListaAtividades">){
    const [etapa, setEtapa] = useState<Etapa>("");
    const [aba, setAba] = useState<Aba>("pendentes");

    const buscar = useCallback(async () => {
        const response = await api.get<AtividadeAluno[]>("/alunos/me/atividades", {
            params: etapa ? { etapa } : undefined
        });

        return response.data;
    }, [etapa])

    const { dados, erro, carregando, atualizando, atualizar, tentarNovamente } = useBuscar(buscar);

    const lista = dados ?? [];

    // Pendentes: prazo mais antigo primeiro (atrasadas no topo). Realizadas: prazo mais recente primeiro
    const pendentes = lista.filter((a) => a.status === "pendente").sort((a, b) => prazo(a) - prazo(b));
    const realizadas = lista.filter((a) => a.status !== "pendente").sort((a, b) => prazo(b) - prazo(a));

    const mostradas = aba === "pendentes" ? pendentes : realizadas;

    const vazio = etapa
        ? MSG_FILTRO_VAZIO
        : aba === "pendentes" ? "Nenhuma atividade pendente. Bom trabalho!" : "Você ainda não entregou nenhuma atividade.";

    function renderVazio(){
        if(carregando) return <Loader />;
        if(erro && !dados) return <ErrorState message={getErrorMessage(erro)} onRetry={tentarNovamente} />;

        return <EmptyState title={vazio} image={MASCOTES.atividades} />;
    }

    return (
        <View style={styles.container}>
            <Header title="Atividades" />

            <FlatList
            data={carregando ? [] : mostradas}
            keyExtractor={(item) => String(item.id_atividade)}
            renderItem={({ item }) => (
                <ItemAtividade
                atividade={item}
                onPress={() => navigation.navigate("DetalheAtividade", { id_atividade: item.id_atividade })}
                />
            )}
            ListHeaderComponent={
                <View style={styles.topo}>
                    <FiltroEtapa etapa={etapa} onChange={setEtapa} />

                    <AbasSegmentadas
                    opcoes={[
                        { valor: "pendentes", rotulo: `Pendentes (${pendentes.length})` },
                        { valor: "realizadas", rotulo: `Realizadas (${realizadas.length})` },
                    ]}
                    valor={aba}
                    onChange={setAba}
                    />
                </View>
            }
            ListEmptyComponent={renderVazio()}
            contentContainerStyle={styles.lista}
            ItemSeparatorComponent={() => <View style={styles.separador} />}
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
    topo:{
        gap: spacing.lg,
        marginBottom: spacing.lg
    },
    separador:{
        height: spacing.md
    }
})
