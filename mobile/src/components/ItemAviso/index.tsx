import React from "react";
import { View, Text, StyleSheet } from "react-native";

import { formatarDataHora } from "../../lib/formatacao";
import { AvisoSala } from "../../lib/types";
import { colors, fonts, spacing } from "../../styles/theme";

interface ItemAvisoProps {
    aviso: AvisoSala;
}

// Aviso do professor para a sala (rota A4), só leitura: usado pelo aluno e pelo tutor
export function ItemAviso({ aviso }: ItemAvisoProps){
    return (
        <View style={styles.aviso}>
            <Text style={styles.titulo}>{aviso.titulo}</Text>
            <Text style={styles.texto}>{aviso.conteudo}</Text>
            <Text style={styles.textoSecundario}>Prof. {aviso.professor.nome} · {formatarDataHora(aviso.data_publicacao)}</Text>
        </View>
    )
}

const styles = StyleSheet.create({
    aviso:{
        gap: spacing.xs,
        paddingBottom: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.gray300
    },
    titulo:{
        fontFamily: fonts.semibold,
        fontSize: 15,
        color: colors.black
    },
    texto:{
        fontFamily: fonts.regular,
        fontSize: 14,
        color: colors.black
    },
    textoSecundario:{
        fontFamily: fonts.regular,
        fontSize: 13,
        color: colors.gray700
    }
})
