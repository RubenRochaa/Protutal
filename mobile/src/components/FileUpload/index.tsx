import React, { useContext, useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";

import { ToastContext } from "../../contexts/ToastContext";
import { MensagemErro } from "../MensagemErro";
import { useTema, type TemaAtual } from "../../lib/useTema";
import { fonts, radius, spacing } from "../../styles/theme";

// Mesmas regras do FileUpload do site e do back-end (resposta, rubrica e material)
const EXTENSOES = [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".csv"];
const TAMANHO_MAXIMO = 10 * 1024 * 1024; // 10 MB

// Tipos mostrados no seletor do celular. A extensão é conferida de novo depois,
// porque alguns aparelhos ignoram o filtro
const TIPOS_MIME = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/csv",
    "text/comma-separated-values",
];

// Arquivo escolhido no celular, pronto para ir no FormData
export interface ArquivoEscolhido {
    uri: string;
    name: string;
    type: string;
}

// Coloca o arquivo no FormData com o nome de campo "file", como a API espera.
// No React Native o arquivo vai como { uri, name, type }, e não como File/Blob
export function anexarArquivo(corpo: FormData, arquivo: ArquivoEscolhido){
    corpo.append("file", arquivo as unknown as Blob);
}

function validarArquivo(nome: string, tamanho: number | undefined): string | null {
    const minusculo = nome.toLowerCase();

    if(!EXTENSOES.some((extensao) => minusculo.endsWith(extensao))){
        return "Formato não aceito. Envie um arquivo .pdf, .doc, .docx, .xls, .xlsx ou .csv.";
    }

    if(tamanho !== undefined && tamanho > TAMANHO_MAXIMO){
        return "O arquivo deve ter no máximo 10 MB.";
    }

    return null
}

interface FileUploadProps {
    arquivo: ArquivoEscolhido | null;
    onChange: (arquivo: ArquivoEscolhido | null) => void;
    disabled?: boolean;
    // Erro do formulário (ex.: "Escolha o arquivo da resposta antes de enviar.")
    erro?: string | null;
}

// Área de upload de UM arquivo: tocar abre o seletor de documentos do celular
export function FileUpload({ arquivo, onChange, disabled, erro }: FileUploadProps){
    const temaAtual = useTema();
    const styles = useMemo(() => makeStyles(temaAtual), [temaAtual]);
    const { colors } = temaAtual;
    const { showToast } = useContext(ToastContext);

    async function escolher(){
        const resultado = await DocumentPicker.getDocumentAsync({
            type: TIPOS_MIME,
            copyToCacheDirectory: true,
            multiple: false
        });

        if(resultado.canceled) return;

        const escolhido = resultado.assets[0];
        const mensagem = validarArquivo(escolhido.name, escolhido.size);

        if(mensagem){
            showToast("erro", mensagem);
            onChange(null);
            return;
        }

        onChange({
            uri: escolhido.uri,
            name: escolhido.name,
            type: escolhido.mimeType ?? "application/octet-stream"
        });
    }

    return (
        <View style={styles.campo}>
            <TouchableOpacity
            style={[styles.quadro, !!erro && styles.quadroErro, disabled && styles.desabilitado]}
            onPress={escolher}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel={arquivo ? `Arquivo escolhido: ${arquivo.name}. Toque para trocar` : "Escolher arquivo"}
            >
                <Feather name="paperclip" size={26} color={colors.gray700} />

                <Text style={styles.texto}>
                    <Text style={styles.forte}>Toque para anexar</Text> o arquivo
                </Text>

                <Text style={styles.dica}>PDF, DOC, DOCX, XLS, XLSX ou CSV, até 10 MB</Text>

                {arquivo && (
                    <View style={styles.arquivo}>
                        <Feather name="file-text" size={18} color={colors.red700} />
                        <Text style={styles.nomeArquivo} numberOfLines={1}>{arquivo.name}</Text>
                    </View>
                )}
            </TouchableOpacity>

            {erro && <MensagemErro mensagem={erro} />}
        </View>
    )
}

const makeStyles = ({ daltonico, colors, fontSizes, fs }: TemaAtual) => StyleSheet.create({
    campo:{
        gap: spacing.xs
    },
    quadro:{
        alignItems: "center",
        gap: spacing.xs,
        paddingVertical: spacing.xl,
        paddingHorizontal: spacing.lg,
        borderWidth: 1.5,
        borderStyle: "dashed",
        borderColor: colors.gray500,
        borderRadius: radius.item,
        backgroundColor: colors.gray100
    },
    quadroErro:{
        borderColor: colors.red700,
        borderWidth: daltonico ? 2 : 1
    },
    desabilitado:{
        opacity: 0.6
    },
    texto:{
        fontFamily: fonts.regular,
        fontSize: fs(14),
        color: colors.gray700,
        textAlign: "center"
    },
    forte:{
        fontFamily: fonts.semibold,
        color: colors.black
    },
    dica:{
        fontFamily: fonts.regular,
        fontSize: fontSizes.selo,
        color: colors.gray700,
        textAlign: "center"
    },
    arquivo:{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.xs,
        marginTop: spacing.xs,
        maxWidth: "100%"
    },
    nomeArquivo:{
        flexShrink: 1,
        fontFamily: fonts.medium,
        fontSize: fs(14),
        color: colors.red700
    }
})
