import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";

import { Header } from "../../../components/Header";
import { Card } from "../../../components/Card";
import { Badge } from "../../../components/Badge";
import { Loader } from "../../../components/Loader";
import { EmptyState } from "../../../components/EmptyState";
import { ErrorState } from "../../../components/ErrorState";
import { GraficoEtapas } from "../../../components/GraficoEtapas";
import { Etapa, FiltroEtapa } from "../../../components/FiltroEtapa";

import { api } from "../../../services/api";
import { useBuscar } from "../../../lib/useBuscar";
import { getErrorMessage } from "../../../lib/getErrorMessage";
import { formatarData, formatarNota } from "../../../lib/formatacao";
import { MASCOTES } from "../../../lib/mascotes";
import {
    ContestacaoAluno,
    ConteudosDominados,
    DesempenhoAluno,
    MediaConteudo,
    NotaAluno,
    StatusContestacao
} from "../../../lib/types";
import { AlunoScreenProps } from "../../../routes/aluno.routes";
import { colors, fonts, fontSizes, radius, spacing } from "../../../styles/theme";

// Status da contestação -> texto e cor do selo (mesmos textos do site)
export const SELO_CONTESTACAO: Record<StatusContestacao, { texto: string; variant: "neutro" | "sucesso" | "destaque" }> = {
    pendente: { texto: "Contestação pendente", variant: "neutro" },
    aceita: { texto: "Contestação aceita", variant: "sucesso" },
    recusada: { texto: "Contestação recusada", variant: "destaque" },
}

interface Dados {
    desempenho: DesempenhoAluno;
    // null = a rota falhou: a tela mostra o resto sem esse bloco
    conteudos: ConteudosDominados | null;
    contestacoes: ContestacaoAluno[] | null;
}

// A faixa vem da A7 (a tela não calcula faixa): procura o conteúdo em cada lista
function faixaDoConteudo(idConteudo: number, conteudos: ConteudosDominados | null){
    if(conteudos?.dominado?.some((item) => item.id_conteudo === idConteudo)) return "dominado"
    if(conteudos?.com_dificuldade?.some((item) => item.id_conteudo === idConteudo)) return "com_dificuldade"

    return null
}

function mensagemSemNotas(etapa: Etapa){
    return etapa
        ? `Você ainda não tem notas na ${etapa}ª etapa.`
        : "Suas notas aparecerão aqui quando o tutor corrigir suas atividades."
}

// Lista de conteúdos de uma faixa ("Conteúdos que já domino" / "Conteúdos a treinar")
function ListaFaixa({ conteudos, icone, cor, vazio }: { conteudos: MediaConteudo[]; icone: "check-circle" | "alert-circle"; cor: string; vazio: string }){
    if(conteudos.length === 0) return <Text style={styles.textoSecundario}>{vazio}</Text>;

    return (
        <>
            {conteudos.map((conteudo) => (
                <View key={conteudo.id_conteudo} style={styles.linhaConteudo}>
                    <Feather name={icone} size={18} color={cor} />
                    <Text style={styles.nomeConteudo}>{conteudo.nome}</Text>
                    <Text style={styles.mediaConteudo}>{formatarNota(conteudo.media)}</Text>
                </View>
            ))}
        </>
    )
}

// Tela "Meu desempenho" (rotas A6, A7 e A9), na ordem do print do Figma
// e com os blocos do site que não estão no print
export default function Desempenho({ navigation }: AlunoScreenProps<"MeuDesempenho">){
    const [etapa, setEtapa] = useState<Etapa>("");

    const buscar = useCallback(async (): Promise<Dados> => {
        const [desempenho, conteudos, contestacoes] = await Promise.all([
            api.get<DesempenhoAluno>("/alunos/me/desempenho", { params: etapa ? { etapa } : undefined }).then((r) => r.data),
            // A A7 e a A9 não têm filtro de etapa
            api.get<ConteudosDominados>("/alunos/me/conteudos-dominados").then((r) => r.data).catch(() => null),
            api.get<ContestacaoAluno[]>("/alunos/me/contestacoes").then((r) => r.data).catch(() => null)
        ]);

        return { desempenho, conteudos, contestacoes };
    }, [etapa])

    const { dados, erro, carregando, atualizando, atualizar, tentarNovamente } = useBuscar(buscar);

    function abrirAtividade(idAtividade: number){
        navigation.navigate("DetalheAtividade", { id_atividade: idAtividade });
    }

    function contestar(nota: NotaAluno){
        navigation.navigate("ContestarNota", {
            id_nota: nota.id_nota,
            id_atividade: nota.atividade.id_atividade,
            titulo: nota.atividade.titulo,
            detalhe: `${nota.conteudo.nome} · ${nota.atividade.etapa}ª etapa · ${formatarData(nota.data_lancamento)}`,
            valor: nota.valor
        });
    }

    function renderContestacoes(contestacoes: ContestacaoAluno[] | null){
        return (
            <Card title="Minhas contestações">
                {contestacoes === null && <Text style={styles.textoSecundario}>Não foi possível carregar as contestações.</Text>}
                {contestacoes?.length === 0 && <Text style={styles.textoSecundario}>Você não abriu nenhuma contestação.</Text>}

                {contestacoes?.map((contestacao) => (
                    <View key={contestacao.id_contestacao} style={styles.item}>
                        <Text style={styles.tituloItem}>{contestacao.atividade.titulo}</Text>
                        <Text style={styles.textoSecundario}>
                            {contestacao.atividade.conteudo.nome} · {contestacao.atividade.etapa}ª etapa · Tutor {contestacao.tutor.nome}
                        </Text>

                        <Badge label={SELO_CONTESTACAO[contestacao.status].texto} variant={SELO_CONTESTACAO[contestacao.status].variant} />

                        {/* "valor" é a nota atual: se a contestação foi aceita, já é a nota nova */}
                        <Text style={styles.texto}>
                            <Text style={styles.rotulo}>Nota{contestacao.status === "aceita" ? " atual" : ""}: </Text>
                            {formatarNota(contestacao.nota.valor)}
                        </Text>

                        <Text style={styles.rotulo}>Sua justificativa · enviada em {formatarData(contestacao.data_envio)}</Text>
                        <Text style={styles.texto}>{contestacao.comentario}</Text>

                        {contestacao.decisao && (
                            <>
                                <Text style={styles.rotulo}>
                                    Decisão do tutor{contestacao.data_resolucao ? ` · ${formatarData(contestacao.data_resolucao)}` : ""}
                                </Text>
                                <Text style={styles.texto}>{contestacao.decisao}</Text>
                            </>
                        )}
                    </View>
                ))}
            </Card>
        )
    }

    function conteudo(){
        if(carregando) return <Loader />;
        if(!dados) return <ErrorState message={getErrorMessage(erro)} onRetry={tentarNovamente} />;

        const { desempenho, conteudos, contestacoes } = dados;
        const { media, total_notas } = desempenho.media_geral;

        // Sem notas: só o aviso e o histórico de contestações (que não depende do filtro)
        if(total_notas === 0){
            return (
                <>
                    <EmptyState title={mensagemSemNotas(etapa)} image={MASCOTES.desempenho} />
                    {renderContestacoes(contestacoes)}
                </>
            )
        }

        // A A6 ordena por etapa; aqui a correção mais recente vem primeiro (datas ISO comparam como texto)
        const notas = [...desempenho.notas].sort((a, b) => b.data_lancamento.localeCompare(a.data_lancamento));

        return (
            <>
                <Card title="Média por etapa">
                    <GraficoEtapas etapas={desempenho.por_etapa} />
                </Card>

                <Card title={etapa ? `Média da ${etapa}ª etapa` : "Média geral"}>
                    <Text style={styles.media}>{media === null ? "—" : formatarNota(media)}</Text>

                    <View style={styles.numeros}>
                        <View style={styles.numero}>
                            <Text style={styles.valorNumero}>{total_notas}</Text>
                            <Text style={styles.rotulo}>Notas lançadas</Text>
                        </View>
                        <View style={styles.numero}>
                            <Text style={styles.valorNumero}>{conteudos ? conteudos.dominado?.length ?? 0 : "—"}</Text>
                            <Text style={styles.rotulo}>Conteúdos dominados</Text>
                        </View>
                        <View style={styles.numero}>
                            <Text style={styles.valorNumero}>{conteudos ? conteudos.com_dificuldade?.length ?? 0 : "—"}</Text>
                            <Text style={styles.rotulo}>Conteúdos com dificuldade</Text>
                        </View>
                    </View>
                </Card>

                {conteudos && (
                    <>
                        {/* A A7 não filtra por etapa: com filtro, a média é da etapa e a faixa é geral */}
                        {etapa !== "" && (
                            <Text style={styles.aviso}>A classificação Dominado/Com dificuldade considera todas as etapas.</Text>
                        )}

                        <Card title="Conteúdos que já domino" style={styles.cardDominado}>
                            <ListaFaixa conteudos={conteudos.dominado ?? []} icone="check-circle" cor={colors.green500} vazio="Nenhum conteúdo dominado ainda." />
                        </Card>

                        <Card title="Conteúdos a treinar" style={styles.cardTreinar}>
                            <ListaFaixa conteudos={conteudos.com_dificuldade ?? []} icone="alert-circle" cor={colors.red700} vazio="Nenhum conteúdo com dificuldade." />
                        </Card>
                    </>
                )}

                <Card title="Média por conteúdo">
                    {desempenho.por_conteudo.map((item) => {
                        const faixa = faixaDoConteudo(item.id_conteudo, conteudos);

                        return (
                            <View key={item.id_conteudo} style={styles.itemConteudo}>
                                <View style={styles.linhaConteudo}>
                                    <Text style={styles.nomeConteudo}>{item.nome}</Text>
                                    <Text style={styles.mediaConteudo}>{formatarNota(item.media)}</Text>
                                </View>

                                {faixa === "dominado" && <Badge label="Dominado" variant="sucesso" />}
                                {faixa === "com_dificuldade" && <Badge label="Com dificuldade" variant="destaque" />}

                                {/* Barra só visual: a média já está escrita ao lado */}
                                <View style={styles.trilho}>
                                    <View
                                    style={[
                                        styles.barra,
                                        faixa === "com_dificuldade" && styles.barraBaixa,
                                        { width: `${Math.min(Math.max(item.media, 0), 10) * 10}%` }
                                    ]}
                                    />
                                </View>
                            </View>
                        )
                    })}
                </Card>

                <Card title="Últimas atividades e notas">
                    {notas.map((nota) => (
                        <View key={nota.id_nota} style={styles.item}>
                            <View style={styles.linhaNota}>
                                <TouchableOpacity style={styles.dadosNota} onPress={() => abrirAtividade(nota.atividade.id_atividade)} accessibilityRole="link">
                                    <Text style={styles.tituloLink}>{nota.atividade.titulo}</Text>
                                    <Text style={styles.textoSecundario}>
                                        {nota.conteudo.nome} · {nota.atividade.etapa}ª etapa · Corrigida em {formatarData(nota.data_lancamento)}
                                    </Text>
                                </TouchableOpacity>

                                <Text style={styles.valorNota} accessibilityLabel={`Nota ${formatarNota(nota.valor)}`}>
                                    {formatarNota(nota.valor)}
                                </Text>
                            </View>

                            {nota.contestacao_status ? (
                                <Badge
                                label={SELO_CONTESTACAO[nota.contestacao_status].texto}
                                variant={SELO_CONTESTACAO[nota.contestacao_status].variant}
                                />
                            ) : (
                                <TouchableOpacity style={styles.botaoContestar} onPress={() => contestar(nota)} accessibilityRole="button">
                                    <Feather name="flag" size={16} color={colors.red700} />
                                    <Text style={styles.textoContestar}>Contestar nota</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    ))}
                </Card>

                {renderContestacoes(contestacoes)}
            </>
        )
    }

    return (
        <View style={styles.container}>
            <Header title="Meu desempenho" />

            <ScrollView
            contentContainerStyle={styles.conteudo}
            refreshControl={
                <RefreshControl refreshing={atualizando} onRefresh={atualizar} colors={[colors.red700]} tintColor={colors.red700} />
            }
            >
                <FiltroEtapa etapa={etapa} onChange={setEtapa} />
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
    media:{
        fontFamily: fonts.bold,
        fontSize: 44,
        color: colors.black
    },
    numeros:{
        flexDirection: "row",
        gap: spacing.sm
    },
    numero:{
        flex: 1,
        gap: 2
    },
    valorNumero:{
        fontFamily: fonts.semibold,
        fontSize: fontSizes.destaque,
        color: colors.red700
    },
    rotulo:{
        fontFamily: fonts.medium,
        fontSize: fontSizes.rotulo,
        color: colors.gray700
    },
    aviso:{
        padding: spacing.md,
        borderRadius: radius.item,
        backgroundColor: colors.gray100,
        fontFamily: fonts.regular,
        fontSize: 13,
        color: colors.gray700
    },
    cardDominado:{
        borderLeftWidth: 4,
        borderLeftColor: colors.green500
    },
    cardTreinar:{
        borderLeftWidth: 4,
        borderLeftColor: colors.red700
    },
    linhaConteudo:{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm
    },
    nomeConteudo:{
        flex: 1,
        fontFamily: fonts.medium,
        fontSize: 15,
        color: colors.black
    },
    mediaConteudo:{
        fontFamily: fonts.semibold,
        fontSize: 15,
        color: colors.black
    },
    itemConteudo:{
        gap: spacing.xs
    },
    trilho:{
        height: 8,
        borderRadius: radius.pill,
        backgroundColor: colors.gray300,
        overflow: "hidden"
    },
    barra:{
        height: "100%",
        borderRadius: radius.pill,
        backgroundColor: colors.green500
    },
    barraBaixa:{
        backgroundColor: colors.red700
    },
    item:{
        gap: spacing.xs,
        paddingBottom: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.gray300
    },
    tituloItem:{
        fontFamily: fonts.semibold,
        fontSize: 15,
        color: colors.black
    },
    linhaNota:{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md
    },
    dadosNota:{
        flex: 1,
        gap: 2
    },
    tituloLink:{
        fontFamily: fonts.semibold,
        fontSize: 15,
        color: colors.red700
    },
    valorNota:{
        fontFamily: fonts.bold,
        fontSize: fontSizes.destaque,
        color: colors.black
    },
    botaoContestar:{
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "flex-start",
        gap: spacing.xs,
        paddingVertical: spacing.xs
    },
    textoContestar:{
        fontFamily: fonts.medium,
        fontSize: 14,
        color: colors.red700
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
    }
})
