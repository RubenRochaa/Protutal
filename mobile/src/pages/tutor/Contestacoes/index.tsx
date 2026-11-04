import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, FlatList, RefreshControl } from "react-native";

import { Header } from "../../../components/Header";
import { Badge } from "../../../components/Badge";
import { Button } from "../../../components/Button";
import { Loader } from "../../../components/Loader";
import { EmptyState } from "../../../components/EmptyState";
import { ErrorState } from "../../../components/ErrorState";
import { AbasSegmentadas } from "../../../components/AbasSegmentadas";
import { Decisao, ModalResolver } from "./ModalResolver";

import { api } from "../../../services/api";
import { useBuscar } from "../../../lib/useBuscar";
import { getErrorMessage } from "../../../lib/getErrorMessage";
import { formatarData, formatarNota } from "../../../lib/formatacao";
import { ContestacaoTutor, StatusContestacao } from "../../../lib/types";
import { TutorScreenProps } from "../../../routes/tutor.routes";
import { colors, fonts, fontSizes, radius, shadows, spacing } from "../../../styles/theme";

type Aba = "pendentes" | "resolvidas" | "todas";

// Mesmos textos do site (contestacoes/components/listaContestacoes)
const VAZIO: Record<Aba, string> = {
    pendentes: "Nenhuma contestação pendente.",
    resolvidas: "Nenhuma contestação resolvida.",
    todas: "Nenhum aluno contestou nota nas suas atividades.",
}

const SELO: Record<StatusContestacao, { label: string; variant: "neutro" | "destaque" | "sucesso" }> = {
    pendente: { label: "Pendente", variant: "destaque" },
    aceita: { label: "Aceita", variant: "sucesso" },
    recusada: { label: "Recusada", variant: "neutro" },
}

// Tela "Contestações" do tutor (sem print no Figma; regras do site em /tutor/contestacoes):
// lista da P16 (só as atividades criadas por este tutor) e Aceitar/Recusar pela T4.
// Fica fora da barra de abas: abre pelo Início e pela correção da atividade
export default function Contestacoes({ navigation }: TutorScreenProps<"Contestacoes">){
    const [aba, setAba] = useState<Aba>("pendentes");
    const [selecionada, setSelecionada] = useState<ContestacaoTutor | null>(null);
    const [decisao, setDecisao] = useState<Decisao>("aceita");

    const buscar = useCallback(async () => {
        // Pendentes: filtro da API; Resolvidas: sem filtro, tirando as pendentes (como o site)
        const params = aba === "pendentes" ? { status: "pendente" } : undefined;
        const lista = (await api.get<ContestacaoTutor[]>("/contestacoes", { params })).data;

        return aba === "resolvidas" ? lista.filter((item) => item.status !== "pendente") : lista;
    }, [aba])

    const { dados, erro, carregando, atualizando, atualizar, tentarNovamente } = useBuscar(buscar);

    function abrir(contestacao: ContestacaoTutor, escolha: Decisao){
        setDecisao(escolha);
        setSelecionada(contestacao);
    }

    function renderContestacao({ item }: { item: ContestacaoTutor }){
        const selo = SELO[item.status];

        return (
            <View style={styles.card}>
                <View style={styles.topo}>
                    <Text style={styles.titulo}>{item.aluno.nome} · {item.atividade.titulo}</Text>
                    <Badge label={selo.label} variant={selo.variant} />
                </View>

                <Text style={styles.textoSecundario}>
                    Sala {item.sala.nome} · {item.atividade.conteudo?.nome ?? "sem conteúdo"} · {item.atividade.etapa}ª etapa · enviada em {formatarData(item.data_envio)}
                </Text>

                <Text style={styles.texto}><Text style={styles.rotulo}>Nota atual: </Text>{formatarNota(item.nota.valor)}</Text>
                <Text style={styles.texto}><Text style={styles.rotulo}>Justificativa do aluno: </Text>{item.comentario}</Text>

                {item.status !== "pendente" && item.decisao && (
                    <Text style={styles.texto}>
                        <Text style={styles.rotulo}>Decisão{item.data_resolucao ? ` (${formatarData(item.data_resolucao)})` : ""}: </Text>
                        {item.decisao}
                    </Text>
                )}

                {item.status === "pendente" && (
                    <View style={styles.acoes}>
                        <Button title="Aceitar" style={styles.botao} onPress={() => abrir(item, "aceita")} />
                        <Button title="Recusar" variant="secundario" style={styles.botao} onPress={() => abrir(item, "recusada")} />
                    </View>
                )}
            </View>
        )
    }

    function vazio(){
        if(carregando) return <Loader />;
        if(!dados) return <ErrorState message={getErrorMessage(erro)} onRetry={tentarNovamente} />;

        return <EmptyState title={VAZIO[aba]} />;
    }

    return (
        <View style={styles.container}>
            <Header title="Contestações" onBack={navigation.goBack} />

            <FlatList
            data={carregando ? [] : dados ?? []}
            keyExtractor={(item) => String(item.id_contestacao)}
            renderItem={renderContestacao}
            contentContainerStyle={styles.lista}
            ItemSeparatorComponent={() => <View style={styles.separador} />}
            ListHeaderComponent={
                <View style={styles.filtros}>
                    <AbasSegmentadas
                    opcoes={[
                        { valor: "pendentes", rotulo: "Pendentes" },
                        { valor: "resolvidas", rotulo: "Resolvidas" },
                        { valor: "todas", rotulo: "Todas" }
                    ]}
                    valor={aba}
                    onChange={setAba}
                    />

                    {dados && !carregando && <Text style={styles.contagem}>Contestações ({dados.length})</Text>}
                </View>
            }
            ListEmptyComponent={vazio()}
            refreshControl={
                <RefreshControl refreshing={atualizando} onRefresh={atualizar} colors={[colors.red700]} tintColor={colors.red700} />
            }
            />

            <ModalResolver
            contestacao={selecionada}
            decisao={decisao}
            onClose={() => setSelecionada(null)}
            onResolvida={atualizar}
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
    contagem:{
        fontFamily: fonts.semibold,
        fontSize: fontSizes.tituloCard,
        color: colors.red700
    },
    separador:{
        height: spacing.md
    },
    card:{
        gap: spacing.sm,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: colors.gray300,
        borderRadius: radius.cardSm,
        backgroundColor: colors.white,
        ...shadows.cardLeve
    },
    topo:{
        flexDirection: "row",
        alignItems: "flex-start",
        gap: spacing.sm
    },
    titulo:{
        flex: 1,
        fontFamily: fonts.semibold,
        fontSize: fontSizes.base,
        color: colors.black
    },
    rotulo:{
        fontFamily: fonts.medium,
        color: colors.gray700
    },
    texto:{
        fontFamily: fonts.regular,
        fontSize: 14,
        color: colors.black
    },
    textoSecundario:{
        fontFamily: fonts.regular,
        fontSize: 13,
        color: colors.gray700
    },
    acoes:{
        flexDirection: "row",
        gap: spacing.md,
        marginTop: spacing.sm
    },
    // Dois botões lado a lado: divide a linha em vez dos 100% do Button
    botao:{
        flex: 1,
        width: "auto"
    }
})
