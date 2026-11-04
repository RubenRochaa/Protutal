import React, { useCallback, useState } from "react";
import { View, StyleSheet, FlatList, RefreshControl } from "react-native";

import { Header } from "../../../components/Header";
import { Input } from "../../../components/Input";
import { Select } from "../../../components/Select";
import { Button } from "../../../components/Button";
import { Loader } from "../../../components/Loader";
import { ItemLista } from "../../../components/ItemLista";
import { EmptyState } from "../../../components/EmptyState";
import { ErrorState } from "../../../components/ErrorState";
import { ModalNovaSala } from "./ModalNovaSala";

import { api } from "../../../services/api";
import { useBuscar } from "../../../lib/useBuscar";
import { getErrorMessage } from "../../../lib/getErrorMessage";
import { Sala } from "../../../lib/types";
import { ProfessorScreenProps } from "../../../routes/professor.routes";
import { colors, spacing } from "../../../styles/theme";

// Valor dos selects que significa "sem filtro"
const TODAS = "todas";

const OPCOES_SERIE = [
    { value: TODAS, label: "Todas" },
    { value: "1", label: "1ª série" },
    { value: "2", label: "2ª série" },
    { value: "3", label: "3ª série" },
]

// Tela "Turmas/Salas" (layout do Figma, regras do site em professor/components/listaSalas):
// salas do professor (rota P20), filtros de nome, série e ano letivo feitos no celular
// (a P20 não tem filtros) e o botão "Nova sala" (rota P19)
export default function Salas({ navigation }: ProfessorScreenProps<"ListaSalas">){
    const [busca, setBusca] = useState("");
    const [serie, setSerie] = useState(TODAS);
    const [ano, setAno] = useState(TODAS);
    const [modalAberto, setModalAberto] = useState(false);

    const buscar = useCallback(async () => (await api.get<Sala[]>("/salas")).data, [])
    const { dados, erro, carregando, atualizando, atualizar, tentarNovamente } = useBuscar(buscar);

    const salas = dados ?? [];

    // Anos que aparecem nas salas, do mais novo para o mais antigo
    const anos = [...new Set(salas.map((sala) => sala.ano_letivo))].sort((a, b) => b - a);
    const opcoesAno = [
        { value: TODAS, label: "Todos" },
        ...anos.map((a) => ({ value: String(a), label: String(a) }))
    ];

    const salasFiltradas = salas.filter((sala) =>
        sala.nome.toLowerCase().includes(busca.trim().toLowerCase()) &&
        (serie === TODAS || String(sala.serie) === serie) &&
        (ano === TODAS || String(sala.ano_letivo) === ano)
    );

    function limparFiltros(){
        setBusca("");
        setSerie(TODAS);
        setAno(TODAS);
    }

    function vazio(){
        if(carregando) return <Loader />;
        if(!dados) return <ErrorState message={getErrorMessage(erro)} onRetry={tentarNovamente} />;

        if(salas.length === 0){
            return <EmptyState title={`Você ainda não tem salas. Toque em "Nova sala" para criar a primeira.`} />;
        }

        return (
            <View style={styles.semResultado}>
                <EmptyState title="Nenhuma sala encontrada com esses filtros. Limpe os filtros para ver todas." />
                <Button title="Limpar filtros" variant="secundario" onPress={limparFiltros} />
            </View>
        )
    }

    return (
        <View style={styles.container}>
            <Header title="Minhas salas" onNotificacoes={() => navigation.navigate("Notificacoes")} />

            <FlatList
            data={carregando ? [] : salasFiltradas}
            keyExtractor={(item) => String(item.id_sala)}
            renderItem={({ item }) => (
                <ItemLista
                titulo={item.nome}
                detalhes={[`${item.serie}ª série · ${item.ano_letivo}`]}
                onPress={() => navigation.navigate("Sala", { id_sala: item.id_sala, nome: item.nome })}
                />
            )}
            contentContainerStyle={styles.lista}
            ItemSeparatorComponent={() => <View style={styles.separador} />}
            ListHeaderComponent={
                <View style={styles.filtros}>
                    <Button title="+ Nova sala" onPress={() => setModalAberto(true)} />

                    {salas.length > 0 && (
                        <>
                            <Input
                            label="Buscar pelo nome"
                            placeholder="Ex.: 2º A"
                            value={busca}
                            onChangeText={setBusca}
                            icon="search"
                            />

                            <View style={styles.linha}>
                                <View style={styles.coluna}>
                                    <Select label="Série" options={OPCOES_SERIE} value={serie} onChange={setSerie} />
                                </View>
                                <View style={styles.coluna}>
                                    <Select label="Ano letivo" options={opcoesAno} value={ano} onChange={setAno} />
                                </View>
                            </View>
                        </>
                    )}
                </View>
            }
            ListEmptyComponent={vazio()}
            refreshControl={
                <RefreshControl refreshing={atualizando} onRefresh={atualizar} colors={[colors.red700]} tintColor={colors.red700} />
            }
            keyboardShouldPersistTaps="handled"
            />

            <ModalNovaSala
            visivel={modalAberto}
            onClose={() => setModalAberto(false)}
            onCriada={atualizar}
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
    linha:{
        flexDirection: "row",
        gap: spacing.md
    },
    coluna:{
        flex: 1
    },
    separador:{
        height: spacing.md
    },
    semResultado:{
        gap: spacing.md
    }
})
