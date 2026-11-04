import React, { useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";

import { Header } from "../../../components/Header";
import { Card } from "../../../components/Card";
import { Badge } from "../../../components/Badge";
import { Avatar } from "../../../components/Avatar";
import { Button } from "../../../components/Button";
import { Loader } from "../../../components/Loader";
import { EmptyState } from "../../../components/EmptyState";
import { ErrorState } from "../../../components/ErrorState";
import { ItemAviso } from "../../../components/ItemAviso";

import { api } from "../../../services/api";
import { useBuscar } from "../../../lib/useBuscar";
import { getErrorMessage, getErrorStatus } from "../../../lib/getErrorMessage";
import { formatarData, formatarNota } from "../../../lib/formatacao";
import { MASCOTES } from "../../../lib/mascotes";
import { AvisoSala, DesempenhoAluno, NotaAluno, TutoriaAluno } from "../../../lib/types";
import { AlunoScreenProps } from "../../../routes/aluno.routes";
import { colors, fonts, fontSizes, radius, spacing } from "../../../styles/theme";

interface Dados {
    // null = o id não está na lista do aluno (não existe ou não é dele)
    tutoria: TutoriaAluno | null;
    // null = a rota falhou; "sem_acesso" = 403 da A4 (o aluno não está matriculado na sala)
    ultimaNota: NotaAluno | null | undefined;
    avisos: AvisoSala[] | "sem_acesso" | null;
}

// Tela "Detalhe da tutoria" (sem print no Figma: segue os blocos do site).
// Não existe rota de detalhe de tutoria: procura o id na lista do aluno (A3).
// Com a sala da tutoria, busca a última correção (A6 ?id_sala=) e os avisos (A4)
export default function DetalheTutoria({ navigation, route }: AlunoScreenProps<"DetalheTutoria">){
    const { id_tutoria } = route.params;

    const buscar = useCallback(async (): Promise<Dados> => {
        const tutorias = (await api.get<TutoriaAluno[]>("/alunos/me/tutorias")).data;
        const tutoria = tutorias.find((item) => item.id_tutoria === id_tutoria) ?? null;

        if(!tutoria) return { tutoria, ultimaNota: undefined, avisos: null };

        const idSala = tutoria.sala.id_sala;

        const [desempenho, avisos] = await Promise.all([
            api.get<DesempenhoAluno>("/alunos/me/desempenho", { params: { id_sala: idSala } }).then((r) => r.data).catch(() => null),
            api.get<AvisoSala[]>(`/salas/${idSala}/avisos`).then((r) => r.data).catch((err: unknown) =>
                getErrorStatus(err) === 403 ? "sem_acesso" as const : null
            )
        ]);

        // A A6 ordena por etapa; aqui vale a data de lançamento mais recente. undefined = falhou
        const ultimaNota = desempenho === null
            ? undefined
            : desempenho.notas.reduce<NotaAluno | null>(
                (maisRecente, nota) => !maisRecente || nota.data_lancamento > maisRecente.data_lancamento ? nota : maisRecente,
                null
            );

        return { tutoria, ultimaNota, avisos };
    }, [id_tutoria])

    const { dados, erro, carregando, atualizando, atualizar, tentarNovamente } = useBuscar(buscar);

    function conteudo(){
        if(carregando) return <Loader />;
        if(!dados) return <ErrorState message={getErrorMessage(erro)} onRetry={tentarNovamente} />;

        const { tutoria, ultimaNota, avisos } = dados;

        if(!tutoria){
            return (
                <View style={styles.bloco}>
                    <EmptyState image={MASCOTES.badRequest} title="Tutoria não encontrada." />
                    <Button title="Voltar para Minhas tutorias" variant="secundario" onPress={navigation.goBack} />
                </View>
            )
        }

        const ativa = tutoria.status === "ativa";
        // A A4 já manda o mais recente primeiro; a ordenação só garante isso
        const listaAvisos = Array.isArray(avisos)
            ? [...avisos].sort((a, b) => b.data_publicacao.localeCompare(a.data_publicacao))
            : [];

        return (
            <>
                <Card>
                    <View style={styles.linhaTopo}>
                        <View style={styles.bloco}>
                            <Text style={styles.texto}><Text style={styles.rotulo}>Data de início: </Text>{formatarData(tutoria.data_inicio)}</Text>
                            {!ativa && tutoria.data_fim && (
                                <Text style={styles.texto}><Text style={styles.rotulo}>Data de fim: </Text>{formatarData(tutoria.data_fim)}</Text>
                            )}
                            <Text style={styles.texto}><Text style={styles.rotulo}>Sala: </Text>{tutoria.sala.nome}</Text>
                        </View>

                        <Badge label={ativa ? "Ativa" : "Finalizada"} variant={ativa ? "sucesso" : "neutro"} />
                    </View>

                    <Text style={styles.texto}>
                        <Text style={styles.rotulo}>Meta de aprendizagem: </Text>
                        {tutoria.meta_aprendizagem}
                    </Text>
                </Card>

                <Card title="Converse com o seu tutor">
                    <View style={styles.tutor}>
                        <Avatar nome={tutoria.tutor.nome} tamanho="grande" />
                        <Text style={styles.nomeTutor}>{tutoria.tutor.nome}</Text>
                    </View>

                    <Button
                    title="Abrir chat e materiais"
                    onPress={() => navigation.navigate("ChatTutoria", { id_tutoria: tutoria.id_tutoria })}
                    />
                </Card>

                <TouchableOpacity
                style={styles.atalho}
                onPress={() => navigation.navigate("ConteudosAprendidos", { id_sala: tutoria.sala.id_sala, nome_sala: tutoria.sala.nome })}
                accessibilityRole="button"
                >
                    <Feather name="check-circle" size={22} color={colors.green500} />
                    <View style={styles.bloco}>
                        <Text style={styles.tituloAtalho}>Conteúdos aprendidos</Text>
                        <Text style={styles.textoSecundario}>O que você já domina e o que precisa reforçar nesta sala</Text>
                    </View>
                    <Feather name="chevron-right" size={20} color={colors.gray700} />
                </TouchableOpacity>

                <Card title="Última correção do tutor">
                    {ultimaNota === undefined && <Text style={styles.textoSecundario}>Não foi possível carregar a última correção.</Text>}
                    {ultimaNota === null && <Text style={styles.textoSecundario}>Nenhuma atividade corrigida ainda.</Text>}

                    {ultimaNota && (
                        <View style={styles.bloco}>
                            <Text style={styles.tituloItem}>{ultimaNota.atividade.titulo}</Text>
                            <Text style={styles.textoSecundario}>Corrigida em {formatarData(ultimaNota.data_lancamento)}</Text>
                            {ultimaNota.comentario && <Text style={styles.texto}>{ultimaNota.comentario}</Text>}
                            <Text style={styles.texto}><Text style={styles.rotulo}>Nota: </Text>{formatarNota(ultimaNota.valor)}</Text>

                            <TouchableOpacity
                            style={styles.link}
                            onPress={() => navigation.navigate("DetalheAtividade", { id_atividade: ultimaNota.atividade.id_atividade })}
                            accessibilityRole="link"
                            >
                                <Text style={styles.textoLink}>Ver atividade</Text>
                                <Feather name="chevron-right" size={18} color={colors.red700} />
                            </TouchableOpacity>
                        </View>
                    )}
                </Card>

                <Card title="Avisos da sala">
                    {avisos === null && <Text style={styles.textoSecundario}>Não foi possível carregar os avisos.</Text>}
                    {avisos === "sem_acesso" && <Text style={styles.textoSecundario}>Você não tem acesso aos avisos desta sala.</Text>}
                    {Array.isArray(avisos) && avisos.length === 0 && <Text style={styles.textoSecundario}>Nenhum aviso publicado.</Text>}

                    {listaAvisos.map((aviso) => <ItemAviso key={aviso.id_aviso} aviso={aviso} />)}
                </Card>

                {/* A A10 recusa feedback de tutoria finalizada (409): o botão só aparece na ativa */}
                {ativa && (
                    <Button
                    title="Avaliar meu tutor"
                    variant="secundario"
                    onPress={() => navigation.navigate("FeedbackTutor", { id_tutoria: tutoria.id_tutoria })}
                    />
                )}
            </>
        )
    }

    return (
        <View style={styles.container}>
            <Header title="Tutoria" onBack={navigation.goBack} />

            <ScrollView
            contentContainerStyle={styles.conteudo}
            refreshControl={
                <RefreshControl refreshing={atualizando} onRefresh={atualizar} colors={[colors.red700]} tintColor={colors.red700} />
            }
            >
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
    bloco:{
        flex: 1,
        gap: spacing.xs
    },
    linhaTopo:{
        flexDirection: "row",
        alignItems: "flex-start",
        gap: spacing.md
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
    tutor:{
        alignItems: "center",
        gap: spacing.sm
    },
    nomeTutor:{
        fontFamily: fonts.semibold,
        fontSize: fontSizes.base,
        color: colors.black
    },
    atalho:{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: colors.gray300,
        borderLeftWidth: 4,
        borderLeftColor: colors.green500,
        borderRadius: radius.cardSm,
        backgroundColor: colors.white
    },
    tituloAtalho:{
        fontFamily: fonts.semibold,
        fontSize: fontSizes.tituloCard,
        color: colors.red700
    },
    tituloItem:{
        fontFamily: fonts.semibold,
        fontSize: 15,
        color: colors.black
    },
    link:{
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "flex-start",
        gap: 2,
        marginTop: spacing.xs
    },
    textoLink:{
        fontFamily: fonts.medium,
        fontSize: 14,
        color: colors.red700
    }
})
