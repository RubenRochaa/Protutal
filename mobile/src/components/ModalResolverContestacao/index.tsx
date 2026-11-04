import React, { useContext, useState } from "react";
import { View, Text, StyleSheet, Modal, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";

import { Input } from "../Input";
import { Button } from "../Button";
import { TextArea } from "../TextArea";
import { AbasSegmentadas } from "../AbasSegmentadas";
import { ToastContext } from "../../contexts/ToastContext";

import { api } from "../../services/api";
import { getErrorMessage } from "../../lib/getErrorMessage";
import { formatarNota } from "../../lib/formatacao";
import { validarNota } from "../../lib/validacao";
import { ContestacaoTutor } from "../../lib/types";
import { colors, fonts, fontSizes, radius, spacing } from "../../styles/theme";

export type Decisao = "aceita" | "recusada";

interface ModalResolverProps {
    // null = modal fechado
    contestacao: ContestacaoTutor | null;
    // Tutor: decisão já escolhida pelo botão Aceitar/Recusar da lista.
    // Professor (sem decisao): escolhe dentro da janela, como o "Resolver" do site
    decisao?: Decisao;
    onClose: () => void;
    onResolvida: () => void;
}

// Janela de Aceitar/Recusar do site (rota T4), usada pelo tutor e pelo professor.
// Aceitar exige a nova nota, que SUBSTITUI a atual; recusar não muda a nota.
// A decisão (explicação ao aluno) é obrigatória nos dois casos
export function ModalResolverContestacao({ contestacao, decisao, onClose, onResolvida }: ModalResolverProps){
    const { showToast } = useContext(ToastContext);

    const [novaNota, setNovaNota] = useState("");
    const [texto, setTexto] = useState("");
    const [erro, setErro] = useState<string | null>(null);
    const [enviando, setEnviando] = useState(false);
    // Escolha do professor: começa em "recusada", como o site
    const [escolha, setEscolha] = useState<Decisao>("recusada");

    const escolhaNaJanela = decisao === undefined;
    const decisaoFinal = decisao ?? escolha;
    const aceitar = decisaoFinal === "aceita";

    function fechar(){
        if(enviando) return;

        setNovaNota("");
        setTexto("");
        setErro(null);
        setEscolha("recusada");
        onClose();
    }

    async function handleConfirmar(){
        if(!contestacao) return;

        let valor: number | undefined;

        if(aceitar){
            const resultado = validarNota(novaNota, "valor");

            if("erro" in resultado){
                setErro(resultado.erro);
                return;
            }

            valor = resultado.valor;
        }

        if(texto.trim() === ""){
            setErro("O campo decisao é obrigatório");
            return;
        }

        setErro(null);
        setEnviando(true);

        try {
            // "valor" só vai quando aceita: a T4 recusa valor numa contestação recusada
            await api.patch(`/contestacoes/${contestacao.id_contestacao}/resolver`, {
                status: decisaoFinal,
                decisao: texto.trim(),
                ...(aceitar ? { valor } : {})
            });

            showToast("sucesso", aceitar ? "Contestação aceita: a nota foi substituída." : "Contestação recusada: a nota não mudou.");
            setNovaNota("");
            setTexto("");
            setEscolha("recusada");
            onResolvida();
            onClose();
        } catch(err) {
            showToast("erro", getErrorMessage(err));
        } finally {
            setEnviando(false);
        }
    }

    return (
        <Modal visible={!!contestacao} animationType="slide" transparent onRequestClose={fechar}>
            <KeyboardAvoidingView style={styles.fundo} behavior={Platform.OS === "ios" ? "padding" : undefined}>
                <View style={styles.janela}>
                    <View style={styles.cabecalho}>
                        <Text style={styles.titulo} accessibilityRole="header">
                            {escolhaNaJanela ? "Resolver contestação" : aceitar ? "Aceitar contestação" : "Recusar contestação"}
                        </Text>
                        <TouchableOpacity onPress={fechar} accessibilityRole="button" accessibilityLabel="Fechar" hitSlop={10}>
                            <Feather name="x" size={24} color={colors.gray700} />
                        </TouchableOpacity>
                    </View>

                    {contestacao && (
                        <ScrollView contentContainerStyle={styles.conteudo} keyboardShouldPersistTaps="handled">
                            {escolhaNaJanela && (
                                <View style={styles.escolha}>
                                    <Text style={styles.legenda}>Decisão</Text>
                                    <AbasSegmentadas
                                    opcoes={[
                                        { valor: "recusada", rotulo: "Recusar (mantém a nota)" },
                                        { valor: "aceita", rotulo: "Aceitar (troca a nota)" }
                                    ]}
                                    valor={escolha}
                                    onChange={(valor) => { setEscolha(valor); setErro(null); }}
                                    rolavel
                                    />
                                </View>
                            )}

                            <Text style={styles.aviso}>
                                {aceitar
                                    ? `A nota atual (${formatarNota(contestacao.nota.valor)}) será SUBSTITUÍDA pela nova nota. O valor anterior não fica guardado.`
                                    : "Ao recusar, a nota do aluno não muda."}
                            </Text>

                            {aceitar && (
                                <Input
                                label="Nova nota (0 a 10)"
                                placeholder="Ex.: 9,5"
                                keyboardType="decimal-pad"
                                value={novaNota}
                                onChangeText={setNovaNota}
                                editable={!enviando}
                                />
                            )}

                            <TextArea
                            label={escolhaNaJanela ? "Parecer (explique a decisão ao aluno)" : "Decisão (explique ao aluno)"}
                            obrigatorio
                            value={texto}
                            onChangeText={setTexto}
                            editable={!enviando}
                            />

                            {erro && <Text style={styles.erro} accessibilityRole="alert">{erro}</Text>}

                            <Button
                            title={aceitar ? "Aceitar e substituir nota" : "Recusar contestação"}
                            titleLoading="Enviando..."
                            loading={enviando}
                            onPress={handleConfirmar}
                            />
                            <Button title="Cancelar" variant="secundario" onPress={fechar} disabled={enviando} />
                        </ScrollView>
                    )}
                </View>
            </KeyboardAvoidingView>
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
    escolha:{
        gap: spacing.xs
    },
    legenda:{
        fontFamily: fonts.medium,
        fontSize: fontSizes.label,
        color: colors.black
    },
    aviso:{
        padding: spacing.md,
        borderRadius: radius.item,
        backgroundColor: colors.gray100,
        fontFamily: fonts.medium,
        fontSize: 14,
        color: colors.black
    },
    erro:{
        fontFamily: fonts.regular,
        fontSize: 13,
        color: colors.red700
    }
})
