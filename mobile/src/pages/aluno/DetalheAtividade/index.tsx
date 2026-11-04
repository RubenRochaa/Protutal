import React, { useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    RefreshControl,
    KeyboardAvoidingView,
    Platform,
    TouchableOpacity,
    Linking
} from "react-native";
import { Feather } from "@expo/vector-icons";

import { Header } from "../../../components/Header";
import { Card } from "../../../components/Card";
import { Badge } from "../../../components/Badge";
import { Button } from "../../../components/Button";
import { Loader } from "../../../components/Loader";
import { EmptyState } from "../../../components/EmptyState";
import { ErrorState } from "../../../components/ErrorState";
import { ResumoAtividade } from "../../../components/ResumoAtividade";
import { FormResposta } from "./FormResposta";

import { api } from "../../../services/api";
import { useBuscar } from "../../../lib/useBuscar";
import { getErrorMessage, getErrorStatus } from "../../../lib/getErrorMessage";
import { formatarData, formatarDataHora, formatarNota, rotuloTipo } from "../../../lib/formatacao";
import { MASCOTES } from "../../../lib/mascotes";
import { AtividadeDetalhe, AtividadeDetalheAluno, TipoAtividadeOpcao } from "../../../lib/types";
import { AlunoScreenProps } from "../../../routes/aluno.routes";
import { colors, fonts, fontSizes, radius, spacing } from "../../../styles/theme";

// Respostas da A2 que significam "esta atividade não pode ser aberta":
// 400 (id inválido), 403 (não é destinatário) e 404 (não existe). Estado da tela, sem toast
const ATIVIDADE_INDISPONIVEL = [400, 403, 404];

interface Dados {
    atividade: AtividadeDetalhe;
    tipos: TipoAtividadeOpcao[];
}

// Linha com ícone, rótulo e valor (bloco de informações do Figma)
function Info({ icone, rotulo, valor, destaque }: { icone: React.ComponentProps<typeof Feather>["name"]; rotulo: string; valor: string; destaque?: boolean }){
    return (
        <View style={styles.info}>
            <Feather name={icone} size={18} color={destaque ? colors.red700 : colors.gray700} />
            <View style={styles.infoTextos}>
                <Text style={styles.infoRotulo}>{rotulo}</Text>
                <Text style={[styles.infoValor, destaque && styles.vencido]}>{valor}</Text>
            </View>
        </View>
    )
}

// Tela "Detalhe da atividade" (rotas A2, T8 e A14). Embaixo dos dados da atividade, o que o aluno pode fazer:
// enviar a resposta, ver a resposta e a correção (com o botão de contestar) ou o aviso de tutoria finalizada
export default function DetalheAtividade({ navigation, route }: AlunoScreenProps<"DetalheAtividade">){
    const { id_atividade } = route.params;

    // A atividade (A2) e os rótulos dos tipos (T8) ao mesmo tempo. Se só a T8 falhar, o tipo aparece sem rótulo
    const buscar = useCallback(async (): Promise<Dados> => {
        const [atividade, tipos] = await Promise.all([
            api.get<AtividadeDetalhe>(`/atividades/${id_atividade}`).then((r) => r.data),
            api.get<TipoAtividadeOpcao[]>("/tipos-atividade").then((r) => r.data).catch(() => [])
        ]);

        return { atividade, tipos };
    }, [id_atividade])

    const { dados, erro, carregando, atualizando, atualizar, tentarNovamente } = useBuscar(buscar, {
        semToast: ATIVIDADE_INDISPONIVEL
    });

    function conteudo(){
        if(carregando) return <Loader />;

        const status = getErrorStatus(erro);
        const indisponivel = !dados && status !== null && ATIVIDADE_INDISPONIVEL.includes(status);

        // A visão do tutor criador não é desta área
        if(indisponivel || (dados && dados.atividade.perfil !== "aluno")){
            return (
                <View style={styles.indisponivel}>
                    <EmptyState image={MASCOTES.badRequest} title="Atividade não encontrada ou você não tem acesso a ela." />
                    <Button title="Voltar" variant="secundario" onPress={navigation.goBack} />
                </View>
            )
        }

        if(!dados) return <ErrorState message={getErrorMessage(erro)} onRetry={tentarNovamente} />;

        return renderDetalhe(dados.atividade as AtividadeDetalheAluno, dados.tipos);
    }

    // Separado para o TypeScript saber que a atividade é a visão do aluno.
    // É uma função (e não um componente) para o formulário não ser recriado a cada atualização da tela
    function renderDetalhe(atividade: AtividadeDetalheAluno, tipos: TipoAtividadeOpcao[]){
        const vencida = new Date(atividade.data_entrega) < new Date();
        // Só a pendente fica em destaque: a entregue com atraso já tem o selo em "Sua resposta"
        const prazoEncerrado = atividade.status === "pendente" && vencida;
        const tipo = rotuloTipo(atividade.tipo, tipos);

        const detalhe = [atividade.conteudo?.nome, `${atividade.etapa}ª etapa`, tipo].filter(Boolean).join(" · ");

        return (
            <>
                <ResumoAtividade titulo={atividade.titulo} detalhe={detalhe} />

                <Card>
                    <Info icone="user" rotulo="Tutor" valor={`${atividade.tutor.nome} · Sala ${atividade.sala.nome}`} />
                    <Info
                    icone="calendar"
                    rotulo="Prazo de entrega"
                    valor={`${formatarDataHora(atividade.data_entrega)}${prazoEncerrado ? " · Prazo encerrado" : ""}`}
                    destaque={prazoEncerrado}
                    />
                    <Text style={styles.descricao}>{atividade.descricao}</Text>
                </Card>

                {atividade.resposta ? (
                    <>
                        <Card title="Sua resposta">
                            <Info icone="calendar" rotulo="Enviada em" valor={formatarDataHora(atividade.resposta.data_envio)} />

                            <View style={styles.info}>
                                <Feather name="check-circle" size={18} color={colors.gray700} />
                                <Text style={styles.infoRotulo}>Status</Text>
                                {atividade.status === "entregue_com_atraso"
                                    ? <Badge label="Entregue com atraso" variant="destaque" />
                                    : <Badge label="Entregue" variant="sucesso" />}
                            </View>

                            {/* URL pública do Cloudinary: abre no navegador do celular */}
                            <TouchableOpacity
                            style={styles.arquivo}
                            onPress={() => Linking.openURL(atividade.resposta!.conteudo_file)}
                            accessibilityRole="link"
                            >
                                <Feather name="external-link" size={18} color={colors.red700} />
                                <Text style={styles.arquivoTexto}>Abrir arquivo enviado</Text>
                            </TouchableOpacity>

                            {atividade.resposta.texto && (
                                <View style={styles.bloco}>
                                    <Text style={styles.infoRotulo}>Seu comentário</Text>
                                    <Text style={styles.texto}>{atividade.resposta.texto}</Text>
                                </View>
                            )}
                        </Card>

                        {atividade.nota && (
                            <Card title="Correção do tutor">
                                <Text style={styles.nota}>
                                    {formatarNota(atividade.nota.valor)}
                                    <Text style={styles.notaTotal}> / 10</Text>
                                </Text>

                                {atividade.nota.comentario && (
                                    <View style={styles.bloco}>
                                        <Text style={styles.infoRotulo}>Comentário do tutor</Text>
                                        <Text style={styles.texto}>{atividade.nota.comentario}</Text>
                                    </View>
                                )}

                                {/* A A2 não diz se a nota já foi contestada: o botão aparece sempre, e a A8 avisa com 409 */}
                                <Button
                                title="Contestar nota"
                                variant="secundario"
                                onPress={() => navigation.navigate("ContestarNota", {
                                    id_nota: atividade.nota!.id_nota,
                                    id_atividade: atividade.id_atividade,
                                    titulo: atividade.titulo,
                                    detalhe: [atividade.conteudo?.nome, `${atividade.etapa}ª etapa`, formatarData(atividade.nota!.data_lancamento)].filter(Boolean).join(" · "),
                                    valor: atividade.nota!.valor
                                })}
                                />
                            </Card>
                        )}
                    </>
                ) : atividade.pode_responder ? (
                    <FormResposta idAtividade={atividade.id_atividade} vencida={vencida} onEnviada={atualizar} />
                ) : (
                    // Pendente de tutoria finalizada: a A14 recusaria o envio (403)
                    <Card title="Envie sua resposta">
                        <EmptyState title="A tutoria desta atividade foi finalizada. Não é mais possível enviar resposta." />
                    </Card>
                )}
            </>
        )
    }

    return (
        <View style={styles.container}>
            <Header title="Detalhe da atividade" onBack={navigation.goBack} />

            <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
                <ScrollView
                contentContainerStyle={styles.conteudo}
                keyboardShouldPersistTaps="handled"
                refreshControl={
                    <RefreshControl refreshing={atualizando} onRefresh={atualizar} colors={[colors.red700]} tintColor={colors.red700} />
                }
                >
                    {conteudo()}
                </ScrollView>
            </KeyboardAvoidingView>
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
    indisponivel:{
        gap: spacing.lg
    },
    info:{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm
    },
    infoTextos:{
        flex: 1
    },
    infoRotulo:{
        fontFamily: fonts.medium,
        fontSize: fontSizes.rotulo,
        color: colors.gray700
    },
    infoValor:{
        fontFamily: fonts.medium,
        fontSize: 15,
        color: colors.black
    },
    vencido:{
        color: colors.red700
    },
    descricao:{
        paddingTop: spacing.sm,
        borderTopWidth: 1,
        borderTopColor: colors.gray300,
        fontFamily: fonts.regular,
        fontSize: 15,
        color: colors.black
    },
    arquivo:{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: colors.gray300,
        borderRadius: radius.item
    },
    arquivoTexto:{
        fontFamily: fonts.medium,
        fontSize: 15,
        color: colors.red700
    },
    bloco:{
        gap: 2
    },
    texto:{
        fontFamily: fonts.regular,
        fontSize: 15,
        color: colors.black
    },
    nota:{
        fontFamily: fonts.bold,
        fontSize: fontSizes.indicador,
        color: colors.black
    },
    notaTotal:{
        fontFamily: fonts.medium,
        fontSize: fontSizes.base,
        color: colors.gray700
    }
})
