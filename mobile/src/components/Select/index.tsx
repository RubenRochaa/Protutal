import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal } from "react-native";
import { Feather } from "@expo/vector-icons";

import { ModalPicker, OptionProps } from "../ModalPicker";
import { colors, fonts, fontSizes, radius, sizes, spacing } from "../../styles/theme";

interface SelectProps {
    label: string;
    options: OptionProps[];
    // Valor escolhido ("" = nada escolhido: mostra o placeholder)
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    erro?: string | null;
}

// Campo de escolha (select do site): mostra o valor escolhido e abre a lista no ModalPicker
export function Select({ label, options, value, onChange, placeholder = "Selecione", disabled, erro }: SelectProps){
    const [aberto, setAberto] = useState(false);
    const rotulo = options.find((opcao) => String(opcao.value) === value)?.label;

    return (
        <View style={styles.campo}>
            <Text style={styles.label}>{label}</Text>

            <TouchableOpacity
            style={[styles.caixa, !!erro && styles.caixaErro, disabled && styles.desabilitado]}
            onPress={() => setAberto(true)}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel={`${label}: ${rotulo ?? placeholder}`}
            >
                <Text style={[styles.valor, !rotulo && styles.placeholder]} numberOfLines={1}>{rotulo ?? placeholder}</Text>
                <Feather name="chevron-down" size={18} color={colors.gray700} />
            </TouchableOpacity>

            {erro && <Text style={styles.erro} accessibilityRole="alert">{erro}</Text>}

            <Modal transparent visible={aberto} animationType="fade" onRequestClose={() => setAberto(false)}>
                <ModalPicker
                options={options}
                selectedValue={options.find((opcao) => String(opcao.value) === value)?.value}
                handleCloseModal={() => setAberto(false)}
                selectedItem={(item) => onChange(String(item.value))}
                />
            </Modal>
        </View>
    )
}

const styles = StyleSheet.create({
    campo:{
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
        justifyContent: "space-between",
        gap: spacing.sm,
        height: sizes.input,
        paddingHorizontal: spacing.md,
        borderWidth: 1,
        borderColor: colors.borderInput,
        borderRadius: radius.input,
        backgroundColor: colors.white
    },
    caixaErro:{
        borderColor: colors.red700
    },
    desabilitado:{
        opacity: 0.6
    },
    valor:{
        flex: 1,
        fontFamily: fonts.regular,
        fontSize: 15,
        color: colors.black
    },
    placeholder:{
        color: colors.gray500
    },
    erro:{
        fontFamily: fonts.regular,
        fontSize: 13,
        color: colors.red700
    }
})
