import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, SectionList, RefreshControl, TouchableOpacity, Linking } from "react-native";
import { Feather } from "@expo/vector-icons";

import { Header } from "../../../components/Header";
import { Avatar } from "../../../components/Avatar";
import { Badge } from "../../../components/Badge";
import { Button } from "../../../components/Button";
import { Janela } from "../../../components/Janela";
import { Loader } from "../../../components/Loader";
import { EmptyState } from "../../../components/EmptyState";
import { ErrorState } from "../../../components/ErrorState";

import { api } from "../../../services/api";
import { useBuscar } from "../../../lib/useBuscar";
import { getErrorMessage } from "../../../lib/getErrorMessage";
import { MASCOTES } from "../../../lib/mascotes";
import { formatarDataHora, formatarNota, rotuloTipo } from "../../../lib/formatacao";
import { RespostaAlunoAtividade, RespostasAtividade, TipoAtividadeOpcao } from "../../../lib/types";
import { ProfessorScreenProps } from "../../../routes/professor.routes";
import { colors, fonts, fontSizes, radius, shadows, spacing } from "../../../styles/theme";

const STATUS = {
    pendente: "Não enviou",
    entregue: "Entregue",
    entregue_com_atraso: "Entregue com atraso",
}

interface Dados {
    atividade: RespostasAtividade;
    tipos: TipoAtividadeOpcao[];
}

interface Secao {
    titulo: string;
    vazio: string;
    enviaram: boolean;
    data: RespostaAlunoAtividade[];
}

// Detalhe da atividade do professor (Figma "Acompanhamento"; site: atividades/[id_atividade]):
// P12 (GET /atividades/:id/respostas) com quem enviou ("Ver envio") e quem ainda não enviou.
// O professor SÓ VISUALIZA: a nota aparece como texto, sem campo de edição
export default function DetalheAtividade({ navigation, route }: ProfessorScreenProps<"DetalheAtividadeProfessor">){
    const { id_atividade } = route.params;
    const [aberto, setAberto] = useState<RespostaAlunoAtividade | null>(null);

    const buscar = useCallback(async (): Promise<Dados> => {
        const [atividade, tipos] = await Promise.all([
            api.get<RespostasAtividade>(`/atividades/${id_atividade}/respostas`).then((r) => r.data),
            api.get<TipoAtividadeOpcao[]>("/tipos-atividade").then((r) => r.data).catch(() => [])
        ]);

        return { atividade, tipos };
    }, [id_atividade])

    const { dados, erro, carregando, atualizando, atualizar, tentarNovamente } = useBuscar(buscar);

    const alunos = dados?.atividade.alunos ?? [];
    const enviaram = alunos.filter((a) => a.resposta !== null);
    const naoEnviaram = alunos.filter((a) => a.resposta === null);

    const secoes: Secao[] = dados ? [
        { titulo: `Alunos que enviaram (${enviaram.length})`, vazio: "Nenhum aluno enviou esta atividade ainda.", enviaram: true, data: enviaram },
        { titulo: `Ainda não enviaram (${naoEnviaram.length})`, vazio: "Todos os alunos enviaram.", enviaram: false, data: naoEnviaram },
    ] : [];

    function renderItem({ item, section }: { item: RespostaAlunoAtividade; section: Secao }){
        return (
            <View style={styles.item}>
                <Avatar nome={item.aluno.nome} />
                <View style={styles.dados}>
                    <Text style={styles.nome}>{item.aluno.nome}</Text>
                    {section.enviaram && (
                        <Badge label={STATUS[item.status]} variant={item.status === "entregue" ? "sucesso" : "neutro"} />
                    )}
                    {/* Depois do prazo o tutor pode lançar nota mesmo sem entrega */}
                    {!section.enviaram && item.nota && <Text style={styles.detalhe}>Nota {formatarNota(item.nota.valor)}</Text>}
                </View>
                {section.enviaram && (
                    <Button title="Ver envio" variant="secundario" style={styles.botao} onPress={() => setAberto(item)} />
                )}
            </View>
        )
    }

    function conteudoVazio(){
        if(carregando) return <Loader />;
        if(!dados) return <ErrorState message={getErrorMessage(erro)} onRetry={tentarNovamente} />;

        return null;
    }

    return (
        <View style={styles.container}>
            <Header title="Atividade" onBack={navigation.goBack} onNotificacoes={() => navigation.navigate("Notificacoes")} />

            <SectionList
            sections={carregando ? [] : secoes}
            keyExtractor={(item) => String(item.aluno.id_aluno)}
            renderItem={renderItem}
            renderSectionHeader={({ section }) => <Text style={styles.secao}>{section.titulo}</Text>}
            renderSectionFooter={({ section }) => section.data.length === 0
                ? <EmptyState title={section.vazio} image={MASCOTES.atividades} />
                : null}
            stickySectionHeadersEnabled={false}
            contentContainerStyle={styles.lista}
            ItemSeparatorComponent={() => <View style={styles.separador} />}
            ListHeaderComponent={dados && !carregando ? (
                <View style={styles.topo}>
                    <Text style={styles.titulo}>{dados.atividade.titulo}</Text>
                    <Text style={styles.detalhe}>
                        {rotuloTipo(dados.atividade.tipo, dados.tipos)} · prazo {formatarDataHora(dados.atividade.data_entrega)}
                    </Text>
                </View>
            ) : null}
            ListEmptyComponent={conteudoVazio()}
            refreshControl={
                <RefreshControl refreshing={atualizando} onRefresh={atualizar} colors={[colors.red700]} tintColor={colors.red700} />
            }
            />

            {/* "Envio do aluno" do site */}
            <Janela visivel={aberto !== null} titulo="Envio do aluno" onClose={() => setAberto(null)}>
                {aberto?.resposta && (
                    <>
                        <Dado rotulo="Aluno" valor={aberto.aluno.nome} />
                        <Dado rotulo="Enviado em" valor={`${formatarDataHora(aberto.resposta.data_envio)} · ${STATUS[aberto.status]}`} />
                        {aberto.resposta.texto && <Dado rotulo="Texto do aluno" valor={aberto.resposta.texto} />}

                        {aberto.resposta.conteudo_file && (
                            <View style={styles.dado}>
                                <Text style={styles.rotulo}>Arquivo enviado</Text>
                                <TouchableOpacity
                                style={styles.link}
                                onPress={() => Linking.openURL(aberto.resposta!.conteudo_file!)}
                                accessibilityRole="link"
                                >
                                    <Feather name="download" size={18} color={colors.red700} />
                                    <Text style={styles.textoLink}>Baixar arquivo</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        <Dado rotulo="Nota" valor={aberto.nota ? formatarNota(aberto.nota.valor) : "Sem nota"} destaque />
                        {aberto.nota?.comentario && <Dado rotulo="Comentário do tutor" valor={aberto.nota.comentario} />}
                    </>
                )}
            </Janela>
        </View>
    )
}

function Dado({ rotulo, valor, destaque }: { rotulo: string; valor: string; destaque?: boolean }){
    return (
        <View style={styles.dado}>
            <Text style={styles.rotulo}>{rotulo}</Text>
            <Text style={[styles.valor, destaque && styles.valorDestaque]}>{valor}</Text>
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
        gap: spacing.xs,
        marginBottom: spacing.md
    },
    titulo:{
        fontFamily: fonts.semibold,
        fontSize: fontSizes.destaque,
        color: colors.black
    },
    secao:{
        marginTop: spacing.md,
        marginBottom: spacing.sm,
        fontFamily: fonts.semibold,
        fontSize: fontSizes.tituloCard,
        color: colors.red700
    },
    separador:{
        height: spacing.md
    },
    item:{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: colors.gray300,
        borderRadius: radius.cardSm,
        backgroundColor: colors.white,
        ...shadows.cardLeve
    },
    dados:{
        flex: 1,
        gap: spacing.xs
    },
    nome:{
        fontFamily: fonts.semibold,
        fontSize: fontSizes.base,
        color: colors.black
    },
    detalhe:{
        fontFamily: fonts.regular,
        fontSize: 13,
        color: colors.gray700
    },
    // Botão pequeno ao lado do nome, em vez dos 100% do Button
    botao:{
        width: "auto"
    },
    dado:{
        gap: 2
    },
    rotulo:{
        fontFamily: fonts.medium,
        fontSize: fontSizes.rotulo,
        color: colors.gray700
    },
    valor:{
        fontFamily: fonts.regular,
        fontSize: 15,
        color: colors.black
    },
    valorDestaque:{
        fontFamily: fonts.bold,
        fontSize: fontSizes.destaque,
        color: colors.red700
    },
    link:{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.xs
    },
    textoLink:{
        fontFamily: fonts.medium,
        fontSize: 15,
        color: colors.red700
    }
})
