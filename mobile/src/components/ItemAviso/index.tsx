import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";

import { formatarDataHora } from "../../lib/formatacao";
import { AvisoSala } from "../../lib/types";
import { useTema, type TemaAtual } from "../../lib/useTema";
import { fonts, spacing } from "../../styles/theme";

interface ItemAvisoProps {
    aviso: AvisoSala;
}

// Aviso do professor para a sala (rota A4), só leitura: usado pelo aluno e pelo tutor
export function ItemAviso({ aviso }: ItemAvisoProps){
    const temaAtual = useTema();
    const styles = useMemo(() => makeStyles(temaAtual), [temaAtual]);
    return (
        <View style={styles.aviso}>
            <Text style={styles.titulo}>{aviso.titulo}</Text>
            <Text style={styles.texto}>{aviso.conteudo}</Text>
            <Text style={styles.textoSecundario}>Prof. {aviso.professor.nome} · {formatarDataHora(aviso.data_publicacao)}</Text>
        </View>
    )
}

const makeStyles = ({ colors, fs }: TemaAtual) => StyleSheet.create({
    aviso:{
        gap: spacing.xs,
        paddingBottom: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.gray300
    },
    titulo:{
        fontFamily: fonts.semibold,
        fontSize: fs(15),
        color: colors.black
    },
    texto:{
        fontFamily: fonts.regular,
        fontSize: fs(14),
        color: colors.black
    },
    textoSecundario:{
        fontFamily: fonts.regular,
        fontSize: fs(13),
        color: colors.gray700
    }
})
