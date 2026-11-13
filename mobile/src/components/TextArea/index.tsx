import React, { useState, useMemo } from "react";
import { View, Text, TextInput, StyleSheet, TextInputProps } from "react-native";

import { MensagemErro } from "../MensagemErro";
import { useTema, type TemaAtual } from "../../lib/useTema";
import { fonts, radius, spacing } from "../../styles/theme";

interface TextAreaProps extends TextInputProps {
    label: string;
    // Mostra o "*" de campo obrigatório ao lado do rótulo
    obrigatorio?: boolean;
    erro?: string | null;
}

// Campo de texto de várias linhas (textarea do site), com a mesma borda do Input
export function TextArea({ label, obrigatorio, erro, style, onFocus, onBlur, ...rest }: TextAreaProps){
    const temaAtual = useTema();
    const styles = useMemo(() => makeStyles(temaAtual), [temaAtual]);
    const { colors } = temaAtual;
    const [focado, setFocado] = useState(false);

    return (
        <View style={styles.campo}>
            <Text style={styles.label}>
                {label}
                {obrigatorio && <Text style={styles.obrigatorio}> *</Text>}
            </Text>

            <TextInput
            accessibilityLabel={label}
            multiline
            textAlignVertical="top"
            placeholderTextColor={colors.gray500}
            style={[styles.input, focado && styles.inputFocado, !!erro && styles.inputErro, style]}
            onFocus={(e) => { setFocado(true); onFocus?.(e); }}
            onBlur={(e) => { setFocado(false); onBlur?.(e); }}
            {...rest}
            />

            {erro && <MensagemErro mensagem={erro} />}
        </View>
    )
}

const makeStyles = ({ daltonico, colors, fontSizes, fs }: TemaAtual) => StyleSheet.create({
    campo:{
        width: "100%",
        gap: spacing.xs
    },
    label:{
        fontFamily: fonts.medium,
        fontSize: fontSizes.label,
        color: colors.black
    },
    obrigatorio:{
        color: colors.red700
    },
    input:{
        minHeight: 110,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: colors.borderInput,
        borderRadius: radius.input,
        backgroundColor: colors.white,
        fontFamily: fonts.regular,
        fontSize: fs(15),
        color: colors.black
    },
    inputFocado:{
        borderColor: colors.red700
    },
    inputErro:{
        borderColor: colors.red700,
        borderWidth: daltonico ? 2 : 1
    }
})
