import React, { useContext, useMemo, useState } from "react";
import { View, Text, Switch, StyleSheet, Pressable, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { Janela } from "../Janela";
import { AcessibilidadeContext } from "../../contexts/AcessibilidadeContext";
import { useTema, type TemaAtual } from "../../lib/useTema";
import { NIVEIS_FONTE, NIVEL_FONTE_PADRAO, fonts, radius, spacing } from "../../styles/theme";

// Mesmo texto do botão e do painel do site (design/src/components/acessibilidade)
export const ROTULO_ACESSIBILIDADE = "Acessibilidade";

// Conteúdo do painel: tamanho da fonte (A- / A+ / Restaurar padrão) e os dois interruptores
function PainelAcessibilidade(){
    const temaAtual = useTema();
    const styles = useMemo(() => makeStyles(temaAtual), [temaAtual]);
    const { colors } = temaAtual;
    const {
        nivelFonte, tema, daltonico,
        aumentarFonte, diminuirFonte, restaurarFonte, alternarTema, alternarDaltonico
    } = useContext(AcessibilidadeContext);

    const noMinimo = nivelFonte === 0;
    const noMaximo = nivelFonte === NIVEIS_FONTE.length - 1;
    const noPadrao = nivelFonte === NIVEL_FONTE_PADRAO;
    const escuro = tema === "escuro";

    return (
        <View style={styles.painel}>
            <View style={styles.grupo} accessibilityRole="radiogroup" accessible={false}>
                <Text style={styles.rotulo}>Tamanho da fonte</Text>

                <View style={styles.linhaFonte}>
                    <Pressable
                    style={[styles.botaoFonte, noMinimo && styles.botaoDesabilitado]}
                    onPress={diminuirFonte}
                    disabled={noMinimo}
                    accessibilityRole="button"
                    accessibilityLabel="Diminuir fonte (A-)"
                    accessibilityState={{ disabled: noMinimo }}
                    >
                        <Text style={[styles.textoBotaoFonte, noMinimo && styles.textoDesabilitado]}>A-</Text>
                    </Pressable>

                    <Text style={styles.valor} accessibilityLiveRegion="polite">
                        {NIVEIS_FONTE[nivelFonte]}%
                    </Text>

                    <Pressable
                    style={[styles.botaoFonte, noMaximo && styles.botaoDesabilitado]}
                    onPress={aumentarFonte}
                    disabled={noMaximo}
                    accessibilityRole="button"
                    accessibilityLabel="Aumentar fonte (A+)"
                    accessibilityState={{ disabled: noMaximo }}
                    >
                        <Text style={[styles.textoBotaoFonte, noMaximo && styles.textoDesabilitado]}>A+</Text>
                    </Pressable>
                </View>

                <TouchableOpacity
                onPress={restaurarFonte}
                disabled={noPadrao}
                accessibilityRole="button"
                accessibilityState={{ disabled: noPadrao }}
                style={[styles.restaurar, noPadrao && styles.botaoDesabilitado]}
                >
                    <Text style={styles.textoRestaurar}>Restaurar padrão</Text>
                </TouchableOpacity>
            </View>

            <Interruptor
            titulo="Tema escuro"
            ligado={escuro}
            onAlternar={alternarTema}
            cores={colors}
            styles={styles}
            />

            <Interruptor
            titulo="Modo daltônico"
            ligado={daltonico}
            onAlternar={alternarDaltonico}
            cores={colors}
            styles={styles}
            />
        </View>
    )
}

interface InterruptorProps {
    titulo: string;
    ligado: boolean;
    onAlternar: () => void;
    cores: TemaAtual["colors"];
    styles: ReturnType<typeof makeStyles>;
}

function Interruptor({ titulo, ligado, onAlternar, cores, styles }: InterruptorProps){
    return (
        <Pressable
        style={styles.interruptor}
        onPress={onAlternar}
        accessibilityRole="switch"
        accessibilityLabel={titulo}
        accessibilityState={{ checked: ligado }}
        >
            <Text style={styles.textoInterruptor}>{titulo}</Text>

            <Switch
            value={ligado}
            onValueChange={onAlternar}
            trackColor={{ false: cores.gray500, true: cores.destaque }}
            thumbColor={ligado ? cores.textoSobreDestaque : cores.gray100}
            accessible={false}
            importantForAccessibility="no-hide-descendants"
            />
        </Pressable>
    )
}

// Botão com o ícone de acessibilidade. Fica sobre fundo vermelho (Header e AuthLayout)
// e abre o painel numa Janela (que já tem o host do toast).
export function BotaoAcessibilidade(){
    const temaAtual = useTema();
    const styles = useMemo(() => makeStyles(temaAtual), [temaAtual]);
    const { colors } = temaAtual;
    const [aberto, setAberto] = useState(false);

    return (
        <>
            <TouchableOpacity
            style={styles.botaoIcone}
            onPress={() => setAberto(true)}
            accessibilityRole="button"
            accessibilityLabel={ROTULO_ACESSIBILIDADE}
            accessibilityState={{ expanded: aberto }}
            hitSlop={6}
            >
                <MaterialCommunityIcons name="human-handsup" size={24} color={colors.textoSobreDestaque} />
            </TouchableOpacity>

            <Janela
            visivel={aberto}
            titulo={ROTULO_ACESSIBILIDADE}
            onClose={() => setAberto(false)}
            fecharAoTocarFora
            >
                <PainelAcessibilidade />
            </Janela>
        </>
    )
}

const makeStyles = ({ colors, fontSizes, fs }: TemaAtual) => StyleSheet.create({
    botaoIcone:{
        minWidth: 32,
        minHeight: 32,
        alignItems: "center",
        justifyContent: "center"
    },
    painel:{
        gap: spacing.lg
    },
    grupo:{
        gap: spacing.sm
    },
    rotulo:{
        fontFamily: fonts.medium,
        fontSize: fontSizes.label,
        color: colors.black
    },
    linhaFonte:{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md
    },
    botaoFonte:{
        flex: 1,
        minHeight: 44,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: radius.input,
        backgroundColor: colors.destaque
    },
    botaoDesabilitado:{
        opacity: 0.5
    },
    textoBotaoFonte:{
        fontFamily: fonts.semibold,
        fontSize: fs(16),
        color: colors.textoSobreDestaque
    },
    textoDesabilitado:{
        color: colors.textoSobreDestaque
    },
    valor:{
        minWidth: 56,
        textAlign: "center",
        fontFamily: fonts.medium,
        fontSize: fs(16),
        color: colors.black
    },
    restaurar:{
        alignSelf: "flex-start",
        minHeight: 44,
        justifyContent: "center"
    },
    textoRestaurar:{
        fontFamily: fonts.regular,
        fontSize: fontSizes.acaoCard,
        color: colors.red700,
        textDecorationLine: "underline"
    },
    interruptor:{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: spacing.md,
        minHeight: 48,
        paddingHorizontal: spacing.md,
        borderWidth: 1,
        borderColor: colors.gray300,
        borderRadius: radius.item
    },
    textoInterruptor:{
        flex: 1,
        fontFamily: fonts.medium,
        fontSize: fs(16),
        color: colors.black
    }
})
