import React, { ReactElement, ReactNode } from "react";
import { View, StyleSheet, FlatList, RefreshControl, ListRenderItem, ImageSourcePropType } from "react-native";

import { Loader } from "../../../components/Loader";
import { EmptyState } from "../../../components/EmptyState";
import { ErrorState } from "../../../components/ErrorState";

import { getErrorMessage } from "../../../lib/getErrorMessage";
import { colors, spacing } from "../../../styles/theme";

interface ListaSalaProps<T> {
    // Topo da sala (série, permissão e abas): rola junto com a lista
    cabecalho: ReactElement;
    // Filtros e botões da sub-aba, logo abaixo das abas
    topo?: ReactNode;
    itens: T[];
    renderItem: ListRenderItem<T>;
    keyExtractor: (item: T) => string;
    // Estados do useBuscar
    carregando: boolean;
    atualizando: boolean;
    // true = a busca falhou e não há dados
    falhou: boolean;
    erro: unknown;
    onAtualizar: () => void;
    onTentarNovamente: () => void;
    // Mensagem (e mascote) da lista vazia
    vazio: string;
    imagemVazio?: ImageSourcePropType;
    numColumns?: number;
}

// Lista de uma sub-aba da sala, no padrão das listas do app (ex.: tutor/Atividades):
// FlatList com puxar para atualizar e os estados de carregando, erro e vazio (mascote)
export function ListaSala<T>({
    cabecalho, topo, itens, renderItem, keyExtractor, carregando, atualizando, falhou, erro,
    onAtualizar, onTentarNovamente, vazio, imagemVazio, numColumns
}: ListaSalaProps<T>){
    function estadoVazio(){
        if(carregando) return <Loader />;
        if(falhou) return <ErrorState message={getErrorMessage(erro)} onRetry={onTentarNovamente} />;

        return <EmptyState title={vazio} image={imagemVazio} />;
    }

    return (
        <FlatList
        key={numColumns ?? 1}
        data={carregando || falhou ? [] : itens}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        numColumns={numColumns}
        columnWrapperStyle={numColumns && numColumns > 1 ? styles.colunas : undefined}
        contentContainerStyle={styles.lista}
        ItemSeparatorComponent={() => <View style={styles.separador} />}
        ListHeaderComponent={
            <View style={styles.topo}>
                {cabecalho}
                {topo}
            </View>
        }
        ListEmptyComponent={estadoVazio()}
        refreshControl={
            <RefreshControl refreshing={atualizando} onRefresh={onAtualizar} colors={[colors.red700]} tintColor={colors.red700} />
        }
        keyboardShouldPersistTaps="handled"
        />
    )
}

const styles = StyleSheet.create({
    lista:{
        flexGrow: 1,
        padding: spacing.lg
    },
    topo:{
        gap: spacing.md,
        marginBottom: spacing.lg
    },
    colunas:{
        gap: spacing.md
    },
    separador:{
        height: spacing.md
    }
})
