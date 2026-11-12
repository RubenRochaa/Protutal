import React, { useCallback, useMemo } from "react";
import { View, Text, StyleSheet, SectionList, RefreshControl, TouchableOpacity, SectionListData } from "react-native";
import { Feather } from "@expo/vector-icons";

import { Header } from "../../../components/Header";
import { Badge } from "../../../components/Badge";
import { Avatar } from "../../../components/Avatar";
import { Loader } from "../../../components/Loader";
import { EmptyState } from "../../../components/EmptyState";
import { ErrorState } from "../../../components/ErrorState";
import { Contador } from "../../../components/Contador";
import { CardSala } from "./CardSala";

import { api } from "../../../services/api";
import { useBuscar } from "../../../lib/useBuscar";
import { useContadores } from "../../../lib/useContadores";
import { getErrorMessage } from "../../../lib/getErrorMessage";
import { formatarData } from "../../../lib/formatacao";
import { SalaAluno, TutoriaAluno } from "../../../lib/types";
import { AlunoScreenProps } from "../../../routes/aluno.routes";
import { useTema, type TemaAtual } from "../../../lib/useTema";
import { fonts, radius, shadows, spacing } from "../../../styles/theme";

type Item = { tipo: "sala"; sala: SalaAluno } | { tipo: "tutoria"; tutoria: TutoriaAluno };

interface Secao {
    titulo: string;
    explicacao?: string;
    vazio: string;
    data: Item[];
}

// Tela "Tutoria" do aluno: "Quero ser tutor" (GET /alunos/me/salas e A13)
// e, abaixo, "Minhas tutorias" (rota A3), como no site
export default function Tutoria({ navigation }: AlunoScreenProps<"MinhaTutoria">){
    const temaAtual = useTema();
    const styles = useMemo(() => makeStyles(temaAtual), [temaAtual]);
    const { colors } = temaAtual;
    const buscar = useCallback(async () => {
        const [salas, tutorias] = await Promise.all([
            api.get<SalaAluno[]>("/alunos/me/salas").then((r) => r.data),
            api.get<TutoriaAluno[]>("/alunos/me/tutorias").then((r) => r.data)
        ]);

        return { salas, tutorias };
    }, [])

    const { dados, erro, carregando, atualizando, atualizar, tentarNovamente } = useBuscar(buscar);
    const { porTutoria } = useContadores();

    function renderTutoria(tutoria: TutoriaAluno){
        const ativa = tutoria.status === "ativa";

        return (
            <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate("DetalheTutoria", { id_tutoria: tutoria.id_tutoria })}
            accessibilityRole="button"
            >
                <View style={styles.topo}>
                    <Avatar nome={tutoria.tutor.nome} />

                    <View style={styles.dados}>
                        <Text style={styles.nome}>
                            <Text style={styles.rotulo}>Tutor: </Text>
                            {tutoria.tutor.nome}
                        </Text>
                        <Text style={styles.info}>Sala {tutoria.sala.nome} ({tutoria.sala.serie}ª série)</Text>
                    </View>

                    <Badge label={ativa ? "Ativa" : "Finalizada"} variant={ativa ? "sucesso" : "neutro"} />
                </View>

                <Text style={styles.info}>
                    Início: {formatarData(tutoria.data_inicio)}
                    {!ativa && tutoria.data_fim ? ` · Fim: ${formatarData(tutoria.data_fim)}` : ""}
                </Text>

                <Text style={styles.meta}>
                    <Text style={styles.rotulo}>Meta de aprendizagem: </Text>
                    {tutoria.meta_aprendizagem}
                </Text>

                <View style={styles.abrir}>
                    {/* Mensagens novas do tutor + avisos novos da sala; sem contador o espaço some */}
                    {porTutoria[tutoria.id_tutoria] > 0 && (
                        <View style={styles.contador}>
                            <Contador valor={porTutoria[tutoria.id_tutoria]} />
                        </View>
                    )}
                    <Text style={styles.textoAbrir}>Ver tutoria</Text>
                    <Feather name="chevron-right" size={18} color={colors.red700} />
                </View>
            </TouchableOpacity>
        )
    }

    function renderCabecalho({ section }: { section: SectionListData<Item, Secao> }){
        return (
            <View style={styles.cabecalho}>
                <Text style={styles.titulo} accessibilityRole="header">{section.titulo}</Text>

                {section.explicacao && (
                    <View style={styles.explicacao}>
                        <Feather name="info" size={18} color={colors.gray700} />
                        <Text style={styles.textoExplicacao}>{section.explicacao}</Text>
                    </View>
                )}

                {section.data.length === 0 && <EmptyState title={section.vazio} />}
            </View>
        )
    }

    if(carregando || !dados){
        return (
            <View style={styles.container}>
                <Header title="Tutoria" />
                <View style={styles.centro}>
                    {carregando ? <Loader /> : <ErrorState message={getErrorMessage(erro)} onRetry={tentarNovamente} />}
                </View>
            </View>
        )
    }

    // A A3 já manda as ativas primeiro; o sort (estável) só garante essa ordem
    const tutorias = [...dados.tutorias].sort((a, b) => Number(b.status === "ativa") - Number(a.status === "ativa"));

    const secoes: Secao[] = [
        {
            titulo: "Quero ser tutor",
            explicacao: dados.salas.length > 0
                ? "Escolha a sala em que você quer ajudar outros alunos. O professor da sala analisa o pedido."
                : undefined,
            vazio: "Você ainda não está matriculado em nenhuma sala.",
            data: dados.salas.map((sala) => ({ tipo: "sala", sala }))
        },
        {
            titulo: "Minhas tutorias",
            vazio: "Você ainda não está em uma tutoria. O tutor é definido pelo professor da sala.",
            data: tutorias.map((tutoria) => ({ tipo: "tutoria", tutoria }))
        }
    ];

    return (
        <View style={styles.container}>
            <Header title="Tutoria" />

            <SectionList
            sections={secoes}
            keyExtractor={(item) => item.tipo === "sala" ? `sala-${item.sala.id_sala}` : `tutoria-${item.tutoria.id_tutoria}`}
            renderItem={({ item }) => item.tipo === "sala"
                ? <CardSala sala={item.sala} onAtualizar={atualizar} />
                : renderTutoria(item.tutoria)}
            renderSectionHeader={renderCabecalho}
            stickySectionHeadersEnabled={false}
            ItemSeparatorComponent={() => <View style={styles.separador} />}
            SectionSeparatorComponent={() => <View style={styles.separador} />}
            contentContainerStyle={styles.lista}
            refreshControl={
                <RefreshControl refreshing={atualizando} onRefresh={atualizar} colors={[colors.red700]} tintColor={colors.red700} />
            }
            />
        </View>
    )
}

const makeStyles = ({ colors, fontSizes, fs }: TemaAtual) => StyleSheet.create({
    container:{
        flex: 1,
        backgroundColor: colors.fundoPagina
    },
    centro:{
        flex: 1,
        justifyContent: "center",
        padding: spacing.lg
    },
    lista:{
        padding: spacing.lg
    },
    separador:{
        height: spacing.md
    },
    cabecalho:{
        gap: spacing.md,
        paddingTop: spacing.sm
    },
    titulo:{
        paddingBottom: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.gray300,
        fontFamily: fonts.semibold,
        fontSize: fontSizes.destaque,
        color: colors.red700
    },
    explicacao:{
        flexDirection: "row",
        gap: spacing.sm,
        padding: spacing.md,
        borderRadius: radius.item,
        backgroundColor: colors.gray100
    },
    textoExplicacao:{
        flex: 1,
        fontFamily: fonts.regular,
        fontSize: fs(14),
        color: colors.gray700
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
        flex: 1
    },
    nome:{
        fontFamily: fonts.semibold,
        fontSize: fontSizes.base,
        color: colors.black
    },
    rotulo:{
        fontFamily: fonts.medium,
        color: colors.gray700
    },
    info:{
        fontFamily: fonts.regular,
        fontSize: fontSizes.rotulo,
        color: colors.gray700
    },
    meta:{
        fontFamily: fonts.regular,
        fontSize: fs(14),
        color: colors.black
    },
    abrir:{
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "flex-end",
        gap: 2
    },
    // Bolinha de notificação antes do "Ver tutoria"
    contador:{
        marginRight: spacing.xs
    },
    textoAbrir:{
        fontFamily: fonts.medium,
        fontSize: fs(14),
        color: colors.red700
    }
})
