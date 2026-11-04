import React, { ComponentProps, useState } from "react";
import { View, Text, TextInput, TextInputProps, StyleSheet, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";

import { colors, fonts, fontSizes, radius, sizes, spacing } from "../../styles/theme";

interface InputProps extends TextInputProps {
    label: string;
    // Ícone do Feather mostrado à esquerda (ex.: "mail", "lock", "user")
    icon?: ComponentProps<typeof Feather>["name"];
}

// Campo de formulário com o rótulo em cima, como no site.
// Com secureTextEntry, mostra o botão de olho para ver a senha.
export function Input({ label, icon, secureTextEntry, style, onFocus, onBlur, ...rest }: InputProps){
    const [focado, setFocado] = useState(false);
    const [senhaVisivel, setSenhaVisivel] = useState(false);

    return (
        <View style={styles.campo}>
            <Text style={styles.label}>{label}</Text>

            <View style={[styles.caixa, focado && styles.caixaFocada]}>
                {icon && <Feather name={icon} size={18} color={focado ? colors.red700 : colors.gray500} />}

                <TextInput
                accessibilityLabel={label}
                placeholderTextColor={colors.gray500}
                secureTextEntry={secureTextEntry && !senhaVisivel}
                style={[styles.input, style]}
                onFocus={(e) => { setFocado(true); onFocus?.(e); }}
                onBlur={(e) => { setFocado(false); onBlur?.(e); }}
                {...rest}
                />

                {secureTextEntry && (
                    <TouchableOpacity
                    onPress={() => setSenhaVisivel(!senhaVisivel)}
                    accessibilityLabel={senhaVisivel ? "Esconder senha" : "Mostrar senha"}
                    hitSlop={10}
                    >
                        <Feather name={senhaVisivel ? "eye-off" : "eye"} size={18} color={colors.gray500} />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    campo:{
        width: "100%",
        gap: spacing.xs
    },
    label:{
        fontFamily: fonts.medium,
        fontSize: fontSizes.label,
        color: colors.black
    },
    caixa:{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
        height: sizes.input,
        paddingHorizontal: spacing.md,
        borderWidth: 1,
        borderColor: colors.borderInput,
        borderRadius: radius.input,
        backgroundColor: colors.white
    },
    caixaFocada:{
        borderColor: colors.red700
    },
    input:{
        flex: 1,
        height: "100%",
        paddingVertical: 0,
        fontFamily: fonts.regular,
        fontSize: 15,
        color: colors.black
    }
})
