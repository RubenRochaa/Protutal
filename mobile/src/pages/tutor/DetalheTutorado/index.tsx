import React, { useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, RefreshControl } from "react-native";

import { Header } from "../../../components/Header";
import { Card } from "../../../components/Card";
import { Badge } from "../../../components/Badge";
import { Avatar } from "../../../components/Avatar";
import { Button } from "../../../components/Button";
import { Loader } from "../../../components/Loader";
import { EmptyState } from "../../../components/EmptyState";
import { ErrorState } from "../../../components/ErrorState";

import { api } from "../../../services/api";
import { useBuscar } from "../../../lib/useBuscar";
import { getErrorMessage } from "../../../lib/getErrorMessage";
import { formatarData } from "../../../lib/formatacao";
import { MASCOTES } from "../../../lib/mascotes";
import { TutoriaTutor } from "../../../lib/types";
import { TutorScreenProps } from "../../../routes/tutor.routes";
import { colors, fonts, fontSizes, spacing } from "../../../styles/theme";

// Tela "Tutoria do aluno" (layout do Figma "Perfil do aluno").
// Não existe rota de detalhe nem de notas do tutorado para o tutor: a tela mostra só
// o que a T1 devolve (o id é procurado na lista) e os atalhos da tutoria
export default function DetalheTutorado({ navigation, route }: TutorScreenProps<"DetalheTutorado">){
    const { id_tutoria } = route.params;

    const buscar = useCallback(async () => {
        const tutorias = (await api.get<TutoriaTutor[]>("/tutores/me/tutorias")).data;

        return tutorias.find((item) => item.id_tutoria === id_tutoria) ?? null;
    }, [id_tutoria])

    const { dados: tutoria, erro, carregando, atualizando, atualizar, tentarNovamente } = useBuscar(buscar);

    function conteudo(){
        if(carregando) return <Loader />;
        // dados null também quer dizer "não encontrada"; com erro, foi a busca que falhou
        if(erro && !tutoria) return <ErrorState message={getErrorMessage(erro)} onRetry={tentarNovamente} />;

        if(!tutoria){
            return (
                <View style={styles.bloco}>
                    <EmptyState image={MASCOTES.badRequest} title="Tutoria não encontrada." />
                    <Button title="Voltar" variant="secundario" onPress={navigation.goBack} />
                </View>
            )
        }

        const ativa = tutoria.status === "ativa";
        const sala = { id_sala: tutoria.sala.id_sala, nome_sala: tutoria.sala.nome };

        return (
            <>
                <Card>
                    <View style={styles.perfil}>
                        <Avatar nome={tutoria.aluno.nome} tamanho="grande" />

                        <View style={styles.bloco}>
                            <Text style={styles.nome}>{tutoria.aluno.nome}</Text>
                            <Text style={styles.texto}>Sala {tutoria.sala.nome} ({tutoria.sala.serie}ª série)</Text>
                            <Text style={styles.texto}>
                                <Text style={styles.rotulo}>Data de início: </Text>{formatarData(tutoria.data_inicio)}
                            </Text>
                            {tutoria.data_fim && (
                                <Text style={styles.texto}><Text style={styles.rotulo}>Fim: </Text>{formatarData(tutoria.data_fim)}</Text>
                            )}
                        </View>
                    </View>

                    <View style={styles.status}>
                        <Badge label={ativa ? "Ativa" : "Finalizada"} variant={ativa ? "sucesso" : "neutro"} />
                    </View>
                </Card>

                <Card title="Meta de aprendizagem">
                    <Text style={styles.texto}>{tutoria.meta_aprendizagem || "Sem meta definida"}</Text>
                </Card>

                <Button title="Abrir chat" onPress={() => navigation.navigate("ChatTutorado", { id_tutoria })} />

                {ativa && (
                    <Button
                    title="+ Nova atividade"
                    variant="secundario"
                    onPress={() => navigation.navigate("NovaAtividade", { id_tutoria })}
                    />
                )}

                <Button title="Materiais da sala" variant="secundario" onPress={() => navigation.navigate("MateriaisSala", sala)} />
                <Button title="Avisos da sala" variant="secundario" onPress={() => navigation.navigate("AvisosSala", sala)} />
            </>
        )
    }

    return (
        <View style={styles.container}>
            <Header title="Tutoria do aluno" onBack={navigation.goBack} />

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
    perfil:{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.lg
    },
    status:{
        alignItems: "flex-end"
    },
    nome:{
        fontFamily: fonts.semibold,
        fontSize: fontSizes.destaque,
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
    }
})
