import React, { ReactNode } from "react";
import {
    View,
    Text,
    Image,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { LOGO_MODO_ESCURO, MASCOTES } from "../../lib/mascotes";
import { colors, fonts, radius, shadows, spacing } from "../../styles/theme";

interface AuthLayoutProps {
    // sem aba (esqueci a senha): as duas abas aparecem sem destaque, como no site
    aba?: "entrar" | "cadastrar";
    onEntrar: () => void;
    onCadastrar: () => void;
    children: ReactNode;
}

// Moldura das telas de login, cadastro e esqueci a senha, igual ao AuthLayout do site:
// faixa vermelha com a logo, a frase e o mascote; embaixo, o cartão com as abas ENTRAR / CADASTRAR
export function AuthLayout({ aba, onEntrar, onCadastrar, children }: AuthLayoutProps){
    const insets = useSafeAreaInsets();

    return (
        <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <ScrollView
            contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + spacing.xxl }]}
            keyboardShouldPersistTaps="handled"
            >
                <View style={[styles.painel, { paddingTop: insets.top + spacing.xl }]}>
                    <Image
                    source={LOGO_MODO_ESCURO}
                    style={styles.logo}
                    resizeMode="contain"
                    accessibilityLabel="Protutal"
                    />
                    <Text style={styles.frase}>Tutoria entre alunos da rede SESI</Text>
                    <Image source={MASCOTES.telaInicial} style={styles.mascote} resizeMode="contain" />
                </View>

                <View style={styles.cartao}>
                    <View style={styles.abas}>
                        <TouchableOpacity
                        style={[styles.aba, aba === "entrar" && styles.abaAtiva]}
                        onPress={onEntrar}
                        accessibilityRole="tab"
                        accessibilityState={{ selected: aba === "entrar" }}
                        >
                            <Text style={[styles.textoAba, aba === "entrar" && styles.textoAbaAtiva]}>ENTRAR</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                        style={[styles.aba, aba === "cadastrar" && styles.abaAtiva]}
                        onPress={onCadastrar}
                        accessibilityRole="tab"
                        accessibilityState={{ selected: aba === "cadastrar" }}
                        >
                            <Text style={[styles.textoAba, aba === "cadastrar" && styles.textoAbaAtiva]}>CADASTRAR</Text>
                        </TouchableOpacity>
                    </View>

                    {children}
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    )
}

const styles = StyleSheet.create({
    container:{
        flex: 1,
        backgroundColor: colors.white
    },
    scroll:{
        flexGrow: 1
    },
    painel:{
        alignItems: "center",
        backgroundColor: colors.red700,
        paddingHorizontal: spacing.xl,
        paddingBottom: 48
    },
    logo:{
        width: 220,
        height: 60
    },
    frase:{
        fontFamily: fonts.medium,
        fontSize: 15,
        color: colors.white
    },
    mascote:{
        width: 120,
        height: 120,
        marginTop: spacing.md
    },
    cartao:{
        gap: spacing.lg,
        marginTop: -32,
        marginHorizontal: spacing.lg,
        padding: spacing.xl,
        borderRadius: radius.card,
        backgroundColor: colors.white,
        ...shadows.card
    },
    abas:{
        flexDirection: "row",
        gap: spacing.sm
    },
    aba:{
        flex: 1,
        alignItems: "center",
        paddingVertical: 10,
        borderRadius: radius.input,
        backgroundColor: colors.gray300
    },
    abaAtiva:{
        backgroundColor: colors.red700
    },
    textoAba:{
        fontFamily: fonts.semibold,
        fontSize: 14,
        color: colors.gray700
    },
    textoAbaAtiva:{
        color: colors.white
    }
})
