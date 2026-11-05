import React, { useCallback } from "react";
import { View, Text, Image, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";

import { Header } from "../../../components/Header";
import { CardResumo } from "../../../components/CardResumo";
import { Loader } from "../../../components/Loader";
import { ErrorState } from "../../../components/ErrorState";
import { GraficoEtapas } from "../../../components/GraficoEtapas";

import { api } from "../../../services/api";
import { useBuscar } from "../../../lib/useBuscar";
import { useContadores } from "../../../lib/useContadores";
import { getErrorMessage } from "../../../lib/getErrorMessage";
import { formatarNota } from "../../../lib/formatacao";
import { MASCOTES } from "../../../lib/mascotes";
import { AtividadeTutor, ContestacaoTutor, DesempenhoVinculo, TutoriaTutor } from "../../../lib/types";
import { TutorScreenProps } from "../../../routes/tutor.routes";
import { colors, fonts, fontSizes, radius, spacing } from "../../../styles/theme";

// Os cards do site mostram só os primeiros itens
const LIMITE = 5;

const MSG_FALHA = "Não foi possível carregar.";

interface Dados {
    // null = a rota daquele card falhou: só ele mostra o aviso
    tutorias: TutoriaTutor[] | null;
    atividades: AtividadeTutor[] | null;
    desempenho: DesempenhoVinculo[] | null;
    contestacoes: ContestacaoTutor[] | null;
}

// Tela inicial do tutor (layout do Figma "Início do tutor", cards do site em design/src/app/tutor/page.tsx):
// Minha tutoria (T1 ativas), Atividades pendentes (T2), Feedbacks recebidos (T6)
// e Contestações pendentes (P16). Contestações fica fora da barra de abas: abre por aqui
export default function Inicio({ navigation }: TutorScreenProps<"PainelTutor">){
    const buscar = useCallback(async (): Promise<Dados> => {
        // Cada card busca a própria rota: se uma falhar, os outros continuam
        const [tutorias, atividades, desempenho, contestacoes] = await Promise.all([
            api.get<TutoriaTutor[]>("/tutores/me/tutorias", { params: { status: "ativa" } }).then((r) => r.data).catch(() => null),
            api.get<AtividadeTutor[]>("/tutores/me/atividades").then((r) => r.data).catch(() => null),
            api.get<DesempenhoVinculo[]>("/tutores/me/desempenho").then((r) => r.data).catch(() => null),
            api.get<ContestacaoTutor[]>("/contestacoes", { params: { status: "pendente" } }).then((r) => r.data).catch(() => null)
        ]);

        // Tudo falhou (ex.: sem conexão): a tela inteira mostra o erro com "Tentar novamente"
        if(!tutorias && !atividades && !desempenho && !contestacoes){
            await api.get("/tutores/me/tutorias");
        }

        return { tutorias, atividades, desempenho, contestacoes };
    }, [])

    const { dados, erro, carregando, atualizando, atualizar, tentarNovamente } = useBuscar(buscar);
    const { menu } = useContadores();

    function conteudo(){
        if(carregando) return <Loader />;
        if(!dados) return <ErrorState message={getErrorMessage(erro)} onRetry={tentarNovamente} />;

        const { tutorias, desempenho, contestacoes } = dados;
        // Mesma regra do site: há entrega esperando nota
        const pendentes = dados.atividades?.filter((atividade) => atividade.total_entregues > atividade.total_com_nota) ?? null;
        // O card do site usa o primeiro vínculo ativo (a T6 já manda os ativos primeiro)
        const vinculo = desempenho?.find((item) => !item.revogado) ?? null;
        const semFeedback = !vinculo || vinculo.feedback.por_etapa.every((item) => item.media === null);

        let subtituloTutoria = MSG_FALHA;
        if(tutorias) subtituloTutoria = tutorias.length === 0
            ? "Nenhuma tutoria ativa no momento."
            : `${tutorias.length} ${tutorias.length === 1 ? "tutorado ativo" : "tutorados ativos"}`;

        let subtituloPendentes = MSG_FALHA;
        if(pendentes) subtituloPendentes = pendentes.length === 0
            ? "Nenhuma entrega esperando correção."
            : `${pendentes.length} ${pendentes.length === 1 ? "atividade" : "atividades"} para corrigir`;

        let subtituloFeedbacks = MSG_FALHA;
        if(desempenho) subtituloFeedbacks = semFeedback
            ? "Você ainda não recebeu feedbacks dos alunos."
            : `Média dos feedbacks dos alunos · Sala ${vinculo!.sala.nome}`;

        let subtituloContestacoes = MSG_FALHA;
        if(contestacoes) subtituloContestacoes = contestacoes.length === 0
            ? "Nenhuma contestação pendente."
            : `${contestacoes.length} ${contestacoes.length === 1 ? "pendente" : "pendentes"}`;

        return (
            <>
                <CardResumo
                icone="users"
                titulo="Minha tutoria"
                subtitulo={subtituloTutoria}
                onPress={() => navigation.navigate("Tutoria", { screen: "Tutorados" })}
                />

                <CardResumo
                icone="clipboard"
                titulo="Atividades pendentes"
                subtitulo={subtituloPendentes}
                onPress={() => navigation.navigate("Atividades", { screen: "ListaAtividadesTutor" })}
                >
                    {pendentes?.slice(0, LIMITE).map((atividade) => (
                        <TouchableOpacity
                        key={atividade.id_atividade}
                        style={styles.item}
                        onPress={() => navigation.navigate("CorrigirAtividade", { id_atividade: atividade.id_atividade })}
                        accessibilityRole="button"
                        >
                            <Feather name="file-text" size={16} color={colors.red700} />
                            <View style={styles.dadosItem}>
                                <Text style={styles.tituloItem} numberOfLines={1}>{atividade.titulo}</Text>
                                <Text style={styles.textoItem}>
                                    Sala {atividade.sala.nome} · {atividade.total_entregues - atividade.total_com_nota} para corrigir
                                </Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </CardResumo>

                <CardResumo
                icone="message-square"
                titulo="Feedbacks recebidos"
                subtitulo={subtituloFeedbacks}
                onPress={() => navigation.navigate("Feedbacks", { screen: "FeedbacksRecebidos" })}
                >
                    {vinculo && !semFeedback && <GraficoEtapas etapas={vinculo.feedback.por_etapa} />}
                </CardResumo>

                <CardResumo
                icone="flag"
                titulo="Contestações pendentes"
                subtitulo={subtituloContestacoes}
                // Contestações não é aba no app: a bolinha do menu "Contestações" do site fica aqui
                contador={menu.contestacoes}
                onPress={() => navigation.navigate("Contestacoes")}
                >
                    {contestacoes?.slice(0, LIMITE).map((contestacao) => (
                        <TouchableOpacity
                        key={contestacao.id_contestacao}
                        style={styles.item}
                        onPress={() => navigation.navigate("Contestacoes")}
                        accessibilityRole="button"
                        >
                            <Feather name="flag" size={16} color={colors.red700} />
                            <View style={styles.dadosItem}>
                                <Text style={styles.tituloItem} numberOfLines={1}>{contestacao.atividade.titulo}</Text>
                                <Text style={styles.textoItem}>
                                    {contestacao.aluno.nome} · nota {formatarNota(contestacao.nota.valor)}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </CardResumo>
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
    item:{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderWidth: 1,
        borderColor: colors.gray300,
        borderRadius: radius.item
    },
    dadosItem:{
        flex: 1
    },
    tituloItem:{
        fontFamily: fonts.medium,
        fontSize: 14,
        color: colors.black
    },
    textoItem:{
        fontFamily: fonts.regular,
        fontSize: 12,
        color: colors.gray700
    }
})
