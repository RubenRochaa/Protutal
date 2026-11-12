import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";

import { Badge } from "../Badge";
import { Avatar } from "../Avatar";
import { formatarDataHora } from "../../lib/formatacao";
import { MensagemTutoria } from "../../lib/types";
import { useTema, type TemaAtual } from "../../lib/useTema";
import { fonts, radius, spacing } from "../../styles/theme";

interface BalaoMensagemProps {
    mensagem: MensagemTutoria;
    // Lado de quem está com o app aberto: as mensagens dele ficam à direita, como "Você"
    meuTipo: MensagemTutoria["remetente"]["tipo"];
}

// Mensagem do chat da tutoria (usada no chat do aluno e no do tutor).
// Comunicado (mensagem com assunto) ganha a etiqueta e o assunto em destaque
export function BalaoMensagem({ mensagem, meuTipo }: BalaoMensagemProps){
    const temaAtual = useTema();
    const styles = useMemo(() => makeStyles(temaAtual), [temaAtual]);
    const minha = mensagem.remetente.tipo === meuTipo;

    return (
        <View style={[styles.linha, minha && styles.linhaMinha]}>
            {!minha && <Avatar nome={mensagem.remetente.nome} />}

            <View style={[styles.corpo, minha && styles.corpoMinha]}>
                <Text style={styles.autor}>{minha ? "Você" : mensagem.remetente.nome}</Text>

                <View style={[styles.bolha, minha ? styles.bolhaMinha : styles.bolhaOutro, !!mensagem.assunto && styles.comunicado]}>
                    {mensagem.assunto && (
                        <View style={styles.cabecalhoComunicado}>
                            <Badge label="Comunicado" variant="destaque" />
                            <Text style={[styles.assunto, minha && styles.textoMinha]}>{mensagem.assunto}</Text>
                        </View>
                    )}

                    <Text style={[styles.texto, minha && styles.textoMinha]}>{mensagem.texto}</Text>
                    <Text style={[styles.hora, minha && styles.horaMinha]}>{formatarDataHora(mensagem.data_envio)}</Text>
                </View>
            </View>
        </View>
    )
}

const makeStyles = ({ colors, fontSizes, fs }: TemaAtual) => StyleSheet.create({
    linha:{
        flexDirection: "row",
        alignItems: "flex-end",
        gap: spacing.sm
    },
    linhaMinha:{
        justifyContent: "flex-end"
    },
    corpo:{
        maxWidth: "80%",
        gap: 2
    },
    corpoMinha:{
        alignItems: "flex-end"
    },
    autor:{
        fontFamily: fonts.medium,
        fontSize: fontSizes.selo,
        color: colors.gray700
    },
    bolha:{
        gap: spacing.xs,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderRadius: radius.card
    },
    bolhaOutro:{
        backgroundColor: colors.gray100,
        borderWidth: 1,
        borderColor: colors.gray300,
        borderBottomLeftRadius: spacing.xs
    },
    bolhaMinha:{
        backgroundColor: colors.destaque,
        borderBottomRightRadius: spacing.xs
    },
    comunicado:{
        borderWidth: 2,
        borderColor: colors.red700
    },
    cabecalhoComunicado:{
        gap: spacing.xs
    },
    assunto:{
        fontFamily: fonts.semibold,
        fontSize: fs(15),
        color: colors.black
    },
    texto:{
        fontFamily: fonts.regular,
        fontSize: fs(15),
        color: colors.black
    },
    textoMinha:{
        color: colors.textoSobreDestaque
    },
    hora:{
        alignSelf: "flex-end",
        fontFamily: fonts.regular,
        fontSize: fs(11),
        color: colors.gray700
    },
    horaMinha:{
        color: colors.gray300
    }
})
