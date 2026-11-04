import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

import { colors, fonts, radius, spacing } from "../../styles/theme";

export interface OpcaoAba<T extends string> {
    valor: T;
    rotulo: string;
}

interface AbasSegmentadasProps<T extends string> {
    opcoes: OpcaoAba<T>[];
    valor: T;
    onChange: (valor: T) => void;
}

// Seletor em pílula do Figma (ex.: "Pendentes | Realizadas", "Dúvidas | Materiais"):
// a opção escolhida fica vermelha, as outras cinza
export function AbasSegmentadas<T extends string>({ opcoes, valor, onChange }: AbasSegmentadasProps<T>){
    return (
        <View style={styles.container} accessibilityRole="tablist">
            {opcoes.map((opcao) => {
                const ativa = opcao.valor === valor;

                return (
                    <TouchableOpacity
                    key={opcao.valor}
                    style={[styles.aba, ativa && styles.abaAtiva]}
                    onPress={() => onChange(opcao.valor)}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: ativa }}
                    >
                        <Text style={[styles.texto, ativa && styles.textoAtivo]} numberOfLines={1}>
                            {opcao.rotulo}
                        </Text>
                    </TouchableOpacity>
                )
            })}
        </View>
    )
}

const styles = StyleSheet.create({
    container:{
        flexDirection: "row",
        padding: spacing.xs,
        borderRadius: radius.pill,
        backgroundColor: colors.gray300
    },
    aba:{
        flex: 1,
        alignItems: "center",
        paddingVertical: spacing.sm,
        borderRadius: radius.pill
    },
    abaAtiva:{
        backgroundColor: colors.red700
    },
    texto:{
        fontFamily: fonts.medium,
        fontSize: 14,
        color: colors.gray700
    },
    textoAtivo:{
        color: colors.white
    }
})
