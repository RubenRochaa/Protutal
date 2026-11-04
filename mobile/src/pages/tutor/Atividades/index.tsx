import React, { useCallback, useState } from "react";
import { View, StyleSheet, FlatList, RefreshControl } from "react-native";

import { Header } from "../../../components/Header";
import { Button } from "../../../components/Button";
import { Select } from "../../../components/Select";
import { Loader } from "../../../components/Loader";
import { EmptyState } from "../../../components/EmptyState";
import { ErrorState } from "../../../components/ErrorState";
import { Etapa, FiltroEtapa } from "../../../components/FiltroEtapa";
import { AbasSegmentadas } from "../../../components/AbasSegmentadas";
import { ItemAtividade } from "./ItemAtividade";

import { api } from "../../../services/api";
import { useBuscar } from "../../../lib/useBuscar";
import { getErrorMessage } from "../../../lib/getErrorMessage";
import { MASCOTES } from "../../../lib/mascotes";
import { AtividadeTutor, TipoAtividadeOpcao, TutoriaTutor } from "../../../lib/types";
import { TutorScreenProps } from "../../../routes/tutor.routes";
import { colors, spacing } from "../../../styles/theme";

type Aba = "nao_corrigidas" | "corrigidas";

interface Dados {
    atividades: AtividadeTutor[];
    // Opções do filtro de sala: as salas das tutorias do tutor (T1)
    salas: { id_sala: number; nome: string }[];
    // Se a T8 falhar, o rótulo do tipo é montado a partir do valor
    tipos: TipoAtividadeOpcao[];
}

// Tela "Atividades" do tutor (layout do Figma "Atividades Corrigidas", regras do site em /tutor/atividades):
// filtros de sala e etapa (T2), e as listas "Não corrigidas" e "Corrigidas" em abas
// (no site são colunas lado a lado). Corrigida = todos os destinatários com nota
export default function Atividades({ navigation }: TutorScreenProps<"ListaAtividadesTutor">){
    const [aba, setAba] = useState<Aba>("nao_corrigidas");
    const [idSala, setIdSala] = useState("");
    const [etapa, setEtapa] = useState<Etapa>("");

    const buscar = useCallback(async (): Promise<Dados> => {
        const params: Record<string, string> = {};
        if(idSala) params.id_sala = idSala;
        if(etapa) params.etapa = etapa;

        const [atividades, tutorias, tipos] = await Promise.all([
            api.get<AtividadeTutor[]>("/tutores/me/atividades", { params }).then((r) => r.data),
            api.get<TutoriaTutor[]>("/tutores/me/tutorias").then((r) => r.data).catch(() => []),
            api.get<TipoAtividadeOpcao[]>("/tipos-atividade").then((r) => r.data).catch(() => [])
        ]);

        const salas: Dados["salas"] = [];
        for(const tutoria of tutorias){
            if(!salas.some((sala) => sala.id_sala === tutoria.sala.id_sala)){
                salas.push({ id_sala: tutoria.sala.id_sala, nome: tutoria.sala.nome });
            }
        }

        return { atividades, salas, tipos };
    }, [idSala, etapa])

    const { dados, erro, carregando, atualizando, atualizar, tentarNovamente } = useBuscar(buscar);

    const lista = (dados?.atividades ?? []).filter((atividade) => {
        const corrigida = atividade.total_com_nota >= atividade.total_destinatarios;

        return aba === "corrigidas" ? corrigida : !corrigida;
    });

    const comFiltro = idSala !== "" || etapa !== "";

    function vazio(){
        if(carregando) return <Loader />;
        if(!dados) return <ErrorState message={getErrorMessage(erro)} onRetry={tentarNovamente} />;

        if(dados.atividades.length === 0){
            return (
                <EmptyState
                image={MASCOTES.atividades}
                title={comFiltro ? "Nenhuma atividade com esses filtros." : "Você ainda não criou atividades."}
                />
            )
        }

        return (
            <EmptyState
            image={MASCOTES.atividades}
            title={aba === "corrigidas" ? "Nenhuma atividade com todas as notas lançadas." : "Nenhuma atividade esperando nota."}
            />
        )
    }

    return (
        <View style={styles.container}>
            <Header title="Atividades" />

            <FlatList
            data={carregando ? [] : lista}
            keyExtractor={(item) => String(item.id_atividade)}
            renderItem={({ item }) => (
                <ItemAtividade
                atividade={item}
                tipos={dados?.tipos ?? []}
                onPress={() => navigation.navigate("CorrigirAtividade", { id_atividade: item.id_atividade })}
                />
            )}
            contentContainerStyle={styles.lista}
            ItemSeparatorComponent={() => <View style={styles.separador} />}
            ListHeaderComponent={
                <View style={styles.filtros}>
                    <Button title="+ Nova atividade" onPress={() => navigation.navigate("NovaAtividade")} />

                    <Select
                    label="Sala"
                    options={[
                        { value: "", label: "Todas as salas" },
                        ...(dados?.salas ?? []).map((sala) => ({ value: String(sala.id_sala), label: `Sala ${sala.nome}` }))
                    ]}
                    value={idSala}
                    onChange={setIdSala}
                    />

                    <FiltroEtapa etapa={etapa} onChange={setEtapa} />

                    <AbasSegmentadas
                    opcoes={[{ valor: "nao_corrigidas", rotulo: "Não corrigidas" }, { valor: "corrigidas", rotulo: "Corrigidas" }]}
                    valor={aba}
                    onChange={setAba}
                    />
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
    separador:{
        height: spacing.md
    }
})
