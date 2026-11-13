import React, { useContext, useRef, useState, useMemo } from "react";
import {
    View,
    Text,
    Image,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Animated,
    Linking
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Header } from "../../components/Header";
import { BotaoAcessibilidade } from "../../components/Acessibilidade";
import { Card } from "../../components/Card";
import { AuthContext } from "../../contexts/AuthContext";
import { ToastContext } from "../../contexts/ToastContext";
import { IdSecaoFaq, PerguntaFaq, SECOES_FAQ, SECOES_POR_PERFIL } from "../../lib/faqData";
import {
    EMAIL_SUPORTE,
    EMAIL_SUPORTE_URL,
    FORM_MELHORIA_URL,
    GITHUB_URL,
    IDENTIFICACAO,
    WHATSAPP_TEXTO,
    WHATSAPP_URL
} from "../../lib/rodapeLinks";
import { LOGO_MODO_ESCURO } from "../../lib/mascotes";
import { AuthStackParamsList } from "../../routes/auth.routes";
import { useTema, type TemaAtual } from "../../lib/useTema";
import { fonts, radius, spacing } from "../../styles/theme";

type IconeFeather = React.ComponentProps<typeof Feather>["name"];

// Mesmos ícones do rodapé do site (lucide), trocados pelos equivalentes do Feather
const CONTATOS: { icone: IconeFeather; texto: string; url: string }[] = [
    { icone: "mail", texto: EMAIL_SUPORTE, url: EMAIL_SUPORTE_URL },
    { icone: "message-circle", texto: `WhatsApp ${WHATSAPP_TEXTO}`, url: WHATSAPP_URL },
    { icone: "github", texto: "Repositório no GitHub", url: GITHUB_URL },
    { icone: "message-square", texto: "Nos ajude a melhorar", url: FORM_MELHORIA_URL },
];

// Página de Ajuda/FAQ (site: design/src/app/ajuda). Registrada nas rotas públicas e nas pilhas
// de professor, aluno e tutor. Quem não está logado vê só a seção "Geral"; quem está logado
// vê também as seções do próprio perfil (SECOES_POR_PERFIL). No fim, "Fale conosco" com o
// conteúdo do rodapé do site
export default function Ajuda(){
    const temaAtual = useTema();
    const styles = useMemo(() => makeStyles(temaAtual), [temaAtual]);
    const { colors } = temaAtual;
    // A tela fica em várias pilhas: o tipo das rotas públicas só é usado no "Voltar para o login"
    const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamsList>>();
    const insets = useSafeAreaInsets();

    const { isAuthenticated, user } = useContext(AuthContext);
    const { showToast } = useContext(ToastContext);

    const logado = isAuthenticated && user.perfil !== null;

    const idsSecoes: IdSecaoFaq[] = logado && user.perfil ? SECOES_POR_PERFIL[user.perfil] : ["geral"];
    const secoes = SECOES_FAQ.filter((secao) => idsSecoes.includes(secao.id));

    // E-mail abre o app de e-mail; WhatsApp, GitHub e formulário abrem no app/navegador
    async function abrirLink(url: string){
        try {
            await Linking.openURL(url);
        } catch {
            showToast("erro", "Não foi possível abrir o link.");
        }
    }

    return (
        <View style={styles.container}>
            {logado ? (
                <Header title="Ajuda" onBack={navigation.canGoBack() ? navigation.goBack : undefined} />
            ) : (
                // Fora da área logada não há selo nem "Sair": só a faixa com a logo e o título
                <View style={[styles.faixa, { paddingTop: insets.top + spacing.sm }]}>
                    <Image
                    source={LOGO_MODO_ESCURO}
                    style={styles.logo}
                    resizeMode="contain"
                    accessibilityLabel="Protutal"
                    />
                    <View style={styles.linhaTituloFaixa}>
                        <Text style={styles.tituloFaixa} accessibilityRole="header">Ajuda</Text>
                        <BotaoAcessibilidade />
                    </View>
                </View>
            )}

            <ScrollView contentContainerStyle={[styles.conteudo, { paddingBottom: insets.bottom + spacing.xxl }]}>
                {!logado && (
                    <TouchableOpacity
                    style={styles.voltar}
                    onPress={() => navigation.navigate("SignIn")}
                    accessibilityRole="link"
                    hitSlop={8}
                    >
                        <Feather name="arrow-left" size={20} color={colors.red700} />
                        <Text style={styles.textoVoltar}>Voltar para o login</Text>
                    </TouchableOpacity>
                )}

                {secoes.map((secao) => (
                    <Card key={secao.id} title={secao.titulo}>
                        <View style={styles.lista}>
                            {secao.perguntas.map((item) => (
                                <ItemFaq key={item.pergunta} item={item} />
                            ))}
                        </View>
                    </Card>
                ))}

                <Card title="Fale conosco">
                    <Text style={styles.identificacao}>{IDENTIFICACAO}</Text>

                    {CONTATOS.map((contato) => (
                        <TouchableOpacity
                        key={contato.url}
                        style={styles.contato}
                        onPress={() => abrirLink(contato.url)}
                        accessibilityRole="link"
                        hitSlop={4}
                        >
                            <Feather name={contato.icone} size={16} color={colors.red700} />
                            <Text style={styles.textoContato}>{contato.texto}</Text>
                        </TouchableOpacity>
                    ))}
                </Card>
            </ScrollView>
        </View>
    )
}

// Uma pergunta do FAQ (acordeão): começa fechada, abre e fecha com um toque
// e a seta gira, como o <details> do site
function ItemFaq({ item }: { item: PerguntaFaq }){
    const temaAtual = useTema();
    const styles = useMemo(() => makeStyles(temaAtual), [temaAtual]);
    const { colors } = temaAtual;
    const [aberto, setAberto] = useState(false);
    const giro = useRef(new Animated.Value(0)).current;

    function alternar(){
        const novo = !aberto;

        setAberto(novo);
        Animated.timing(giro, {
            toValue: novo ? 1 : 0,
            duration: 200,
            useNativeDriver: true
        }).start();
    }

    const rotate = giro.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "180deg"] });

    return (
        <View style={styles.item}>
            <TouchableOpacity
            style={styles.pergunta}
            onPress={alternar}
            accessibilityRole="button"
            accessibilityState={{ expanded: aberto }}
            >
                <Text style={styles.textoPergunta}>{item.pergunta}</Text>
                <Animated.View style={{ transform: [{ rotate }] }}>
                    <Feather name="chevron-down" size={20} color={colors.red700} />
                </Animated.View>
            </TouchableOpacity>

            {aberto && <Text style={styles.resposta}>{item.resposta}</Text>}
        </View>
    )
}

const makeStyles = ({ daltonico, colors, fontSizes, fs }: TemaAtual) => StyleSheet.create({
    container:{
        flex: 1,
        backgroundColor: colors.fundoPagina
    },
    linhaTituloFaixa:{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: spacing.sm
    },
    faixa:{
        backgroundColor: colors.destaque,
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.md,
        gap: spacing.sm
    },
    logo:{
        width: 130,
        height: 36
    },
    tituloFaixa:{
        fontFamily: fonts.semibold,
        fontSize: fs(20),
        color: colors.textoSobreDestaque
    },
    conteudo:{
        flexGrow: 1,
        gap: spacing.lg,
        padding: spacing.lg
    },
    voltar:{
        alignSelf: "flex-start",
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm
    },
    textoVoltar:{
        textDecorationLine: daltonico ? "underline" : "none",
        fontFamily: fonts.medium,
        fontSize: fontSizes.base,
        color: colors.red700
    },
    lista:{
        gap: spacing.sm
    },
    item:{
        borderWidth: 1,
        borderColor: colors.gray300,
        borderRadius: radius.item
    },
    pergunta:{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        padding: spacing.md
    },
    textoPergunta:{
        flex: 1,
        fontFamily: fonts.medium,
        fontSize: fs(15),
        color: colors.black
    },
    resposta:{
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.md,
        fontFamily: fonts.regular,
        fontSize: fs(14),
        color: colors.gray700
    },
    identificacao:{
        fontFamily: fonts.regular,
        fontSize: fs(13),
        color: colors.gray700
    },
    contato:{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm
    },
    textoContato:{
        textDecorationLine: daltonico ? "underline" : "none",
        flex: 1,
        fontFamily: fonts.medium,
        fontSize: fs(14),
        color: colors.red700
    }
})
