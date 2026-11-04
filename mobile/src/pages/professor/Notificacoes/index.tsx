import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, SectionList, RefreshControl } from "react-native";

import { Header } from "../../../components/Header";
import { Button } from "../../../components/Button";
import { Loader } from "../../../components/Loader";
import { ItemLista } from "../../../components/ItemLista";
import { ModalAviso } from "../../../components/ModalAviso";
import { EmptyState } from "../../../components/EmptyState";
import { ErrorState } from "../../../components/ErrorState";
import { ItemPedido, ModalPedido } from "../../../components/ListaPedidos";

import { api } from "../../../services/api";
import { useBuscar } from "../../../lib/useBuscar";
import { getErrorMessage } from "../../../lib/getErrorMessage";
import { formatarData, formatarNota } from "../../../lib/formatacao";
import { ContestacaoTutor, PedidoTutoria, Sala } from "../../../lib/types";
import { ProfessorScreenProps } from "../../../routes/professor.routes";
import { colors, fonts, fontSizes, spacing } from "../../../styles/theme";

interface Dados {
    pedidos: PedidoTutoria[];
    contestacoes: ContestacaoTutor[];
    salas: Sala[];
}

type Secao =
    | { tipo: "pedidos"; titulo: string; vazio: string; data: PedidoTutoria[] }
    | { tipo: "contestacoes"; titulo: string; vazio: string; data: ContestacaoTutor[] };

// "Central de notificações" (layout do Figma; site: professor/notificacoes). A API não tem rota de
// notificações: a tela junta o que está pendente nas salas do professor (e o sino não tem contador).
// - pedidos para ser tutor: P26, com Aceitar/Recusar
// - contestações de nota pendentes: P16 (?status=pendente), que abrem a aba Contestações da sala
// "Mandar notificação" publica um aviso numa sala (P3)
export default function Notificacoes({ navigation }: ProfessorScreenProps<"Notificacoes">){
    const [pedidoAberto, setPedidoAberto] = useState<PedidoTutoria | null>(null);
    const [avisoAberto, setAvisoAberto] = useState(false);

    const buscar = useCallback(async (): Promise<Dados> => {
        const [pedidos, contestacoes, salas] = await Promise.all([
            api.get<PedidoTutoria[]>("/pedidos-tutoria").then((r) => r.data),
            api.get<ContestacaoTutor[]>("/contestacoes", { params: { status: "pendente" } }).then((r) => r.data),
            api.get<Sala[]>("/salas").then((r) => r.data)
        ]);

        return { pedidos, contestacoes, salas };
    }, [])

    const { dados, erro, carregando, atualizando, atualizar, tentarNovamente } = useBuscar(buscar);

    const secoes: Secao[] = dados && !carregando ? [
        {
            tipo: "pedidos",
            titulo: `Pedidos para ser tutor (${dados.pedidos.length})`,
            vazio: "Nenhum pedido para ser tutor esperando decisão.",
            data: dados.pedidos
        },
        {
            tipo: "contestacoes",
            titulo: `Contestações de nota pendentes (${dados.contestacoes.length})`,
            vazio: "Nenhuma contestação de nota esperando decisão.",
            data: dados.contestacoes
        },
    ] : [];

    function renderItem({ item, section }: { item: PedidoTutoria | ContestacaoTutor; section: Secao }){
        if(section.tipo === "pedidos"){
            const pedido = item as PedidoTutoria;

            return <ItemPedido pedido={pedido} mostrarSala onVer={() => setPedidoAberto(pedido)} />;
        }

        const contestacao = item as ContestacaoTutor;

        return (
            <ItemLista
            titulo={`${contestacao.aluno.nome} contestou uma nota`}
            detalhes={[
                `${contestacao.sala.nome} · ${contestacao.atividade.titulo} · nota ${formatarNota(contestacao.nota.valor)} · ${formatarData(contestacao.data_envio)}`
            ]}
            onPress={() => navigation.navigate("Sala", {
                id_sala: contestacao.sala.id_sala,
                nome: contestacao.sala.nome,
                subaba: "contestacoes",
                status: "pendente"
            })}
            />
        )
    }

    function vazio(){
        if(carregando) return <Loader />;
        if(!dados) return <ErrorState message={getErrorMessage(erro)} onRetry={tentarNovamente} />;

        return null;
    }

    return (
        <View style={styles.container}>
            <Header title="Notificações" onBack={navigation.canGoBack() ? navigation.goBack : undefined} />

            <SectionList<PedidoTutoria | ContestacaoTutor, Secao>
            sections={secoes}
            keyExtractor={(item) => "id_pedido" in item ? `p${item.id_pedido}` : `c${item.id_contestacao}`}
            renderItem={renderItem}
            renderSectionHeader={({ section }) => <Text style={styles.secao}>{section.titulo}</Text>}
            renderSectionFooter={({ section }) => section.data.length === 0 ? <EmptyState title={section.vazio} /> : null}
            stickySectionHeadersEnabled={false}
            contentContainerStyle={styles.lista}
            ItemSeparatorComponent={() => <View style={styles.separador} />}
            ListHeaderComponent={
                <View style={styles.topo}>
                    <Text style={styles.ajuda}>Pedidos e contestações que esperam a sua decisão, em todas as suas salas.</Text>
                    <Button
                    title="Mandar notificação"
                    disabled={!dados || dados.salas.length === 0}
                    onPress={() => setAvisoAberto(true)}
                    />
                </View>
            }
            ListEmptyComponent={vazio()}
            refreshControl={
                <RefreshControl refreshing={atualizando} onRefresh={atualizar} colors={[colors.red700]} tintColor={colors.red700} />
            }
            />

            <ModalPedido pedido={pedidoAberto} onClose={() => setPedidoAberto(null)} onDecidido={atualizar} />

            <ModalAviso visivel={avisoAberto} salas={dados?.salas ?? []} onClose={() => setAvisoAberto(false)} />
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
        gap: spacing.md
    },
    ajuda:{
        fontFamily: fonts.regular,
        fontSize: 14,
        color: colors.gray700
    },
    secao:{
        marginTop: spacing.lg,
        marginBottom: spacing.sm,
        fontFamily: fonts.semibold,
        fontSize: fontSizes.tituloCard,
        color: colors.red700
    },
    separador:{
        height: spacing.md
    }
})
