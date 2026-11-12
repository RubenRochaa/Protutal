import React, { useContext, useEffect, useState, useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { AuthLayout } from "../../components/AuthLayout";
import { AvisoConfirmacao } from "../../components/AvisoConfirmacao";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { AuthContext } from "../../contexts/AuthContext";
import { ToastContext } from "../../contexts/ToastContext";
import { getErrorMessage, getErrorStatus } from "../../lib/getErrorMessage";
import { validarLogin } from "../../lib/validacao";
import { AuthStackParamsList } from "../../routes/auth.routes";
import { useTema, type TemaAtual } from "../../lib/useTema";
import { fonts, spacing } from "../../styles/theme";

export default function SignIn(){
    const temaAtual = useTema();
    const styles = useMemo(() => makeStyles(temaAtual), [temaAtual]);
    const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamsList>>();
    const route = useRoute<RouteProp<AuthStackParamsList, "SignIn">>();

    const { signIn, loadingAuth } = useContext(AuthContext);
    const { showToast } = useContext(ToastContext);

    const [email, setEmail] = useState(route.params?.email ?? "");
    const [senha, setSenha] = useState("");
    // Login recusado (403) por e-mail ainda não confirmado
    const [emailNaoConfirmado, setEmailNaoConfirmado] = useState(false);

    // O cadastro volta para cá com cadastroConcluido, para mostrar o aviso com o reenvio
    const cadastroConcluido = !!route.params?.cadastroConcluido;

    // A tela de login já existe na pilha: quando o cadastro volta para cá,
    // o e-mail cadastrado chega pelos params e preenche o campo (usado no reenvio)
    useEffect(() => {
        if(route.params?.email){
            setEmail(route.params.email);
            setEmailNaoConfirmado(false);
        }
    }, [route.params?.email]);

    async function handleLogin(){
        // Validação antes de enviar: se falhar, nem chama a API
        const erro = validarLogin(email, senha);

        if(erro){
            showToast("erro", erro);
            return;
        }

        try {
            const usuario = await signIn({ email, senha });

            showToast("sucesso", `Bem-vindo(a), ${usuario.nome}!`);
        } catch(err) {
            // No login, 401 = "Email ou senha incorretos"; o único 403 é o de e-mail não confirmado
            setEmailNaoConfirmado(getErrorStatus(err) === 403);
            showToast("erro", getErrorMessage(err));
        }
    }

    return (
        <AuthLayout
        aba="entrar"
        onEntrar={() => {}}
        onCadastrar={() => navigation.navigate("SignUp")}
        >
            <View style={styles.form}>
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

                <Input
                label="Senha"
                icon="lock"
                placeholder="Digite sua senha"
                secureTextEntry
                autoCapitalize="none"
                autoComplete="current-password"
                value={senha}
                onChangeText={setSenha}
                />

                <TouchableOpacity
                style={styles.esqueceu}
                onPress={() => navigation.navigate("ForgotPassword")}
                hitSlop={8}
                >
                    <Text style={styles.link}>Esqueceu sua senha?</Text>
                </TouchableOpacity>

                {emailNaoConfirmado ? (
                    <AvisoConfirmacao
                    texto="Seu e-mail ainda não foi confirmado."
                    textoBotao="Reenviar e-mail de confirmação"
                    email={email}
                    />
                ) : cadastroConcluido && (
                    <AvisoConfirmacao
                    texto="Enviamos um link de confirmação para o seu e-mail."
                    textoBotao="Não recebeu? Reenviar e-mail"
                    email={email}
                    />
                )}

                <Button
                title="ENTRAR"
                titleLoading="Entrando..."
                loading={loadingAuth}
                onPress={handleLogin}
                />

                <View style={styles.rodape}>
                    <Text style={styles.textoRodape}>Ainda não tem conta? </Text>
                    <TouchableOpacity onPress={() => navigation.navigate("SignUp")} hitSlop={8}>
                        <Text style={styles.link}>Cadastre-se</Text>
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
    esqueceu:{
        alignSelf: "flex-end",
        marginTop: -spacing.sm
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
