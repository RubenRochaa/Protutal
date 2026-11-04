import React, { ReactNode, useCallback } from "react";
import { View, Text, Image, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";

import { Header } from "../../../components/Header";
import { Loader } from "../../../components/Loader";
import { ErrorState } from "../../../components/ErrorState";
import { GraficoEtapas } from "../../../components/GraficoEtapas";

import { api } from "../../../services/api";
import { useBuscar } from "../../../lib/useBuscar";
import { getErrorMessage } from "../../../lib/getErrorMessage";
import { formatarData } from "../../../lib/formatacao";
import { MASCOTES } from "../../../lib/mascotes";
import { AtividadeAluno, ContestacaoAluno, DesempenhoAluno, TutoriaAluno } from "../../../lib/types";
import { AlunoScreenProps } from "../../../routes/aluno.routes";
import { colors, fonts, fontSizes, radius, shadows, spacing } from "../../../styles/theme";

// O card "Atividades pendentes" do site mostra só as primeiras (a API já ordena pelo prazo)
const LIMITE_PENDENTES = 5;

interface Dados {
    // null = a rota daquele card falhou: só ele mostra o aviso
    tutorias: TutoriaAluno[] | null;
    pendentes: AtividadeAluno[] | null;
    desempenho: DesempenhoAluno | null;
    contestacoes: ContestacaoAluno[] | null;
}

interface CardResumoProps {
    icone: React.ComponentProps<typeof Feather>["name"];
    titulo: string;
    subtitulo?: string;
    onPress: () => void;
    children?: ReactNode;
}

// Card do Início no layout do Figma: ícone, título, resumo e a seta para a tela completa
function CardResumo({ icone, titulo, subtitulo, onPress, children }: CardResumoProps){
    return (
        <View style={styles.card}>
            <TouchableOpacity style={styles.cabecalho} onPress={onPress} accessibilityRole="button" accessibilityLabel={`${titulo}. ${subtitulo ?? ""}`}>
                <View style={styles.icone}>
                    <Feather name={icone} size={24} color={colors.white} />
                </View>

                <View style={styles.dados}>
                    <Text style={styles.titulo}>{titulo}</Text>
                    {subtitulo && <Text style={styles.subtitulo}>{subtitulo}</Text>}
                </View>

                <Feather name="chevron-right" size={22} color={colors.gray700} />
            </TouchableOpacity>

            {children}
        </View>
    )
}

const MSG_FALHA = "Não foi possível carregar.";

// Tela inicial do aluno (layout do print "Início", dados do site):
// Minha tutoria (A3 ativas), Atividades pendentes (A1), Minhas notas e evolução (A6)
// e Minhas contestações (A9), no lugar do card "Avaliações com Justificativa" do Figma
export default function Inicio({ navigation }: AlunoScreenProps<"PainelAluno">){
    const buscar = useCallback(async (): Promise<Dados> => {
        // Cada card busca a própria rota: se uma falhar, os outros continuam
        const [tutorias, pendentes, desempenho, contestacoes] = await Promise.all([
            api.get<TutoriaAluno[]>("/alunos/me/tutorias", { params: { status: "ativa" } }).then((r) => r.data).catch(() => null),
            api.get<AtividadeAluno[]>("/alunos/me/atividades", { params: { status: "pendente" } }).then((r) => r.data).catch(() => null),
            api.get<DesempenhoAluno>("/alunos/me/desempenho").then((r) => r.data).catch(() => null),
            api.get<ContestacaoAluno[]>("/alunos/me/contestacoes").then((r) => r.data).catch(() => null)
        ]);

        // Tudo falhou (ex.: sem conexão): a tela inteira mostra o erro com "Tentar novamente"
        if(!tutorias && !pendentes && !desempenho && !contestacoes){
            await api.get("/alunos/me/tutorias");
        }

        return { tutorias, pendentes, desempenho, contestacoes };
    }, [])

    const { dados, erro, carregando, atualizando, atualizar, tentarNovamente } = useBuscar(buscar);

    function conteudo(){
        if(carregando) return <Loader />;
        if(!dados) return <ErrorState message={getErrorMessage(erro)} onRetry={tentarNovamente} />;

        const { tutorias, desempenho, contestacoes } = dados;
        // A A1 também traz as pendentes de tutorias finalizadas, que não dá mais para responder
        const pendentes = dados.pendentes?.filter((atividade) => atividade.pode_responder) ?? null;
        const contestacoesPendentes = contestacoes?.filter((c) => c.status === "pendente").length ?? 0;
        const semNotas = desempenho?.por_etapa.every((item) => item.media === null) ?? true;

        let subtituloTutoria = MSG_FALHA;
        if(tutorias) subtituloTutoria = tutorias.length === 0 ? "Você ainda não tem tutoria ativa." : `Tutor: ${tutorias[0].tutor.nome}`;

        let subtituloPendentes = MSG_FALHA;
        if(pendentes) subtituloPendentes = pendentes.length === 0
            ? "Nenhuma atividade pendente."
            : `${pendentes.length} ${pendentes.length === 1 ? "atividade" : "atividades"}`;

        let subtituloContestacoes = MSG_FALHA;
        if(contestacoes) subtituloContestacoes = `${contestacoesPendentes} ${contestacoesPendentes === 1 ? "pendente" : "pendentes"}`;

        return (
            <>
                <CardResumo
                icone="user"
                titulo="Minha tutoria"
                subtitulo={subtituloTutoria}
                onPress={() => navigation.navigate("Tutoria", { screen: "MinhaTutoria" })}
                >
                    {tutorias?.map((tutoria) => (
                        <Text key={tutoria.id_tutoria} style={styles.linha}>
                            {tutorias.length > 1 ? `Tutor: ${tutoria.tutor.nome} · ` : ""}
                            Sala {tutoria.sala.nome} · Início: {formatarData(tutoria.data_inicio)}
                        </Text>
                    ))}
                </CardResumo>

                <CardResumo
                icone="clipboard"
                titulo="Atividades pendentes"
                subtitulo={subtituloPendentes}
                onPress={() => navigation.navigate("Atividades", { screen: "ListaAtividades" })}
                >
                    {pendentes?.slice(0, LIMITE_PENDENTES).map((atividade) => (
                        <TouchableOpacity
                        key={atividade.id_atividade}
                        style={styles.itemPendente}
                        onPress={() => navigation.navigate("DetalheAtividade", { id_atividade: atividade.id_atividade })}
                        accessibilityRole="button"
                        >
                            <Feather name="file-text" size={16} color={colors.red700} />
                            <Text style={styles.textoPendente} numberOfLines={1}>{atividade.titulo}</Text>
                            <Text style={styles.prazo}>{formatarData(atividade.data_entrega)}</Text>
                        </TouchableOpacity>
                    ))}
                </CardResumo>

                <CardResumo
                icone="bar-chart-2"
                titulo="Minhas notas e evolução"
                subtitulo={!desempenho ? MSG_FALHA : semNotas ? "Você ainda não tem notas lançadas." : undefined}
                onPress={() => navigation.navigate("Desempenho", { screen: "MeuDesempenho" })}
                >
                    {desempenho && !semNotas && <GraficoEtapas etapas={desempenho.por_etapa} />}
                </CardResumo>

                <CardResumo
                icone="shield"
                titulo="Minhas contestações"
                subtitulo={subtituloContestacoes}
                onPress={() => navigation.navigate("Desempenho", { screen: "MeuDesempenho" })}
                />
            </>
        )
    }

    return (
        <View style={styles.container}>
            <Header title="Início" />

            <ScrollView
            contentContainerStyle={styles.conteudo}
            refreshControl={
                <RefreshControl refreshing={atualizando} onRefresh={atualizar} colors={[colors.red700]} tintColor={colors.red700} />
            }
            >
                {/* Banner do site: mascote e boas-vindas */}
                <View style={styles.banner}>
                    <Image source={MASCOTES.telaInicial} style={styles.mascote} resizeMode="contain" accessibilityIgnoresInvertColors />
                    <Text style={styles.boasVindas}>Bem-vindo ao Protutal!</Text>
                </View>

                {conteudo()}
            </ScrollView>
        </View>
    )
}

const styles = StyleSheet.create({
    container:{
        flex: 1,
        backgroundColor: colors.white
    },
    conteudo:{
        flexGrow: 1,
        gap: spacing.lg,
        padding: spacing.lg
    },
    banner:{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        padding: spacing.lg,
        borderRadius: radius.card,
        backgroundColor: colors.wine800
    },
    mascote:{
        width: 72,
        height: 72
    },
    boasVindas:{
        flex: 1,
        fontFamily: fonts.semibold,
        fontSize: fontSizes.destaque,
        color: colors.white
    },
    card:{
        gap: spacing.md,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: colors.gray300,
        borderRadius: radius.card,
        backgroundColor: colors.white,
        ...shadows.cardLeve
    },
    cabecalho:{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md
    },
    icone:{
        width: 48,
        height: 48,
        borderRadius: radius.cardSm,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.gray700
    },
    dados:{
        flex: 1,
        gap: 2
    },
    titulo:{
        fontFamily: fonts.semibold,
        fontSize: fontSizes.tituloCard,
        color: colors.black
    },
    subtitulo:{
        fontFamily: fonts.regular,
        fontSize: 14,
        color: colors.gray700
    },
    linha:{
        fontFamily: fonts.regular,
        fontSize: 14,
        color: colors.black
    },
    itemPendente:{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderWidth: 1,
        borderColor: colors.gray300,
        borderRadius: radius.item
    },
    textoPendente:{
        flex: 1,
        fontFamily: fonts.medium,
        fontSize: 14,
        color: colors.black
    },
    prazo:{
        fontFamily: fonts.regular,
        fontSize: 12,
        color: colors.gray700
    }
})
