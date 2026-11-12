import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";

import { Badge } from "../../../components/Badge";
import { formatarDataHora, rotuloTipo } from "../../../lib/formatacao";
import { AtividadeTutor, TipoAtividadeOpcao } from "../../../lib/types";
import { colors, fonts, fontSizes, radius, shadows, spacing } from "../../../styles/theme";

interface ItemAtividadeProps {
    atividade: AtividadeTutor;
    tipos: TipoAtividadeOpcao[];
    onPress: () => void;
}

// Item da lista de atividades do tutor (mesmas informações do itemAtividade do site)
export function ItemAtividade({ atividade, tipos, onPress }: ItemAtividadeProps){
    const corrigida = atividade.total_com_nota >= atividade.total_destinatarios;
    const paraCorrigir = atividade.total_entregues > atividade.total_com_nota;
    const total = atividade.total_destinatarios;

    const detalhe = [
        `Sala ${atividade.sala.nome}`,
        atividade.conteudo?.nome,
        `${atividade.etapa}ª etapa`,
        rotuloTipo(atividade.tipo, tipos)
    ].filter(Boolean).join(" · ");

    return (
        <TouchableOpacity style={styles.card} onPress={onPress} accessibilityRole="button" accessibilityLabel={`${atividade.titulo}. Abrir atividade`}>
            <View style={styles.icone}>
                <Feather name="file-text" size={22} color={colors.white} />
            </View>

            <View style={styles.dados}>
                <Text style={styles.titulo}>{atividade.titulo}</Text>
                <Text style={styles.texto}>{detalhe}</Text>

                <View style={styles.linha}>
                    <Feather name="calendar" size={14} color={colors.gray700} />
                    <Text style={styles.texto}>Prazo: {formatarDataHora(atividade.data_entrega)}</Text>
                </View>

                <Text style={styles.texto}>
                    Entregues {atividade.total_entregues}/{total} · Corrigidas {atividade.total_com_nota}/{total}
                </Text>

                <View style={styles.linha}>
                    {paraCorrigir && <Badge label="Para corrigir" variant="destaque" />}
                    {corrigida
                        ? <Badge label="✓ Corrigida" variant="sucesso" />
                        : <Badge label="⚠ Falta nota" />}
                </View>
            </View>

            <Feather name="chevron-right" size={20} color={colors.gray700} />
        </TouchableOpacity>
    )
}

const styles = StyleSheet.create({
    card:{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: colors.gray300,
        borderRadius: radius.cardSm,
        backgroundColor: colors.white,
        ...shadows.cardLeve
    },
    icone:{
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.gray700
    },
    dados:{
        flex: 1,
        gap: spacing.xs
    },
    titulo:{
        fontFamily: fonts.semibold,
        fontSize: fontSizes.base,
        color: colors.black
    },
    texto:{
        fontFamily: fonts.regular,
        fontSize: 13,
        color: colors.gray700
    },
    linha:{
        flexDirection: "row",
        alignItems: "center",
        flexWrap: "wrap",
        gap: spacing.sm
    }
})
