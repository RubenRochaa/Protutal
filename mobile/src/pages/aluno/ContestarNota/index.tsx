import React, { useContext, useState } from "react";
import { View, Text, StyleSheet } from "react-native";

import { Header } from "../../../components/Header";
import { EvitarTeclado, RolagemTeclado } from "../../../components/EvitarTeclado";
import { Card } from "../../../components/Card";
import { Button } from "../../../components/Button";
import { TextArea } from "../../../components/TextArea";
import { ResumoAtividade } from "../../../components/ResumoAtividade";
import { ToastContext } from "../../../contexts/ToastContext";

import { api } from "../../../services/api";
import { getErrorMessage } from "../../../lib/getErrorMessage";
import { formatarNota } from "../../../lib/formatacao";
import { AlunoScreenProps } from "../../../routes/aluno.routes";
import { colors, fonts, fontSizes, radius, spacing } from "../../../styles/theme";

const MSG_SEM_JUSTIFICATIVA = "Escreva a justificativa da contestação.";

// Tela "Contestar nota" (rota A8 - POST /notas/:id/contestacoes), com os campos do site:
// só a justificativa, obrigatória. A API recusa com 403 se a tutoria foi finalizada
// e com 409 se a nota já foi contestada; a mensagem dela vai para o toast
export default function ContestarNota({ navigation, route }: AlunoScreenProps<"ContestarNota">){
    const { id_nota, titulo, detalhe, valor } = route.params;
    const { showToast } = useContext(ToastContext);

    const [comentario, setComentario] = useState("");
    const [erro, setErro] = useState<string | null>(null);
    const [enviando, setEnviando] = useState(false);

    async function handleEnviar(){
        const justificativa = comentario.trim();

        if(justificativa === ""){
            setErro(MSG_SEM_JUSTIFICATIVA);
            return;
        }

        setEnviando(true);

        try {
            await api.post(`/notas/${id_nota}/contestacoes`, { comentario: justificativa });

            showToast("sucesso", "Contestação enviada!");
            // A tela anterior busca de novo ao voltar e passa a mostrar o status da contestação
            navigation.goBack();
        } catch(err) {
            showToast("erro", getErrorMessage(err));
        } finally {
            setEnviando(false);
        }
    }

    return (
        <View style={styles.container}>
            <Header title="Contestar nota" onBack={navigation.goBack} />

            <EvitarTeclado style={styles.container}>
                <RolagemTeclado contentContainerStyle={styles.conteudo}>
                    <ResumoAtividade titulo={titulo} detalhe={detalhe} />

                    <Card>
                        <Text style={styles.rotulo}>Sua nota</Text>
                        <Text style={styles.nota}>{formatarNota(valor)}</Text>
                    </Card>

                    <Text style={styles.aviso}>
                        Cada nota pode ser contestada uma única vez. O tutor vai analisar e responder.
                    </Text>

                    <TextArea
                    label="Justificativa da contestação"
                    obrigatorio
                    placeholder="Explique por que você discorda da nota"
                    value={comentario}
                    onChangeText={(valorDigitado) => { setComentario(valorDigitado); setErro(null); }}
                    editable={!enviando}
                    erro={erro}
                    />

                    <Button title="Enviar contestação" titleLoading="Enviando..." loading={enviando} onPress={handleEnviar} />
                    <Button title="Cancelar" variant="secundario" onPress={navigation.goBack} disabled={enviando} />
                </RolagemTeclado>
            </EvitarTeclado>
        </View>
    )
}

const styles = StyleSheet.create({
    container:{
        flex: 1,
        backgroundColor: colors.white
    },
    conteudo:{
        gap: spacing.lg,
        padding: spacing.lg
    },
    rotulo:{
        fontFamily: fonts.medium,
        fontSize: fontSizes.rotulo,
        color: colors.gray700
    },
    nota:{
        fontFamily: fonts.bold,
        fontSize: fontSizes.indicador,
        color: colors.black
    },
    aviso:{
        padding: spacing.md,
        borderRadius: radius.item,
        backgroundColor: colors.gray100,
        fontFamily: fonts.regular,
        fontSize: 14,
        color: colors.gray700
    }
})
