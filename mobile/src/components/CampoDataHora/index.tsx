import React, { useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import DateTimePicker, { DateTimePickerAndroid, DateTimePickerEvent } from "@react-native-community/datetimepicker";

import { formatarDataHora } from "../../lib/formatacao";
import { MensagemErro } from "../MensagemErro";
import { useTema, type TemaAtual } from "../../lib/useTema";
import { fonts, radius, sizes, spacing } from "../../styles/theme";

interface CampoDataHoraProps {
    label: string;
    // null = nada escolhido ainda
    value: Date | null;
    onChange: (data: Date) => void;
    disabled?: boolean;
    erro?: string | null;
}

// Campo de data e hora (datetime-local do site), com o seletor nativo do celular.
// No Android abre a data e depois a hora; no iOS mostra o seletor compacto
export function CampoDataHora({ label, value, onChange, disabled, erro }: CampoDataHoraProps){
    const temaAtual = useTema();
    const styles = useMemo(() => makeStyles(temaAtual), [temaAtual]);
    const { colors, tema } = temaAtual;
    const inicial = value ?? new Date();

    function abrirAndroid(){
        DateTimePickerAndroid.open({
            value: inicial,
            mode: "date",
            minimumDate: new Date(),
            onChange: (evento: DateTimePickerEvent, data?: Date) => {
                if(evento.type !== "set" || !data) return;

                DateTimePickerAndroid.open({
                    value: data,
                    mode: "time",
                    is24Hour: true,
                    onChange: (eventoHora: DateTimePickerEvent, hora?: Date) => {
                        if(eventoHora.type !== "set" || !hora) return;

                        const escolhida = new Date(data);
                        escolhida.setHours(hora.getHours(), hora.getMinutes(), 0, 0);
                        onChange(escolhida);
                    }
                });
            }
        });
    }

    return (
        <View style={styles.campo}>
            <Text style={styles.label}>{label}</Text>

            {Platform.OS === "ios" ? (
                <View style={[styles.caixa, !!erro && styles.caixaErro]}>
                    <Feather name="calendar" size={18} color={colors.gray700} />
                    <DateTimePicker
                    value={inicial}
                    mode="datetime"
                    display="compact"
                    minimumDate={new Date()}
                    locale="pt-BR"
                    themeVariant={tema === "escuro" ? "dark" : "light"}
                    accentColor={colors.destaque}
                    disabled={disabled}
                    onChange={(_evento, data) => data && onChange(data)}
                    />
                </View>
            ) : (
                <TouchableOpacity
                style={[styles.caixa, !!erro && styles.caixaErro, disabled && styles.desabilitado]}
                onPress={abrirAndroid}
                disabled={disabled}
                accessibilityRole="button"
                accessibilityLabel={`${label}: ${value ? formatarDataHora(value.toISOString()) : "selecione a data"}`}
                >
                    <Feather name="calendar" size={18} color={colors.gray700} />
                    <Text style={[styles.valor, !value && styles.placeholder]}>
                        {value ? formatarDataHora(value.toISOString()) : "Selecione a data"}
                    </Text>
                    <Feather name="chevron-down" size={18} color={colors.gray700} />
                </TouchableOpacity>
            )}

            {erro && <MensagemErro mensagem={erro} />}
        </View>
    )
}

const makeStyles = ({ daltonico, colors, fontSizes, fs }: TemaAtual) => StyleSheet.create({
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
        gap: spacing.sm,
        minHeight: sizes.input,
        paddingHorizontal: spacing.md,
        borderWidth: 1,
        borderColor: colors.borderInput,
        borderRadius: radius.input,
        backgroundColor: colors.white
    },
    caixaErro:{
        borderColor: colors.red700,
        borderWidth: daltonico ? 2 : 1
    },
    desabilitado:{
        opacity: 0.6
    },
    valor:{
        flex: 1,
        fontFamily: fonts.regular,
        fontSize: fs(15),
        color: colors.black
    },
    placeholder:{
        color: colors.gray500
    }
})
