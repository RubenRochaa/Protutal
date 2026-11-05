import React, { useContext, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    Linking,
    Alert
} from "react-native";
import { Feather } from "@expo/vector-icons";

import { EvitarTeclado, RolagemTeclado } from "../../../components/EvitarTeclado";
import { Input } from "../../../components/Input";
import { Button } from "../../../components/Button";
import { TextArea } from "../../../components/TextArea";
import { ToastContext } from "../../../contexts/ToastContext";

import { api } from "../../../services/api";
import { getErrorMessage } from "../../../lib/getErrorMessage";
import { formatarDataHora, formatarNota } from "../../../lib/formatacao";
import { validarNota } from "../../../lib/validacao";
import { RespostaAlunoAtividade } from "../../../lib/types";
import { colors, fonts, fontSizes, radius, spacing } from "../../../styles/theme";

interface ModalEnvioProps {
    idAtividade: number;
    // null = modal fechado
    item: RespostaAlunoAtividade | null;
    prazo: string;
    onClose: () => void;
    // Nota lançada: a tela busca as entregas de novo
    onNotaLancada: () => void;
}

// Modal "Envio do aluno" do site: a resposta (arquivo e comentário) e o bloco "Lançar nota"
// (rota T3). A nota é uma só por aluno e não pode ser alterada depois (a API responde 409).
// Sem resposta, a nota só pode ser lançada depois do prazo
export function ModalEnvio({ idAtividade, item, prazo, onClose, onNotaLancada }: ModalEnvioProps){
    const { showToast } = useContext(ToastContext);

    const [nota, setNota] = useState("");
    const [comentario, setComentario] = useState("");
    const [erroNota, setErroNota] = useState<string | null>(null);
    const [enviando, setEnviando] = useState(false);

    function fechar(){
        if(enviando) return;

        setNota("");
        setComentario("");
        setErroNota(null);
        onClose();
    }

    async function lancar(valor: number){
        if(!item) return;

        setEnviando(true);

        try {
            await api.post(`/atividades/${idAtividade}/notas`, {
                id_aluno: item.aluno.id_aluno,
                valor,
                ...(comentario.trim() !== "" ? { comentario: comentario.trim() } : {})
            });

            showToast("sucesso", "Nota lançada!");
            setNota("");
            setComentario("");
            onNotaLancada();
            onClose();
        } catch(err) {
            showToast("erro", getErrorMessage(err));
        } finally {
            setEnviando(false);
        }
    }

    function handleEnviar(){
        if(!item) return;

        const resultado = validarNota(nota, "valor");

        if("erro" in resultado){
            setErroNota(resultado.erro);
            return;
        }

        setErroNota(null);

        // Mesma confirmação do site: a nota não pode ser alterada depois
        Alert.alert(
            "Lançar nota",
            `Confirma a nota ${formatarNota(resultado.valor)} para ${item.aluno.nome}? A nota não pode ser alterada depois.`,
            [
                { text: "Cancelar", style: "cancel" },
                { text: "Lançar nota", onPress: () => lancar(resultado.valor) }
            ]
        );
    }

    function corpo(){
        if(!item) return null;

        const { resposta } = item;
        const prazoVencido = new Date(prazo).getTime() < Date.now();
        // Sem resposta e com o prazo aberto, a T3 recusa a nota
        const aguardando = !resposta && !prazoVencido;

        return (
            <>
                <Text style={styles.nomeAluno}>{item.aluno.nome}</Text>

                {resposta ? (
                    <>
                        <Text style={styles.texto}><Text style={styles.rotulo}>Enviado em: </Text>{formatarDataHora(resposta.data_envio)}</Text>

                        {resposta.conteudo_file && (
                            <View style={styles.bloco}>
                                <Text style={styles.rotulo}>Arquivo</Text>
                                <TouchableOpacity
                                style={styles.arquivo}
                                onPress={() => Linking.openURL(resposta.conteudo_file!)}
                                accessibilityRole="link"
                                >
                                    <Feather name="file-text" size={20} color={colors.red700} />
                                    <Text style={styles.textoLink}>Abrir arquivo</Text>
                                    <Feather name="download" size={20} color={colors.red700} />
                                </TouchableOpacity>
                            </View>
                        )}

                        {resposta.texto && (
                            <View style={styles.bloco}>
                                <Text style={styles.rotulo}>Comentário do aluno</Text>
                                <Text style={styles.caixaTexto}>{resposta.texto}</Text>
                            </View>
                        )}
                    </>
                ) : (
                    <Text style={styles.textoSecundario}>O aluno não enviou resposta.</Text>
                )}

                {item.nota ? (
                    <View style={styles.bloco}>
                        <Text style={styles.texto}><Text style={styles.rotulo}>Nota: </Text>{formatarNota(item.nota.valor)}</Text>
                        {item.nota.comentario && (
                            <>
                                <Text style={styles.rotulo}>Seu comentário</Text>
                                <Text style={styles.caixaTexto}>{item.nota.comentario}</Text>
                            </>
                        )}
                    </View>
                ) : (
                    <View style={styles.bloco}>
                        <Text style={styles.subtitulo}>Lançar nota</Text>

                        {aguardando && (
                            <Text style={styles.textoSecundario}>Aguardando a resposta do aluno até {formatarDataHora(prazo)}.</Text>
                        )}
                        {!resposta && prazoVencido && (
                            <Text style={styles.textoSecundario}>O prazo venceu sem entrega: você pode lançar a nota.</Text>
                        )}

                        <Input
                        label="Nota (0 a 10)"
                        placeholder="Ex.: 7,5"
                        keyboardType="decimal-pad"
                        value={nota}
                        onChangeText={(valor) => { setNota(valor); setErroNota(null); }}
                        editable={!aguardando && !enviando}
                        />
                        {erroNota && <Text style={styles.erro} accessibilityRole="alert">{erroNota}</Text>}

                        <TextArea
                        label="Comentário (opcional)"
                        placeholder="Digite seu comentário para o aluno..."
                        value={comentario}
                        onChangeText={setComentario}
                        editable={!aguardando && !enviando}
                        />

                        <Button
                        title="Enviar"
                        titleLoading="Enviando..."
                        loading={enviando}
                        disabled={aguardando}
                        onPress={handleEnviar}
                        />
                    </View>
                )}
            </>
        )
    }

    return (
        <Modal visible={!!item} animationType="slide" transparent onRequestClose={fechar}>
            <EvitarTeclado style={styles.fundo}>
                <View style={styles.janela}>
                    <View style={styles.cabecalho}>
                        <Text style={styles.titulo} accessibilityRole="header">Envio do aluno</Text>
                        <TouchableOpacity onPress={fechar} accessibilityRole="button" accessibilityLabel="Fechar" hitSlop={10}>
                            <Feather name="x" size={24} color={colors.gray700} />
                        </TouchableOpacity>
                    </View>

                    <RolagemTeclado contentContainerStyle={styles.conteudo}>
                        {corpo()}
                    </RolagemTeclado>
                </View>
            </EvitarTeclado>
        </Modal>
    )
}

const styles = StyleSheet.create({
    fundo:{
        flex: 1,
        justifyContent: "flex-end",
        backgroundColor: "rgba(0,0,0,0.4)"
    },
    janela:{
        maxHeight: "90%",
        borderTopLeftRadius: radius.card,
        borderTopRightRadius: radius.card,
        backgroundColor: colors.white
    },
    cabecalho:{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: colors.gray300
    },
    titulo:{
        fontFamily: fonts.semibold,
        fontSize: fontSizes.tituloCard,
        color: colors.red700
    },
    conteudo:{
        gap: spacing.md,
        padding: spacing.lg,
        paddingBottom: spacing.xxl
    },
    nomeAluno:{
        fontFamily: fonts.semibold,
        fontSize: fontSizes.destaque,
        color: colors.black
    },
    bloco:{
        gap: spacing.sm
    },
    subtitulo:{
        fontFamily: fonts.semibold,
        fontSize: fontSizes.base,
        color: colors.black
    },
    rotulo:{
        fontFamily: fonts.medium,
        fontSize: 14,
        color: colors.gray700
    },
    texto:{
        fontFamily: fonts.regular,
        fontSize: 14,
        color: colors.black
    },
    textoSecundario:{
        fontFamily: fonts.regular,
        fontSize: 14,
        color: colors.gray700
    },
    caixaTexto:{
        padding: spacing.md,
        borderRadius: radius.item,
        backgroundColor: colors.gray100,
        fontFamily: fonts.regular,
        fontSize: 14,
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
    textoLink:{
        flex: 1,
        fontFamily: fonts.medium,
        fontSize: 14,
        color: colors.red700
    },
    erro:{
        fontFamily: fonts.regular,
        fontSize: 13,
        color: colors.red700
    }
})
