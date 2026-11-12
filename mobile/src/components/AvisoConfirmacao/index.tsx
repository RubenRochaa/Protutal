import React, { useContext, useEffect, useState, useMemo } from "react";
import { View, Text, Image, StyleSheet } from "react-native";

import { Button } from "../Button";
import { api } from "../../services/api";
import { ToastContext } from "../../contexts/ToastContext";
import { getErrorMessage } from "../../lib/getErrorMessage";
import { MASCOTES } from "../../lib/mascotes";
import { useTema, type TemaAtual } from "../../lib/useTema";
import { fonts, radius, spacing } from "../../styles/theme";

// Mesmo intervalo do back-end (ReenviarConfirmacaoEmailService): antes de 2 minutos
// ele ignora o pedido, então o botão fica bloqueado esse tempo
const ESPERA_REENVIO_S = 120

interface AvisoConfirmacaoProps {
    texto: string;
    textoBotao: string;
    // E-mail digitado no formulário de login (é para ele que o link é reenviado)
    email: string;
}

// Aviso do login com o botão de reenviar o link de confirmação (rota O4).
export function AvisoConfirmacao({ texto, textoBotao, email }: AvisoConfirmacaoProps){
    const temaAtual = useTema();
    const styles = useMemo(() => makeStyles(temaAtual), [temaAtual]);
    const { showToast } = useContext(ToastContext);

    const [enviando, setEnviando] = useState(false);
    const [restante, setRestante] = useState(0);

    // Contagem regressiva depois de um envio: diminui 1 por segundo até zerar
    useEffect(() => {
        if(restante <= 0) return;

        const timer = setTimeout(() => setRestante(restante - 1), 1000);
        return () => clearTimeout(timer);
    }, [restante]);

    async function handleReenviar(){
        const emailLimpo = email.trim();

        // Mesma mensagem do back-end (ReenviarConfirmacaoEmailService)
        if(emailLimpo === ""){
            showToast("erro", "Email é obrigatório");
            return;
        }

        setEnviando(true);

        try {
            // A API responde sempre a mesma mensagem, sem revelar se o e-mail existe
            const response = await api.post("/confirmacao-email/reenviar", { email: emailLimpo });

            showToast("sucesso", response.data.mensagem);
            setRestante(ESPERA_REENVIO_S);
        } catch(err) {
            showToast("erro", getErrorMessage(err));
        } finally {
            setEnviando(false);
        }
    }

    return (
        <View style={styles.aviso} accessibilityRole="summary">
            <Image source={MASCOTES.email} style={styles.mascote} resizeMode="contain" />

            <View style={styles.conteudo}>
                <Text style={styles.texto}>{texto}</Text>

                <Button
                variant="secundario"
                title={restante > 0 ? `Reenviar em ${restante}s` : textoBotao}
                titleLoading="Enviando..."
                loading={enviando}
                disabled={restante > 0}
                onPress={handleReenviar}
                />
            </View>
        </View>
    )
}

const makeStyles = ({ colors, fs }: TemaAtual) => StyleSheet.create({
    aviso:{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: colors.gray300,
        borderRadius: radius.cardSm,
        backgroundColor: colors.gray100
    },
    mascote:{
        width: 64,
        height: 64
    },
    conteudo:{
        flex: 1,
        gap: spacing.sm
    },
    texto:{
        fontFamily: fonts.medium,
        fontSize: fs(14),
        color: colors.black
    }
})
