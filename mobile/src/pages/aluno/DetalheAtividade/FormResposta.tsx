import React, { useContext, useState } from "react";
import { Text, StyleSheet } from "react-native";

import { Card } from "../../../components/Card";
import { Button } from "../../../components/Button";
import { TextArea } from "../../../components/TextArea";
import { ArquivoEscolhido, FileUpload, anexarArquivo } from "../../../components/FileUpload";
import { ToastContext } from "../../../contexts/ToastContext";

import { api } from "../../../services/api";
import { getErrorMessage, getErrorStatus } from "../../../lib/getErrorMessage";
import { colors, fonts, spacing } from "../../../styles/theme";

interface FormRespostaProps {
    idAtividade: number;
    // Prazo já passou: a API aceita, mas marca "entregue com atraso"
    vencida: boolean;
    // Depois de enviar (ou de um 409), a tela busca a atividade de novo e mostra "Sua resposta"
    onEnviada: () => void;
}

const MSG_SEM_ARQUIVO = "Escolha o arquivo da resposta antes de enviar.";

// Card "Envie sua resposta" (rota A14 - POST /atividades/:id/respostas):
// arquivo obrigatório e comentário opcional, como no site. O aluno responde uma vez só
export function FormResposta({ idAtividade, vencida, onEnviada }: FormRespostaProps){
    const { showToast } = useContext(ToastContext);

    const [arquivo, setArquivo] = useState<ArquivoEscolhido | null>(null);
    const [texto, setTexto] = useState("");
    const [erroArquivo, setErroArquivo] = useState<string | null>(null);
    const [enviando, setEnviando] = useState(false);

    async function handleEnviar(){
        if(!arquivo){
            setErroArquivo(MSG_SEM_ARQUIVO);
            return;
        }

        // multipart/form-data: "file" (obrigatório) e "texto" (só se preenchido)
        const corpo = new FormData();
        anexarArquivo(corpo, arquivo);
        if(texto.trim() !== "") corpo.append("texto", texto.trim());

        setEnviando(true);

        try {
            await api.post(`/atividades/${idAtividade}/respostas`, corpo, {
                headers: { "Content-Type": "multipart/form-data" }
            });

            showToast("sucesso", "Resposta enviada!");
            onEnviada();
        } catch(err) {
            showToast("erro", getErrorMessage(err));

            // 409 = já existe resposta (ex.: enviada pelo site): a tela passa a mostrá-la
            if(getErrorStatus(err) === 409) onEnviada();
        } finally {
            setEnviando(false);
        }
    }

    return (
        <Card title="Envie sua resposta">
            <FileUpload
            arquivo={arquivo}
            onChange={(novo) => { setArquivo(novo); setErroArquivo(null); }}
            disabled={enviando}
            erro={erroArquivo}
            />

            <TextArea
            label="Comentário (opcional)"
            placeholder="Escreva um comentário para o tutor"
            value={texto}
            onChangeText={setTexto}
            editable={!enviando}
            />

            {vencida && (
                <Text style={styles.aviso} accessibilityRole="alert">
                    O prazo terminou. Sua resposta será registrada como entregue com atraso.
                </Text>
            )}

            <Button title="Enviar resposta" titleLoading="Enviando..." loading={enviando} onPress={handleEnviar} />
        </Card>
    )
}

const styles = StyleSheet.create({
    aviso:{
        padding: spacing.md,
        borderRadius: 6,
        backgroundColor: colors.gray100,
        fontFamily: fonts.medium,
        fontSize: 14,
        color: colors.red700
    }
})
