import React, { ReactNode, useMemo } from "react";
import {
    View,
    Text,
    Image,
    StyleSheet,
    TouchableOpacity
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { EvitarTeclado, RolagemTeclado } from "../EvitarTeclado";
import { BotaoAcessibilidade } from "../Acessibilidade";
import { LOGO_MODO_ESCURO, MASCOTES } from "../../lib/mascotes";
import { AuthStackParamsList } from "../../routes/auth.routes";
import { useTema, type TemaAtual } from "../../lib/useTema";
import { fonts, radius, shadows, spacing } from "../../styles/theme";

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
    const temaAtual = useTema();
    const styles = useMemo(() => makeStyles(temaAtual), [temaAtual]);
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamsList>>();

    return (
        <EvitarTeclado style={styles.container}>
            <RolagemTeclado contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + spacing.xxl }]}>
                <View style={[styles.painel, { paddingTop: insets.top + spacing.xl }]}>
                    {/* Telas públicas: o botão fica no canto da faixa vermelha */}
                    <View style={[styles.botaoAcessibilidade, { top: insets.top + spacing.sm }]}>
                        <BotaoAcessibilidade />
                    </View>

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

                    {/* Ajuda pública (seção "Geral" do FAQ): para quem não consegue entrar */}
                    <TouchableOpacity
                    style={styles.ajuda}
                    onPress={() => navigation.navigate("Ajuda")}
                    accessibilityRole="link"
                    hitSlop={8}
                    >
                        <Text style={styles.textoAjuda}>Precisa de ajuda?</Text>
                    </TouchableOpacity>
                </View>
            </RolagemTeclado>
        </EvitarTeclado>
    )
}

const makeStyles = ({ daltonico, colors, fontSizes, fs }: TemaAtual) => StyleSheet.create({
    container:{
        flex: 1,
        backgroundColor: colors.fundoPagina
    },
    scroll:{
        flexGrow: 1
    },
    painel:{
        alignItems: "center",
        backgroundColor: colors.destaque,
        paddingHorizontal: spacing.xl,
        paddingBottom: 48
    },
    botaoAcessibilidade:{
        position: "absolute",
        right: spacing.lg,
        zIndex: 1
    },
    logo:{
        width: 220,
        height: 60
    },
    frase:{
        fontFamily: fonts.medium,
        fontSize: fs(15),
        color: colors.textoSobreDestaque
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
        backgroundColor: colors.destaque
    },
    textoAba:{
        fontFamily: fonts.semibold,
        fontSize: fs(14),
        color: colors.gray700
    },
    textoAbaAtiva:{
        color: colors.textoSobreDestaque
    },
    ajuda:{
        alignSelf: "center"
    },
    textoAjuda:{
        textDecorationLine: daltonico ? "underline" : "none",
        fontFamily: fonts.regular,
        fontSize: fontSizes.selo,
        color: colors.gray700
    }
})
