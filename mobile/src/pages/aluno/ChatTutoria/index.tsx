import React, { useCallback, useContext, useRef, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    RefreshControl,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    Linking
} from "react-native";
import { Feather } from "@expo/vector-icons";

import { Header } from "../../../components/Header";
import { Badge } from "../../../components/Badge";
import { Avatar } from "../../../components/Avatar";
import { Button } from "../../../components/Button";
import { Loader } from "../../../components/Loader";
import { EmptyState } from "../../../components/EmptyState";
import { ErrorState } from "../../../components/ErrorState";
import { AbasSegmentadas } from "../../../components/AbasSegmentadas";
import { ToastContext } from "../../../contexts/ToastContext";

import { api } from "../../../services/api";
import { useBuscar } from "../../../lib/useBuscar";
import { getErrorMessage, getErrorStatus } from "../../../lib/getErrorMessage";
import { formatarData, formatarDataHora } from "../../../lib/formatacao";
import { MASCOTES } from "../../../lib/mascotes";
import { MaterialSala, MensagemTutoria, TutoriaAluno } from "../../../lib/types";
import { AlunoScreenProps } from "../../../routes/aluno.routes";
import { colors, fonts, fontSizes, radius, shadows, spacing } from "../../../styles/theme";

type Aba = "duvidas" | "materiais";

interface Dados {
    // null = o id não está na lista do aluno (A3)
    tutoria: TutoriaAluno | null;
    mensagens: MensagemTutoria[];
    // null = a rota falhou; "sem_acesso" = 403 da A5
    materiais: MaterialSala[] | "sem_acesso" | null;
}

// Ícone pelo tipo do arquivo (a API só aceita .pdf .doc .docx .xls .xlsx .csv)
function iconeMaterial(url: string): { nome: React.ComponentProps<typeof Feather>["name"]; rotulo: string } {
    const extensao = url.split("?")[0].split(".").pop()?.toLowerCase() ?? "";

    if(extensao === "pdf") return { nome: "file-text", rotulo: "PDF" };
    if(extensao === "doc" || extensao === "docx") return { nome: "file-text", rotulo: extensao.toUpperCase() };
    if(extensao === "xls" || extensao === "xlsx" || extensao === "csv") return { nome: "grid", rotulo: extensao.toUpperCase() };

    return { nome: "file", rotulo: "Arquivo" };
}

// Tela de chat da tutoria (prints "Chat" e "Dúvidas / Materiais"): o seletor do topo troca entre
// o chat individual com o tutor (rotas O2 e O1) e os materiais de apoio da sala (rota A5).
// Não há tempo real: as mensagens novas chegam com "Atualizar" ou puxando a lista
export default function ChatTutoria({ navigation, route }: AlunoScreenProps<"ChatTutoria">){
    const { id_tutoria } = route.params;
    const { showToast } = useContext(ToastContext);

    const [aba, setAba] = useState<Aba>("duvidas");
    const [texto, setTexto] = useState("");
    const [enviando, setEnviando] = useState(false);
    const listaRef = useRef<FlatList<MensagemTutoria>>(null);

    const buscar = useCallback(async (): Promise<Dados> => {
        const tutorias = (await api.get<TutoriaAluno[]>("/alunos/me/tutorias")).data;
        const tutoria = tutorias.find((item) => item.id_tutoria === id_tutoria) ?? null;

        if(!tutoria) return { tutoria, mensagens: [], materiais: null };

        const [mensagens, materiais] = await Promise.all([
            api.get<MensagemTutoria[]>(`/tutorias/${id_tutoria}/mensagens`).then((r) => r.data),
            api.get<MaterialSala[]>(`/salas/${tutoria.sala.id_sala}/materiais`).then((r) => r.data).catch((err: unknown) =>
                getErrorStatus(err) === 403 ? "sem_acesso" as const : null
            )
        ]);

        return { tutoria, mensagens, materiais };
    }, [id_tutoria])

    const { dados, erro, carregando, atualizando, atualizar, tentarNovamente } = useBuscar(buscar);

    // Rota O1: só vai o "texto" ("assunto" é do comunicado, que só o tutor envia)
    async function handleEnviar(){
        const mensagem = texto.trim();

        if(mensagem === ""){
            showToast("erro", "Escreva a mensagem antes de enviar.");
            return;
        }

        setEnviando(true);

        try {
            await api.post(`/tutorias/${id_tutoria}/mensagens`, { texto: mensagem });

            setTexto("");
            atualizar();
        } catch(err) {
            showToast("erro", getErrorMessage(err));

            // 409 = a tutoria foi finalizada com a tela aberta: o campo dá lugar ao aviso
            if(getErrorStatus(err) === 409) atualizar();
        } finally {
            setEnviando(false);
        }
    }

    function renderMensagem({ item }: { item: MensagemTutoria }){
        const minha = item.remetente.tipo === "tutorado";

        return (
            <View style={[styles.linhaMensagem, minha && styles.linhaMinha]}>
                {!minha && <Avatar nome={item.remetente.nome} />}

                <View style={[styles.corpo, minha && styles.corpoMinha]}>
                    <Text style={styles.autor}>{minha ? "Você" : item.remetente.nome}</Text>

                    <View style={[styles.bolha, minha ? styles.bolhaMinha : styles.bolhaTutor, !!item.assunto && styles.comunicado]}>
                        {item.assunto && (
                            <View style={styles.cabecalhoComunicado}>
                                <Badge label="Comunicado" variant="destaque" />
                                <Text style={styles.assunto}>{item.assunto}</Text>
                            </View>
                        )}

                        <Text style={[styles.textoMensagem, minha && styles.textoMinha]}>{item.texto}</Text>
                        <Text style={[styles.hora, minha && styles.horaMinha]}>{formatarDataHora(item.data_envio)}</Text>
                    </View>
                </View>
            </View>
        )
    }

    function renderMaterial({ item }: { item: MaterialSala }){
        const icone = iconeMaterial(item.arquivo);

        return (
            <TouchableOpacity
            style={styles.material}
            onPress={() => Linking.openURL(item.arquivo)}
            accessibilityRole="link"
            accessibilityLabel={`Abrir ${item.titulo}`}
            >
                <View style={styles.iconeMaterial}>
                    <Feather name={icone.nome} size={22} color={colors.white} />
                </View>

                <View style={styles.dadosMaterial}>
                    <Text style={styles.tituloMaterial}>{item.titulo}</Text>
                    {item.descricao && <Text style={styles.texto}>{item.descricao}</Text>}
                    <Text style={styles.textoSecundario}>
                        {icone.rotulo} · Enviado por {item.tutor.nome} em {formatarData(item.data_envio)}
                    </Text>
                </View>

                <Feather name="download" size={22} color={colors.red700} />
            </TouchableOpacity>
        )
    }

    const refresh = (
        <RefreshControl refreshing={atualizando} onRefresh={atualizar} colors={[colors.red700]} tintColor={colors.red700} />
    );

    function conteudo(){
        if(carregando) return <View style={styles.centro}><Loader /></View>;
        if(!dados) return <View style={styles.centro}><ErrorState message={getErrorMessage(erro)} onRetry={tentarNovamente} /></View>;

        const { tutoria, mensagens, materiais } = dados;

        if(!tutoria){
            return (
                <View style={styles.centro}>
                    <EmptyState image={MASCOTES.badRequest} title="Tutoria não encontrada." />
                    <Button title="Voltar" variant="secundario" onPress={navigation.goBack} />
                </View>
            )
        }

        const ativa = tutoria.status === "ativa";

        return (
            <>
                <View style={styles.topo}>
                    <View style={styles.linhaTopo}>
                        <Text style={styles.tituloChat} numberOfLines={1}>
                            <Text style={styles.rotulo}>Chat com o tutor: </Text>
                            {tutoria.tutor.nome}
                        </Text>
                        {!ativa && <Badge label="Finalizada" />}
                    </View>

                    <AbasSegmentadas
                    opcoes={[{ valor: "duvidas", rotulo: "Dúvidas" }, { valor: "materiais", rotulo: "Materiais" }]}
                    valor={aba}
                    onChange={setAba}
                    />
                </View>

                {aba === "duvidas" ? (
                    <>
                        <FlatList
                        ref={listaRef}
                        data={mensagens}
                        keyExtractor={(item) => String(item.id_mensagem)}
                        renderItem={renderMensagem}
                        contentContainerStyle={styles.lista}
                        ItemSeparatorComponent={() => <View style={styles.separador} />}
                        ListEmptyComponent={
                            <EmptyState title="Nenhuma mensagem ainda." description="Envie sua dúvida para o tutor." />
                        }
                        // Abriu, enviou ou atualizou: mostra a mensagem mais recente
                        onContentSizeChange={() => listaRef.current?.scrollToEnd({ animated: false })}
                        refreshControl={refresh}
                        keyboardShouldPersistTaps="handled"
                        />

                        {ativa ? (
                            <View style={styles.barraEnvio}>
                                {/* Não há tempo real: busca as mensagens novas */}
                                <TouchableOpacity
                                style={styles.botaoAtualizar}
                                onPress={atualizar}
                                disabled={atualizando}
                                accessibilityRole="button"
                                accessibilityLabel="Atualizar mensagens"
                                >
                                    <Feather name="refresh-cw" size={20} color={colors.gray700} />
                                </TouchableOpacity>

                                <TextInput
                                style={styles.input}
                                placeholder="Digite sua dúvida..."
                                placeholderTextColor={colors.gray500}
                                value={texto}
                                onChangeText={setTexto}
                                editable={!enviando}
                                multiline
                                accessibilityLabel="Mensagem"
                                />

                                <TouchableOpacity
                                style={[styles.botaoEnviar, enviando && styles.desabilitado]}
                                onPress={handleEnviar}
                                disabled={enviando}
                                accessibilityRole="button"
                                accessibilityLabel="Enviar mensagem"
                                >
                                    {enviando ? <Loader size="pequeno" variant="branco" /> : <Feather name="send" size={20} color={colors.white} />}
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <Text style={styles.finalizada} accessibilityRole="alert">
                                Esta tutoria foi finalizada. O histórico continua disponível para leitura.
                            </Text>
                        )}
                    </>
                ) : (
                    <FlatList
                    data={Array.isArray(materiais) ? materiais : []}
                    keyExtractor={(item) => String(item.id_material)}
                    renderItem={renderMaterial}
                    contentContainerStyle={styles.lista}
                    ItemSeparatorComponent={() => <View style={styles.separador} />}
                    ListHeaderComponent={<Text style={styles.tituloSecao}>Materiais de apoio disponíveis</Text>}
                    ListEmptyComponent={
                        materiais === "sem_acesso"
                            ? <EmptyState image={MASCOTES.badRequest} title="Você não tem acesso aos materiais desta sala." />
                            : materiais === null
                                ? <ErrorState message="Não foi possível carregar os materiais." onRetry={tentarNovamente} />
                                : <EmptyState title="Nenhum material disponível." />
                    }
                    refreshControl={refresh}
                    />
                )}
            </>
        )
    }

    return (
        <View style={styles.container}>
            <Header title="Chat com tutor" onBack={navigation.goBack} />

            <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
                {conteudo()}
            </KeyboardAvoidingView>
        </View>
    )
}

const styles = StyleSheet.create({
    container:{
        flex: 1,
        backgroundColor: colors.white
    },
    centro:{
        flex: 1,
        justifyContent: "center",
        gap: spacing.lg,
        padding: spacing.lg
    },
    topo:{
        gap: spacing.md,
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.lg
    },
    linhaTopo:{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm
    },
    tituloChat:{
        flex: 1,
        fontFamily: fonts.semibold,
        fontSize: fontSizes.base,
        color: colors.black
    },
    rotulo:{
        fontFamily: fonts.medium,
        color: colors.gray700
    },
    lista:{
        flexGrow: 1,
        padding: spacing.lg
    },
    separador:{
        height: spacing.md
    },
    linhaMensagem:{
        flexDirection: "row",
        alignItems: "flex-end",
        gap: spacing.sm
    },
    linhaMinha:{
        justifyContent: "flex-end"
    },
    corpo:{
        maxWidth: "80%",
        gap: 2
    },
    corpoMinha:{
        alignItems: "flex-end"
    },
    autor:{
        fontFamily: fonts.medium,
        fontSize: fontSizes.selo,
        color: colors.gray700
    },
    bolha:{
        gap: spacing.xs,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderRadius: radius.card
    },
    bolhaTutor:{
        backgroundColor: colors.gray100,
        borderWidth: 1,
        borderColor: colors.gray300,
        borderBottomLeftRadius: spacing.xs
    },
    bolhaMinha:{
        backgroundColor: colors.red700,
        borderBottomRightRadius: spacing.xs
    },
    comunicado:{
        borderWidth: 2,
        borderColor: colors.red700
    },
    cabecalhoComunicado:{
        gap: spacing.xs
    },
    assunto:{
        fontFamily: fonts.semibold,
        fontSize: 15,
        color: colors.black
    },
    textoMensagem:{
        fontFamily: fonts.regular,
        fontSize: 15,
        color: colors.black
    },
    textoMinha:{
        color: colors.white
    },
    hora:{
        alignSelf: "flex-end",
        fontFamily: fonts.regular,
        fontSize: 11,
        color: colors.gray700
    },
    horaMinha:{
        color: colors.gray300
    },
    barraEnvio:{
        flexDirection: "row",
        alignItems: "flex-end",
        gap: spacing.sm,
        padding: spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.gray300,
        backgroundColor: colors.white
    },
    botaoAtualizar:{
        width: 44,
        height: 44,
        borderRadius: radius.item,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.gray100
    },
    input:{
        flex: 1,
        minHeight: 44,
        maxHeight: 120,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderWidth: 1,
        borderColor: colors.borderInput,
        borderRadius: radius.item,
        fontFamily: fonts.regular,
        fontSize: 15,
        color: colors.black
    },
    botaoEnviar:{
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.red700
    },
    desabilitado:{
        opacity: 0.6
    },
    finalizada:{
        padding: spacing.lg,
        borderTopWidth: 1,
        borderTopColor: colors.gray300,
        fontFamily: fonts.medium,
        fontSize: 14,
        color: colors.gray700,
        textAlign: "center"
    },
    tituloSecao:{
        marginBottom: spacing.md,
        fontFamily: fonts.semibold,
        fontSize: fontSizes.tituloCard,
        color: colors.red700
    },
    material:{
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
    iconeMaterial:{
        width: 44,
        height: 44,
        borderRadius: radius.item,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.red700
    },
    dadosMaterial:{
        flex: 1,
        gap: 2
    },
    tituloMaterial:{
        fontFamily: fonts.semibold,
        fontSize: 15,
        color: colors.black
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
