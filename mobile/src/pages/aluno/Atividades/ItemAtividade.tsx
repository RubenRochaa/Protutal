import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";

import { Badge } from "../../../components/Badge";
import { formatarData } from "../../../lib/formatacao";
import { AtividadeAluno } from "../../../lib/types";
import { colors, fonts, fontSizes, radius, shadows, spacing } from "../../../styles/theme";

interface ItemAtividadeProps {
    atividade: AtividadeAluno;
    onPress: () => void;
}

// Uma atividade da lista (card do Figma) com as mesmas informações e selos do site:
// título, conteúdo · etapa, prazo, ícone de entregue/atrasada, "Entregue com atraso" e "Encerrada"
export function ItemAtividade({ atividade, onPress }: ItemAtividadeProps){
    const realizada = atividade.status !== "pendente";
    const prazo = formatarData(atividade.data_entrega);
    const vencida = !realizada && new Date(atividade.data_entrega) < new Date();
    const comAtraso = atividade.status === "entregue_com_atraso";
    // Pendente de tutoria finalizada: não pode mais ser respondida
    const encerrada = !realizada && !atividade.pode_responder;

    const etapa = `${atividade.etapa}ª etapa`;
    const detalhe = atividade.conteudo ? `${atividade.conteudo.nome} · ${etapa}` : etapa;

    return (
        <TouchableOpacity style={styles.card} onPress={onPress} accessibilityRole="button">
            <View style={styles.icone}>
                <Feather name="file-text" size={22} color={colors.white} />
            </View>

            <View style={styles.dados}>
                <Text style={styles.titulo}>{atividade.titulo}</Text>
                <Text style={styles.detalhe}>{detalhe}</Text>

                {!realizada && (
                    <View style={styles.prazo}>
                        <Feather name="calendar" size={14} color={vencida ? colors.red700 : colors.gray700} />
                        <Text style={[styles.detalhe, vencida && styles.vencido]}>
                            {vencida ? `Prazo encerrado em ${prazo}` : `Entregar até ${prazo}`}
                        </Text>
                    </View>
                )}

                {(comAtraso || encerrada) && (
                    <View style={styles.selos}>
                        {comAtraso && <Badge label="Entregue com atraso" variant="destaque" />}
                        {encerrada && <Badge label="Encerrada" />}
                    </View>
                )}
            </View>

            <View style={styles.direita}>
                {realizada && (
                    <Feather name="check-circle" size={20} color={colors.green500} accessibilityLabel="Entregue" />
                )}
                {vencida && (
                    <Feather name="alert-circle" size={20} color={colors.red700} accessibilityLabel="Atrasada" />
                )}
                <Feather name="chevron-right" size={20} color={colors.gray700} />
            </View>
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
        width: 40,
        height: 40,
        borderRadius: radius.item,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.gray700
    },
    dados:{
        flex: 1,
        gap: 2
    },
    titulo:{
        fontFamily: fonts.semibold,
        fontSize: fontSizes.base,
        color: colors.black
    },
    detalhe:{
        fontFamily: fonts.regular,
        fontSize: fontSizes.rotulo,
        color: colors.gray700
    },
    vencido:{
        color: colors.red700
    },
    prazo:{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.xs
    },
    selos:{
        flexDirection: "row",
        flexWrap: "wrap",
        gap: spacing.xs,
        marginTop: spacing.xs
    },
    direita:{
        alignItems: "center",
        gap: spacing.sm
    }
})
