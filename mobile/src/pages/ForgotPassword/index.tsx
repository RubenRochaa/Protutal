import React, { useContext, useEffect, useState, useMemo } from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { AuthLayout } from "../../components/AuthLayout";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { ToastContext } from "../../contexts/ToastContext";
import { api } from "../../services/api";
import { getErrorMessage } from "../../lib/getErrorMessage";
import { MASCOTES } from "../../lib/mascotes";
import { validarEmailRecuperacao } from "../../lib/validacao";
import { AuthStackParamsList } from "../../routes/auth.routes";
import { useTema, type TemaAtual } from "../../lib/useTema";
import { fonts, radius, spacing } from "../../styles/theme";

// Depois de um envio, o botão fica bloqueado esse tempo (mesmo valor do site)
const ESPERA_REENVIO_S = 60

// Pedido do link de redefinição de senha (rota O5).
// O link do e-mail abre a página /redefinir-senha do SITE: a nova senha é criada lá.
export default function ForgotPassword(){
    const temaAtual = useTema();
    const styles = useMemo(() => makeStyles(temaAtual), [temaAtual]);
    const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamsList>>();
    const { showToast } = useContext(ToastContext);

    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [sucesso, setSucesso] = useState("");
    const [restante, setRestante] = useState(0);

    // Contagem regressiva: diminui 1 por segundo até zerar
    useEffect(() => {
        if(restante <= 0) return;

        const timer = setTimeout(() => setRestante(restante - 1), 1000);
        return () => clearTimeout(timer);
    }, [restante]);

    async function handleEnviar(){
        const emailLimpo = email.trim();

        // Validação antes de enviar: se falhar, nem chama a API
        const erro = validarEmailRecuperacao(emailLimpo);

        if(erro){
            showToast("erro", erro);
            return;
        }

        setLoading(true);

        try {
            // A API responde sempre a mesma mensagem, sem revelar se o e-mail existe
            const response = await api.post("/redefinicao-senha/solicitar", { email: emailLimpo });

            showToast("sucesso", response.data.mensagem);
            setSucesso(response.data.mensagem);
            setRestante(ESPERA_REENVIO_S);
        } catch(err) {
            showToast("erro", getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    }

    return (
        <AuthLayout
        onEntrar={() => navigation.navigate("SignIn")}
        onCadastrar={() => navigation.navigate("SignUp")}
        >
            <View style={styles.form}>
                <View style={styles.cabecalho}>
                    <Text style={styles.titulo}>Esqueceu sua senha?</Text>
                    <Text style={styles.texto}>
                        Digite o e-mail institucional do seu cadastro. Vamos enviar um link para você criar uma nova senha.
                    </Text>
                </View>

                <Input
                label="E-mail"
                icon="mail"
                placeholder="Digite seu email"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                value={email}
                onChangeText={setEmail}
                />

                {/* Mensagem neutra da API: aparece exista o e-mail ou não */}
                {sucesso !== "" && (
                    <View style={styles.aviso} accessibilityRole="summary">
                        <Image source={MASCOTES.email} style={styles.mascote} resizeMode="contain" />
                        <Text style={styles.textoAviso}>{sucesso}</Text>
                    </View>
                )}

                <Button
                title={restante > 0 ? `Enviar de novo em ${restante}s` : "Enviar link"}
                titleLoading="Enviando..."
                loading={loading}
                disabled={restante > 0}
                onPress={handleEnviar}
                />

                <View style={styles.rodape}>
                    <Text style={styles.textoRodape}>Lembrou a senha? </Text>
                    <TouchableOpacity onPress={() => navigation.navigate("SignIn")} hitSlop={8}>
                        <Text style={styles.link}>Voltar para o login</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </AuthLayout>
    )
}

const makeStyles = ({ daltonico, colors, fs }: TemaAtual) => StyleSheet.create({
    form:{
        gap: spacing.lg
    },
    cabecalho:{
        gap: spacing.xs
    },
    titulo:{
        fontFamily: fonts.semibold,
        fontSize: fs(18),
        color: colors.red700
    },
    texto:{
        fontFamily: fonts.regular,
        fontSize: fs(14),
        color: colors.gray700
    },
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
        width: 56,
        height: 56
    },
    textoAviso:{
        flex: 1,
        fontFamily: fonts.medium,
        fontSize: fs(14),
        color: colors.black
    },
    link:{
        textDecorationLine: daltonico ? "underline" : "none",
        fontFamily: fonts.semibold,
        fontSize: fs(14),
        color: colors.red700
    },
    rodape:{
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        flexWrap: "wrap"
    },
    textoRodape:{
        fontFamily: fonts.regular,
        fontSize: fs(14),
        color: colors.gray700
    }
})
