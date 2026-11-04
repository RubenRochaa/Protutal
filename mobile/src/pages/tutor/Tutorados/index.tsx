import React, { useCallback, useMemo, useState } from "react";
import { View, Text, StyleSheet, SectionList, RefreshControl, TouchableOpacity, SectionListData } from "react-native";
import { Feather } from "@expo/vector-icons";

import { Header } from "../../../components/Header";
import { Badge } from "../../../components/Badge";
import { Input } from "../../../components/Input";
import { Avatar } from "../../../components/Avatar";
import { Button } from "../../../components/Button";
import { Loader } from "../../../components/Loader";
import { EmptyState } from "../../../components/EmptyState";
import { ErrorState } from "../../../components/ErrorState";
import { AbasSegmentadas } from "../../../components/AbasSegmentadas";

import { api } from "../../../services/api";
import { useBuscar } from "../../../lib/useBuscar";
import { getErrorMessage } from "../../../lib/getErrorMessage";
import { formatarData } from "../../../lib/formatacao";
import { StatusTutoria, TutoriaTutor } from "../../../lib/types";
import { TutorScreenProps } from "../../../routes/tutor.routes";
import { colors, fonts, fontSizes, radius, shadows, spacing } from "../../../styles/theme";

// "" = Todas (não envia o filtro para a T1)
type Filtro = StatusTutoria | "";

// Mesmos textos do site (tutoria/components/listaTutorados)
const VAZIO: Record<Filtro, string> = {
    ativa: "Nenhuma tutoria ativa no momento. O professor da sala cria as tutorias.",
    finalizada: "Nenhuma tutoria finalizada.",
    "": "Você ainda não tem tutorados. O professor da sala cria as tutorias.",
}

interface Secao {
    id_sala: number;
    nome: string;
    data: TutoriaTutor[];
}

// Tela "Tutoria" do tutor (layout do Figma "Meus tutorados", dados do site em /tutor/tutoria):
// tutorados agrupados por sala (rota T1), com filtro de status e busca pelo nome.
// Cada sala dá acesso aos materiais de apoio e aos avisos da sala
export default function Tutorados({ navigation }: TutorScreenProps<"Tutorados">){
    const [filtro, setFiltro] = useState<Filtro>("ativa");
    const [busca, setBusca] = useState("");

    const buscar = useCallback(async () => {
        const params = filtro ? { status: filtro } : undefined;

        return (await api.get<TutoriaTutor[]>("/tutores/me/tutorias", { params })).data;
    }, [filtro])

    const { dados, erro, carregando, atualizando, atualizar, tentarNovamente } = useBuscar(buscar);

    // Agrupa por sala na ordem da T1; a busca só filtra na tela
    const secoes = useMemo(() => {
        const termo = busca.trim().toLowerCase();
        const grupos: Secao[] = [];

        for(const tutoria of dados ?? []){
            if(termo && !tutoria.aluno.nome.toLowerCase().includes(termo)) continue;

            let grupo = grupos.find((item) => item.id_sala === tutoria.sala.id_sala);
            if(!grupo){
                grupo = { id_sala: tutoria.sala.id_sala, nome: tutoria.sala.nome, data: [] };
                grupos.push(grupo);
            }

            grupo.data.push(tutoria);
        }

        return grupos;
    }, [dados, busca])

    function renderCabecalho({ section }: { section: SectionListData<TutoriaTutor, Secao> }){
        const params = { id_sala: section.id_sala, nome_sala: section.nome };

        return (
            <View style={styles.cabecalhoSala}>
                <Text style={styles.tituloSala} accessibilityRole="header">Sala {section.nome}</Text>

                <View style={styles.atalhosSala}>
                    <TouchableOpacity style={styles.atalho} onPress={() => navigation.navigate("MateriaisSala", params)} accessibilityRole="button">
                        <Feather name="paperclip" size={16} color={colors.red700} />
                        <Text style={styles.textoAtalho}>Materiais</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.atalho} onPress={() => navigation.navigate("AvisosSala", params)} accessibilityRole="button">
                        <Feather name="bell" size={16} color={colors.red700} />
                        <Text style={styles.textoAtalho}>Avisos</Text>
                    </TouchableOpacity>
                </View>
            </View>
        )
    }

    function renderTutoria({ item }: { item: TutoriaTutor }){
        const ativa = item.status === "ativa";

        return (
            <View style={styles.card}>
                <TouchableOpacity
                style={styles.topo}
                onPress={() => navigation.navigate("DetalheTutorado", { id_tutoria: item.id_tutoria })}
                accessibilityRole="button"
                accessibilityLabel={`${item.aluno.nome}. Ver tutoria`}
                >
                    <Avatar nome={item.aluno.nome} />

                    <View style={styles.dados}>
                        <Text style={styles.nome}>{item.aluno.nome}</Text>
                        <Text style={styles.info}>
                            Data de início: {formatarData(item.data_inicio)}
                            {item.data_fim ? ` · Fim: ${formatarData(item.data_fim)}` : ""}
                        </Text>
                    </View>

                    <Badge label={ativa ? "Ativa" : "Finalizada"} variant={ativa ? "sucesso" : "neutro"} />
                </TouchableOpacity>

                <Text style={styles.meta}>{item.meta_aprendizagem || "Sem meta definida"}</Text>

                <View style={styles.acoes}>
                    <TouchableOpacity
                    style={styles.acao}
                    onPress={() => navigation.navigate("ChatTutorado", { id_tutoria: item.id_tutoria })}
                    accessibilityRole="button"
                    >
                        <Feather name="message-circle" size={16} color={colors.red700} />
                        <Text style={styles.textoAcao}>Abrir chat</Text>
                    </TouchableOpacity>

                    {/* Atividade só para tutoria ativa (a T9 recusa a finalizada) */}
                    {ativa && (
                        <TouchableOpacity
                        style={styles.acao}
                        onPress={() => navigation.navigate("NovaAtividade", { id_tutoria: item.id_tutoria })}
                        accessibilityRole="button"
                        >
                            <Feather name="plus" size={16} color={colors.red700} />
                            <Text style={styles.textoAcao}>Nova atividade</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        )
    }

    function vazio(){
        if(carregando) return <Loader />;
        if(!dados) return <ErrorState message={getErrorMessage(erro)} onRetry={tentarNovamente} />;
        if(busca.trim()) return <EmptyState title="Nenhum tutorado com esse nome." />;

        return <EmptyState title={VAZIO[filtro]} />;
    }

    return (
        <View style={styles.container}>
            <Header title="Meus tutorados" />

            <SectionList
            sections={carregando ? [] : secoes}
            keyExtractor={(item) => String(item.id_tutoria)}
            renderItem={renderTutoria}
            renderSectionHeader={renderCabecalho}
            stickySectionHeadersEnabled={false}
            contentContainerStyle={styles.lista}
            ItemSeparatorComponent={() => <View style={styles.separador} />}
            ListHeaderComponent={
                <View style={styles.filtros}>
                    <Input
                    label="Buscar"
                    icon="search"
                    placeholder="Buscar aluno..."
                    value={busca}
                    onChangeText={setBusca}
                    autoCorrect={false}
                    />

                    <AbasSegmentadas
                    opcoes={[
                        { valor: "ativa", rotulo: "Ativas" },
                        { valor: "finalizada", rotulo: "Finalizadas" },
                        { valor: "", rotulo: "Todas" }
                    ]}
                    valor={filtro}
                    onChange={setFiltro}
                    />

                    <Button title="+ Nova atividade" variant="secundario" onPress={() => navigation.navigate("NovaAtividade")} />
                </View>
            }
            ListEmptyComponent={vazio()}
            refreshControl={
                <RefreshControl refreshing={atualizando} onRefresh={atualizar} colors={[colors.red700]} tintColor={colors.red700} />
            }
            keyboardShouldPersistTaps="handled"
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
        marginBottom: spacing.sm
    },
    separador:{
        height: spacing.md
    },
    cabecalhoSala:{
        gap: spacing.sm,
        marginTop: spacing.lg,
        marginBottom: spacing.md
    },
    tituloSala:{
        fontFamily: fonts.semibold,
        fontSize: fontSizes.tituloCard,
        color: colors.red700
    },
    atalhosSala:{
        flexDirection: "row",
        gap: spacing.sm
    },
    atalho:{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.xs,
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.md,
        borderWidth: 1,
        borderColor: colors.red700,
        borderRadius: radius.pill
    },
    textoAtalho:{
        fontFamily: fonts.medium,
        fontSize: 13,
        color: colors.red700
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
        alignItems: "center",
        gap: spacing.md
    },
    dados:{
        flex: 1,
        gap: 2
    },
    nome:{
        fontFamily: fonts.semibold,
        fontSize: fontSizes.base,
        color: colors.black
    },
    info:{
        fontFamily: fonts.regular,
        fontSize: 13,
        color: colors.gray700
    },
    meta:{
        fontFamily: fonts.regular,
        fontSize: 14,
        color: colors.black
    },
    acoes:{
        flexDirection: "row",
        flexWrap: "wrap",
        gap: spacing.lg,
        paddingTop: spacing.sm,
        borderTopWidth: 1,
        borderTopColor: colors.gray300
    },
    acao:{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.xs
    },
    textoAcao:{
        fontFamily: fonts.medium,
        fontSize: 14,
        color: colors.red700
    }
})
