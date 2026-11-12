import React, { useContext, useEffect, useState } from "react";
import { View, Text, StyleSheet, Alert } from "react-native";
import { Feather } from "@expo/vector-icons";

import { Badge } from "../../../components/Badge";
import { Button } from "../../../components/Button";
import { ToastContext } from "../../../contexts/ToastContext";

import { api } from "../../../services/api";
import { getErrorMessage, getErrorStatus } from "../../../lib/getErrorMessage";
import { SalaAluno } from "../../../lib/types";
import { colors, fonts, fontSizes, radius, shadows, spacing } from "../../../styles/theme";

interface CardSalaProps {
    sala: SalaAluno;
    // Depois do pedido (ou de um 409), a lista é buscada de novo para mostrar o novo motivo
    onAtualizar: () => void;
}

// Quanto falta (em ms) para liberar, nunca negativo
function calcularRestante(liberadoEm: string | null): number {
    if(!liberadoEm) return 0

    return Math.max(0, new Date(liberadoEm).getTime() - Date.now())
}

// 5025000 ms -> "01:23:45"
function formatarTempo(ms: number): string {
    const totalSegundos = Math.ceil(ms / 1000)
    const horas = Math.floor(totalSegundos / 3600)
    const minutos = Math.floor((totalSegundos % 3600) / 60)
    const segundos = totalSegundos % 60

    return [horas, minutos, segundos].map((valor) => String(valor).padStart(2, "0")).join(":")
}

// Uma sala da seção "Quero ser tutor" (layout do print "Solicitação de tutoria").
// A API diz se o aluno pode pedir (pode_pedir_tutoria) e, se não puder, o motivo.
// Pedido recusado há menos de 2h: botão desabilitado com timer, que se libera sozinho
export function CardSala({ sala, onAtualizar }: CardSalaProps){
    const { showToast } = useContext(ToastContext);

    const [restanteMs, setRestanteMs] = useState(() => calcularRestante(sala.liberado_em));
    const [enviando, setEnviando] = useState(false);

    // Recalcula a partir do liberado_em da API a cada segundo e para ao chegar a zero
    useEffect(() => {
        const restanteInicial = calcularRestante(sala.liberado_em);
        setRestanteMs(restanteInicial);

        if(restanteInicial === 0) return;

        const intervalo = setInterval(() => {
            const restante = calcularRestante(sala.liberado_em);
            setRestanteMs(restante);

            if(restante === 0) clearInterval(intervalo);
        }, 1000);

        return () => clearInterval(intervalo);
    }, [sala.liberado_em])

    // Rota A13 - POST /pedidos-tutoria. O professor da sala aceita ou recusa depois
    async function pedir(){
        setEnviando(true);

        try {
            await api.post("/pedidos-tutoria", { id_sala: sala.id_sala });

            showToast("sucesso", "Pedido enviado ao professor!");
            onAtualizar();
        } catch(err) {
            showToast("erro", getErrorMessage(err));

            // 409 = já é tutor, já tem pedido pendente ou recusa há menos de 2h: atualiza o motivo/timer
            if(getErrorStatus(err) === 409) onAtualizar();
        } finally {
            setEnviando(false);
        }
    }

    // Confirmação antes de enviar, como o modal do site
    function confirmar(){
        Alert.alert(
            "Pedir para ser tutor",
            `Você vai pedir para ser tutor na sala ${sala.nome}. O professor da sala vai analisar seu pedido.`,
            [
                { text: "Cancelar", style: "cancel" },
                { text: "Confirmar pedido", onPress: pedir }
            ]
        );
    }

    const emEspera = restanteMs > 0;
    // Com liberado_em, quem decide é o timer (a recusa recente some quando o tempo acaba)
    const podePedir = sala.liberado_em ? !emEspera : sala.pode_pedir_tutoria;

    return (
        <View style={styles.card}>
            <View style={styles.topo}>
                <View style={styles.icone}>
                    <Feather name="user-plus" size={22} color={colors.white} />
                </View>

                <View style={styles.dados}>
                    <Text style={styles.nome}>Sala {sala.nome}</Text>
                    <Text style={styles.info}>{sala.serie}ª série · {sala.ano_letivo}</Text>
                </View>

                {sala.motivo?.codigo === "pedido_pendente" && <Badge label="Pendente" variant="destaque" />}
            </View>

            <View style={styles.linha}>
                <Feather name="user" size={18} color={colors.gray700} />
                <View>
                    <Text style={styles.rotulo}>Professor responsável</Text>
                    <Text style={styles.valor}>Prof. {sala.professor.nome}</Text>
                </View>
            </View>

            {emEspera ? (
                <View style={styles.motivo}>
                    <Feather name="clock" size={18} color={colors.red700} />
                    <Text style={styles.textoMotivo}>
                        Seu último pedido foi recusado. Você poderá enviar um novo pedido em{" "}
                        <Text style={styles.tempo}>{formatarTempo(restanteMs)}</Text>.
                    </Text>
                </View>
            ) : !podePedir && sala.motivo ? (
                <View style={styles.motivo}>
                    <Feather name="info" size={18} color={colors.gray700} />
                    <Text style={styles.textoMotivo}>{sala.motivo.mensagem}</Text>
                </View>
            ) : null}

            <Button
            title="Pedir para ser tutor"
            titleLoading="Enviando..."
            loading={enviando}
            disabled={!podePedir}
            onPress={confirmar}
            />
        </View>
    )
}

const styles = StyleSheet.create({
    card:{
        gap: spacing.md,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: colors.gray300,
        borderRadius: radius.cardSm,
        backgroundColor: colors.white,
        ...shadows.cardLeve
    },
    topo:{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md
    },
    icone:{
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.red700
    },
    dados:{
        flex: 1
    },
    nome:{
        fontFamily: fonts.semibold,
        fontSize: fontSizes.base,
        color: colors.black
    },
    info:{
        fontFamily: fonts.regular,
        fontSize: fontSizes.rotulo,
        color: colors.gray700
    },
    linha:{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm
    },
    rotulo:{
        fontFamily: fonts.medium,
        fontSize: fontSizes.rotulo,
        color: colors.gray700
    },
    valor:{
        fontFamily: fonts.medium,
        fontSize: 15,
        color: colors.black
    },
    motivo:{
        flexDirection: "row",
        gap: spacing.sm,
        padding: spacing.md,
        borderRadius: radius.item,
        backgroundColor: colors.gray100
    },
    textoMotivo:{
        flex: 1,
        fontFamily: fonts.regular,
        fontSize: 14,
        color: colors.gray700
    },
    tempo:{
        fontFamily: fonts.semibold,
        color: colors.red700
    }
})
