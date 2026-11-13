import React, { useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";

import { useTema, type TemaAtual } from "../../lib/useTema";
import { fonts, radius, spacing } from "../../styles/theme";

export interface OpcaoAba<T extends string> {
    valor: T;
    rotulo: string;
}

interface AbasSegmentadasProps<T extends string> {
    opcoes: OpcaoAba<T>[];
    valor: T;
    onChange: (valor: T) => void;
    // true = abas com a largura do texto, roláveis para o lado (ex.: as 5 abas da sala do professor).
    // false = as abas dividem a largura da tela
    rolavel?: boolean;
}

// Seletor em pílula do Figma (ex.: "Pendentes | Realizadas", "Dúvidas | Materiais"):
// a opção escolhida fica vermelha, as outras cinza
export function AbasSegmentadas<T extends string>({ opcoes, valor, onChange, rolavel = false }: AbasSegmentadasProps<T>){
    const temaAtual = useTema();
    const styles = useMemo(() => makeStyles(temaAtual), [temaAtual]);
    const abas = opcoes.map((opcao) => {
        const ativa = opcao.valor === valor;

        return (
            <TouchableOpacity
            key={opcao.valor}
            style={[styles.aba, rolavel ? styles.abaRolavel : styles.abaFixa, ativa && styles.abaAtiva]}
            onPress={() => onChange(opcao.valor)}
            accessibilityRole="tab"
            accessibilityState={{ selected: ativa }}
            >
                <Text style={[styles.texto, ativa && styles.textoAtivo]} numberOfLines={1}>
                    {opcao.rotulo}
                </Text>
            </TouchableOpacity>
        )
    });

    if(rolavel){
        return (
            <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.rolagem}
            contentContainerStyle={styles.container}
            accessibilityRole="tablist"
            >
                {abas}
            </ScrollView>
        )
    }

    return (
        <View style={styles.container} accessibilityRole="tablist">
            {abas}
        </View>
    )
}

const makeStyles = ({ colors, fs }: TemaAtual) => StyleSheet.create({
    container:{
        flexDirection: "row",
        padding: spacing.xs,
        borderRadius: radius.pill,
        backgroundColor: colors.gray300
    },
    rolagem:{
        flexGrow: 0
    },
    aba:{
        alignItems: "center",
        paddingVertical: spacing.sm,
        borderRadius: radius.pill
    },
    abaFixa:{
        flex: 1
    },
    abaRolavel:{
        paddingHorizontal: spacing.lg
    },
    abaAtiva:{
        backgroundColor: colors.destaque
    },
    texto:{
        fontFamily: fonts.medium,
        fontSize: fs(14),
        color: colors.gray700
    },
    textoAtivo:{
        color: colors.textoSobreDestaque
    }
})
