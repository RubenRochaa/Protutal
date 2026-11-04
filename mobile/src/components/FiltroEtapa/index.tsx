import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal } from "react-native";
import { Feather } from "@expo/vector-icons";

import { ModalPicker, OptionProps } from "../ModalPicker";
import { colors, fonts, fontSizes, radius, sizes, spacing } from "../../styles/theme";

// "" = todas as etapas (não envia o filtro para a API)
export type Etapa = "" | "1" | "2" | "3";

// Mesmas opções do filtro do site (3 etapas)
const OPCOES: OptionProps[] = [
    { value: "", label: "Todas as etapas" },
    { value: "1", label: "1ª etapa" },
    { value: "2", label: "2ª etapa" },
    { value: "3", label: "3ª etapa" },
]

interface FiltroEtapaProps {
    etapa: Etapa;
    onChange: (etapa: Etapa) => void;
}

// Filtro de etapa das telas de atividades e desempenho: abre a lista no ModalPicker
export function FiltroEtapa({ etapa, onChange }: FiltroEtapaProps){
    const [aberto, setAberto] = useState(false);

    const rotulo = OPCOES.find((opcao) => opcao.value === etapa)?.label ?? "Todas as etapas";

    return (
        <View style={styles.campo}>
            <Text style={styles.label}>Etapa</Text>

            <TouchableOpacity
            style={styles.caixa}
            onPress={() => setAberto(true)}
            accessibilityRole="button"
            accessibilityLabel={`Etapa: ${rotulo}`}
            >
                <Text style={styles.valor}>{rotulo}</Text>
                <Feather name="chevron-down" size={18} color={colors.gray700} />
            </TouchableOpacity>

            <Modal transparent visible={aberto} animationType="fade" onRequestClose={() => setAberto(false)}>
                <ModalPicker
                options={OPCOES}
                selectedValue={etapa}
                handleCloseModal={() => setAberto(false)}
                selectedItem={(item) => onChange(String(item.value) as Etapa)}
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
        height: sizes.input,
        paddingHorizontal: spacing.md,
        borderWidth: 1,
        borderColor: colors.borderInput,
        borderRadius: radius.input,
        backgroundColor: colors.white
    },
    valor:{
        fontFamily: fonts.regular,
        fontSize: 15,
        color: colors.black
    }
})
