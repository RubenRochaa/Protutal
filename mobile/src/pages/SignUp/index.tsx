import React, { useContext, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { AuthLayout } from "../../components/AuthLayout";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { ToastContext } from "../../contexts/ToastContext";
import { api } from "../../services/api";
import { getErrorMessage } from "../../lib/getErrorMessage";
import { perfilPeloEmail, validarCadastro } from "../../lib/validacao";
import { AuthStackParamsList } from "../../routes/auth.routes";
import { colors, fonts, spacing } from "../../styles/theme";

// Mesmas rotas do site (design/src/app/cadastro/actions.ts).
// Não há escolha de perfil: o domínio do e-mail diz se é professor ou aluno.
// Tutor não se cadastra: é um aluno que teve o pedido de tutoria aceito.
const ROTA_CADASTRO = {
    professor: "/professores",
    aluno: "/alunos",
}

export default function SignUp(){
    const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamsList>>();
    const { showToast } = useContext(ToastContext);

    const [nome, setNome] = useState("");
    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleCadastro(){
        const emailLimpo = email.trim();

        // Validação antes de enviar: se falhar, nem chama a API
        const erro = validarCadastro(nome, emailLimpo, senha);

        if(erro){
            showToast("erro", erro);
            return;
        }

        const perfil = perfilPeloEmail(emailLimpo)!;

        setLoading(true);

        try {
            const response = await api.post(ROTA_CADASTRO[perfil], { nome, email: emailLimpo, senha });

            // A API não devolve token no cadastro: volta para o login, que mostra o aviso
            // de confirmação com o botão de reenvio. A mensagem diz se o link foi enviado.
            showToast("sucesso", response.data.mensagem);
            navigation.navigate("SignIn", { cadastroConcluido: true, email: emailLimpo });
        } catch(err) {
            showToast("erro", getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    }

    return (
        <AuthLayout
        aba="cadastrar"
        onEntrar={() => navigation.navigate("SignIn")}
        onCadastrar={() => {}}
        >
            <View style={styles.form}>
                <Input
                label="Nome"
                icon="user"
                placeholder="Digite seu nome"
                autoComplete="name"
                value={nome}
                onChangeText={setNome}
                />

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
                autoComplete="new-password"
                value={senha}
                onChangeText={setSenha}
                />

                <Button
                title="Enviar"
                titleLoading="Enviando..."
                loading={loading}
                onPress={handleCadastro}
                />

                <View style={styles.rodape}>
                    <Text style={styles.textoRodape}>Tem conta? </Text>
                    <TouchableOpacity onPress={() => navigation.navigate("SignIn")} hitSlop={8}>
                        <Text style={styles.link}>Faça o login</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </AuthLayout>
    )
}

const styles = StyleSheet.create({
    form:{
        gap: spacing.lg
    },
    link:{
        fontFamily: fonts.semibold,
        fontSize: 14,
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
        fontSize: 14,
        color: colors.gray700
    }
})
