import React, { ReactElement, ReactNode, useMemo } from "react";
import { View, Text, StyleSheet, SectionList, RefreshControl } from "react-native";

import { ItemLista } from "../ItemLista";
import { Sala } from "../../lib/types";
import { useTema, type TemaAtual } from "../../lib/useTema";
import { fonts, spacing } from "../../styles/theme";

interface ListaSalasPorAnoProps {
    salas: Sala[];
    onAbrir: (sala: Sala) => void;
    // Texto e filtros acima da lista
    topo?: ReactNode;
    // Carregando, erro ou lista vazia (cada tela decide o que mostrar)
    vazio: ReactElement | null;
    atualizando: boolean;
    onAtualizar: () => void;
}

// Salas agrupadas por ano letivo, do mais novo para o mais antigo (site: professor/components/salasPorAno).
// A P20 não tem filtro de ano: o agrupamento é feito no celular. Usado no Histórico e no Desempenho
export function ListaSalasPorAno({ salas, onAbrir, topo, vazio, atualizando, onAtualizar }: ListaSalasPorAnoProps){
    const temaAtual = useTema();
    const styles = useMemo(() => makeStyles(temaAtual), [temaAtual]);
    const { colors } = temaAtual;
    const anos = [...new Set(salas.map((s) => s.ano_letivo))].sort((a, b) => b - a);
    const secoes = anos.map((ano) => ({ ano, data: salas.filter((s) => s.ano_letivo === ano) }));

    return (
        <SectionList
        sections={secoes}
        keyExtractor={(item) => String(item.id_sala)}
        renderItem={({ item }) => (
            <ItemLista titulo={item.nome} detalhes={[`${item.serie}ª série`]} onPress={() => onAbrir(item)} />
        )}
        renderSectionHeader={({ section }) => <Text style={styles.ano}>{section.ano}</Text>}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={styles.lista}
        ItemSeparatorComponent={() => <View style={styles.separador} />}
        ListHeaderComponent={topo ? <View style={styles.topo}>{topo}</View> : undefined}
        ListEmptyComponent={vazio ?? undefined}
        refreshControl={
            <RefreshControl refreshing={atualizando} onRefresh={onAtualizar} colors={[colors.red700]} tintColor={colors.red700} />
        }
        />
    )
}

const makeStyles = ({ colors, fontSizes }: TemaAtual) => StyleSheet.create({
    lista:{
        flexGrow: 1,
        padding: spacing.lg
    },
    topo:{
        gap: spacing.md,
        marginBottom: spacing.sm
    },
    ano:{
        marginTop: spacing.md,
        marginBottom: spacing.sm,
        fontFamily: fonts.semibold,
        fontSize: fontSizes.tituloCard,
        color: colors.red700
    },
    separador:{
        height: spacing.md
    }
})
