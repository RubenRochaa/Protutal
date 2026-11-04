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
    Platform
} from "react-native";
import { Feather } from "@expo/vector-icons";

import { Header } from "../../../components/Header";
import { Badge } from "../../../components/Badge";
import { Button } from "../../../components/Button";
import { Loader } from "../../../components/Loader";
import { EmptyState } from "../../../components/EmptyState";
import { ErrorState } from "../../../components/ErrorState";
import { BalaoMensagem } from "../../../components/BalaoMensagem";
import { AbasSegmentadas } from "../../../components/AbasSegmentadas";
import { ToastContext } from "../../../contexts/ToastContext";

import { api } from "../../../services/api";
import { useBuscar } from "../../../lib/useBuscar";
import { getErrorMessage, getErrorStatus } from "../../../lib/getErrorMessage";
import { MASCOTES } from "../../../lib/mascotes";
import { MensagemTutoria, TutoriaTutor } from "../../../lib/types";
import { TutorScreenProps } from "../../../routes/tutor.routes";
import { colors, fonts, fontSizes, radius, spacing } from "../../../styles/theme";

// "" = Todas; "comunicado" = só os comunicados (O2 ?tipo=comunicado)
type Aba = "" | "comunicado";

const LIMITE_ASSUNTO = 150;

type Dados =
    | { tutoria: TutoriaTutor; mensagens: MensagemTutoria[] }
    // Tutoria fora da lista do tutor: mensagem do motivo (ex.: vínculo revogado)
    | { tutoria: null; aviso: string };

// Chat do tutor com um tutorado (layout do Figma "Chat com Tutorados", regras do site em
// /tutor/tutorias/:id/chat): mensagens (O2) e envio (O1). Só o tutor envia comunicado,
// que é a mensagem com assunto. Não há tempo real: "Atualizar" ou puxar a lista
export default function ChatTutorado({ navigation, route }: TutorScreenProps<"ChatTutorado">){
    const { id_tutoria } = route.params;
    const { showToast } = useContext(ToastContext);

    const [aba, setAba] = useState<Aba>("");
    const [comunicado, setComunicado] = useState(false);
    const [assunto, setAssunto] = useState("");
    const [texto, setTexto] = useState("");
    const [enviando, setEnviando] = useState(false);
    const listaRef = useRef<FlatList<MensagemTutoria>>(null);

    const buscar = useCallback(async (): Promise<Dados> => {
        const tutorias = (await api.get<TutoriaTutor[]>("/tutores/me/tutorias")).data;
        const tutoria = tutorias.find((item) => item.id_tutoria === id_tutoria);

        if(!tutoria){
            // A T1 só traz os vínculos ativos: a O2 diz se o vínculo desta tutoria foi revogado
            try {
                await api.get(`/tutorias/${id_tutoria}/mensagens`);
            } catch(err) {
                const mensagem = getErrorMessage(err);

                if(getErrorStatus(err) === 403 && mensagem.includes("revogado")){
                    return { tutoria: null, aviso: `${mensagem}. O chat desta tutoria não está mais disponível.` };
                }
            }

            return { tutoria: null, aviso: "Tutoria não encontrada." };
        }

        const params = aba ? { tipo: aba } : undefined;
        const mensagens = (await api.get<MensagemTutoria[]>(`/tutorias/${id_tutoria}/mensagens`, { params })).data;

        return { tutoria, mensagens };
    }, [id_tutoria, aba])

    const { dados, erro, carregando, atualizando, atualizar, tentarNovamente } = useBuscar(buscar);

    // Mesmas validações do site antes da rota O1
    function validar(): string | null {
        if(comunicado){
            if(assunto.trim() === "") return "Escreva o assunto do comunicado.";
            if(assunto.trim().length > LIMITE_ASSUNTO) return "O assunto deve ter no máximo 150 caracteres";
        }

        if(texto.trim() === "") return "Escreva a mensagem antes de enviar.";

        return null;
    }

    async function handleEnviar(){
        const mensagemErro = validar();

        if(mensagemErro){
            showToast("erro", mensagemErro);
            return;
        }

        const corpo = comunicado
            ? { texto: texto.trim(), assunto: assunto.trim() }
            : { texto: texto.trim() };

        setEnviando(true);

        try {
            await api.post(`/tutorias/${id_tutoria}/mensagens`, corpo);

            showToast("sucesso", comunicado ? "Comunicado enviado!" : "Mensagem enviada!");
            setTexto("");
            setAssunto("");
            setComunicado(false);
            atualizar();
        } catch(err) {
            showToast("erro", getErrorMessage(err));

            // 409 = a tutoria foi finalizada com a tela aberta: o formulário dá lugar ao aviso
            if(getErrorStatus(err) === 409) atualizar();
        } finally {
            setEnviando(false);
        }
    }

    function conteudo(){
        if(carregando) return <View style={styles.centro}><Loader /></View>;
        if(!dados) return <View style={styles.centro}><ErrorState message={getErrorMessage(erro)} onRetry={tentarNovamente} /></View>;

        if(!dados.tutoria){
            return (
                <View style={styles.centro}>
                    <EmptyState image={MASCOTES.badRequest} title={dados.aviso} />
                    <Button title="Voltar" variant="secundario" onPress={navigation.goBack} />
                </View>
            )
        }

        const { tutoria, mensagens } = dados;
        const ativa = tutoria.status === "ativa";

        return (
            <>
                <View style={styles.topo}>
                    <View style={styles.linhaTopo}>
                        <Text style={styles.tituloChat} numberOfLines={1}>
                            <Text style={styles.rotulo}>Mensagens: </Text>
                            {tutoria.aluno.nome}
                        </Text>
                        {!ativa && <Badge label="Finalizada" />}
                    </View>

                    <AbasSegmentadas
                    opcoes={[{ valor: "", rotulo: "Todas" }, { valor: "comunicado", rotulo: "Comunicados" }]}
                    valor={aba}
                    onChange={setAba}
                    />
                </View>

                <FlatList
                ref={listaRef}
                data={mensagens}
                keyExtractor={(item) => String(item.id_mensagem)}
                renderItem={({ item }) => <BalaoMensagem mensagem={item} meuTipo="tutor" />}
                contentContainerStyle={styles.lista}
                ItemSeparatorComponent={() => <View style={styles.separador} />}
                ListEmptyComponent={
                    <EmptyState
                    title={aba === "comunicado" ? "Nenhum comunicado enviado ainda." : "Nenhuma mensagem ainda. Escreva para o seu tutorado."}
                    />
                }
                // Abriu, enviou ou atualizou: mostra a mensagem mais recente
                onContentSizeChange={() => listaRef.current?.scrollToEnd({ animated: false })}
                refreshControl={
                    <RefreshControl refreshing={atualizando} onRefresh={atualizar} colors={[colors.red700]} tintColor={colors.red700} />
                }
                keyboardShouldPersistTaps="handled"
                />

                {ativa ? (
                    <View style={styles.formulario}>
                        <TouchableOpacity
                        style={styles.opcao}
                        onPress={() => setComunicado(!comunicado)}
                        disabled={enviando}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: comunicado }}
                        >
                            <Feather name={comunicado ? "check-square" : "square"} size={20} color={colors.red700} />
                            <Text style={styles.textoOpcao}>Enviar como comunicado</Text>
                        </TouchableOpacity>

                        {comunicado && (
                            <TextInput
                            style={styles.assunto}
                            placeholder="Assunto (ex.: Revisão de relevo)"
                            placeholderTextColor={colors.gray500}
                            value={assunto}
                            onChangeText={setAssunto}
                            maxLength={LIMITE_ASSUNTO}
                            editable={!enviando}
                            accessibilityLabel="Assunto"
                            />
                        )}

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
                            placeholder="Escreva sua mensagem"
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
                            accessibilityLabel="Enviar"
                            >
                                {enviando ? <Loader size="pequeno" variant="branco" /> : <Feather name="send" size={20} color={colors.white} />}
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : (
                    <Text style={styles.finalizada} accessibilityRole="alert">
                        Esta tutoria foi finalizada. O histórico continua disponível para leitura.
                    </Text>
                )}
            </>
        )
    }

    return (
        <View style={styles.container}>
            <Header title="Chat com tutorado" onBack={navigation.goBack} />

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
    formulario:{
        gap: spacing.sm,
        padding: spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.gray300,
        backgroundColor: colors.white
    },
    opcao:{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm
    },
    textoOpcao:{
        fontFamily: fonts.medium,
        fontSize: 14,
        color: colors.black
    },
    assunto:{
        height: 44,
        paddingHorizontal: spacing.md,
        borderWidth: 1,
        borderColor: colors.borderInput,
        borderRadius: radius.item,
        fontFamily: fonts.regular,
        fontSize: 15,
        color: colors.black
    },
    barraEnvio:{
        flexDirection: "row",
        alignItems: "flex-end",
        gap: spacing.sm
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
    }
})
