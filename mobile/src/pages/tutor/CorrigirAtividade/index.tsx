import React, { useCallback, useState } from "react";
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
import { ResumoAtividade } from "../../../components/ResumoAtividade";
import { ModalEnvio } from "./ModalEnvio";

import { api } from "../../../services/api";
import { useBuscar } from "../../../lib/useBuscar";
import { getErrorMessage, getErrorStatus } from "../../../lib/getErrorMessage";
import { formatarDataHora, formatarNota, rotuloTipo } from "../../../lib/formatacao";
import { MASCOTES } from "../../../lib/mascotes";
import {
    AtividadeDetalhe,
    AtividadeDetalheTutor,
    RespostaAlunoAtividade,
    RespostasAtividade,
    StatusEntrega,
    TipoAtividadeOpcao
} from "../../../lib/types";
import { TutorScreenProps } from "../../../routes/tutor.routes";
import { colors, fonts, fontSizes, radius, spacing } from "../../../styles/theme";

// Mesmos rótulos do site para o status calculado pela API
const ROTULO_STATUS: Record<StatusEntrega, string> = {
    pendente: "Não enviou",
    entregue: "Entregue",
    entregue_com_atraso: "Entregue com atraso",
}

type Dados =
    | { atividade: AtividadeDetalheTutor; respostas: RespostasAtividade; tipos: TipoAtividadeOpcao[] }
    // A2 com perfil de aluno: esta tela é só do tutor que criou a atividade
    | { atividade: null };

// Tela "Corrigir atividade" (layout do Figma, regras do site em /tutor/atividades/:id):
// dados da atividade (A2), entregas e notas de cada destinatário (P12) e, ao tocar no aluno,
// o envio dele com o lançamento da nota e do comentário (devolutiva) pela rota T3
export default function CorrigirAtividade({ navigation, route }: TutorScreenProps<"CorrigirAtividade">){
    const { id_atividade } = route.params;
    const [selecionado, setSelecionado] = useState<RespostaAlunoAtividade | null>(null);

    const buscar = useCallback(async (): Promise<Dados> => {
        const [atividade, respostas, tipos] = await Promise.all([
            api.get<AtividadeDetalhe>(`/atividades/${id_atividade}`).then((r) => r.data),
            api.get<RespostasAtividade>(`/atividades/${id_atividade}/respostas`).then((r) => r.data),
            api.get<TipoAtividadeOpcao[]>("/tipos-atividade").then((r) => r.data).catch(() => [])
        ]);

        if(atividade.perfil !== "tutor") return { atividade: null };

        return { atividade, respostas, tipos };
    }, [id_atividade])

    // 400/403/404 = atividade inexistente ou de outro tutor: é um estado da tela, sem toast
    const { dados, erro, carregando, atualizando, atualizar, tentarNovamente } = useBuscar(buscar, { semToast: [400, 403, 404] });

    function renderAluno(item: RespostaAlunoAtividade){
        return (
            <TouchableOpacity
            key={item.aluno.id_aluno}
            style={styles.aluno}
            onPress={() => setSelecionado(item)}
            accessibilityRole="button"
            accessibilityLabel={`${item.aluno.nome}. Ver envio`}
            >
                <Avatar nome={item.aluno.nome} />

                <View style={styles.dadosAluno}>
                    <Text style={styles.nome}>{item.aluno.nome}</Text>
                    {item.resposta && <Text style={styles.textoSecundario}>Enviado em {formatarDataHora(item.resposta.data_envio)}</Text>}

                    <View style={styles.selos}>
                        <Badge label={ROTULO_STATUS[item.status]} variant={item.status === "pendente" ? "neutro" : "destaque"} />
                        <Badge label={item.nota ? "Com nota" : "Sem nota"} variant={item.nota ? "sucesso" : "neutro"} />
                    </View>
                </View>

                <View style={styles.nota}>
                    <Text style={styles.rotuloNota}>Nota</Text>
                    <Text style={styles.valorNota}>{item.nota ? formatarNota(item.nota.valor) : "—"}</Text>
                </View>

                <Feather name="chevron-right" size={20} color={colors.gray700} />
            </TouchableOpacity>
        )
    }

    function conteudo(){
        if(carregando) return <Loader />;

        const status = getErrorStatus(erro);
        const indisponivel = (!dados && (status === 400 || status === 403 || status === 404)) || (dados && !dados.atividade);

        if(indisponivel){
            return (
                <View style={styles.bloco}>
                    <EmptyState image={MASCOTES.badRequest} title="Atividade não encontrada ou você não tem acesso a ela." />
                    <Button title="Voltar para Atividades" variant="secundario" onPress={navigation.goBack} />
                </View>
            )
        }

        if(!dados || !dados.atividade) return <ErrorState message={getErrorMessage(erro)} onRetry={tentarNovamente} />;

        const { atividade, respostas, tipos } = dados;
        const prazoVencido = new Date(atividade.data_entrega).getTime() < Date.now();
        const enviaram = respostas.alunos.filter((item) => item.resposta);
        const naoEnviaram = respostas.alunos.filter((item) => !item.resposta);

        const detalhe = [
            atividade.conteudo?.nome,
            `${atividade.etapa}ª etapa`,
            rotuloTipo(atividade.tipo, tipos),
            `Sala ${atividade.sala.nome}`
        ].filter(Boolean).join(" · ");

        return (
            <>
                <ResumoAtividade titulo={atividade.titulo} detalhe={detalhe} />

                {atividade.descricao && (
                    <Card title="Descrição">
                        <Text style={styles.texto}>{atividade.descricao}</Text>
                    </Card>
                )}

                <Card title="Prazo de entrega">
                    <View style={styles.linha}>
                        <Feather name="calendar" size={18} color={colors.gray700} />
                        <Text style={styles.texto}>{formatarDataHora(atividade.data_entrega)}</Text>
                        {prazoVencido && <Badge label="Prazo encerrado" />}
                    </View>
                </Card>

                <Card title="Alunos que enviaram:">
                    {enviaram.length === 0
                        ? <Text style={styles.textoSecundario}>Nenhum aluno enviou esta atividade ainda.</Text>
                        : enviaram.map(renderAluno)}
                </Card>

                {naoEnviaram.length > 0 && (
                    <Card title="Ainda não enviaram:">
                        {naoEnviaram.map(renderAluno)}
                    </Card>
                )}

                <Button title="Ver contestações de nota" variant="secundario" onPress={() => navigation.navigate("Contestacoes")} />

                <ModalEnvio
                idAtividade={atividade.id_atividade}
                item={selecionado}
                prazo={atividade.data_entrega}
                onClose={() => setSelecionado(null)}
                onNotaLancada={atualizar}
                />
            </>
        )
    }

    return (
        <View style={styles.container}>
            <Header title="Corrigir atividade" onBack={navigation.goBack} />

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
        gap: spacing.lg
    },
    linha:{
        flexDirection: "row",
        alignItems: "center",
        flexWrap: "wrap",
        gap: spacing.sm
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
    aluno:{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: colors.gray300,
        borderRadius: radius.item
    },
    dadosAluno:{
        flex: 1,
        gap: spacing.xs
    },
    nome:{
        fontFamily: fonts.semibold,
        fontSize: fontSizes.base,
        color: colors.black
    },
    selos:{
        flexDirection: "row",
        flexWrap: "wrap",
        gap: spacing.xs
    },
    nota:{
        alignItems: "center"
    },
    rotuloNota:{
        fontFamily: fonts.medium,
        fontSize: fontSizes.selo,
        color: colors.gray700
    },
    valorNota:{
        fontFamily: fonts.semibold,
        fontSize: fontSizes.destaque,
        color: colors.black
    }
})
