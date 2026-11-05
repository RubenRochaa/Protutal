import React, { useContext } from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { SeloPerfil } from "../SeloPerfil";
import { AuthContext } from "../../contexts/AuthContext";
import { LOGO_MODO_ESCURO } from "../../lib/mascotes";
import { colors, fonts, spacing } from "../../styles/theme";

interface HeaderProps {
    title: string;
    // Com onBack aparece a seta de voltar ao lado do título
    onBack?: () => void;
    // Só para o professor: sino de Notificações (no site fica ao lado do avatar)
    onNotificacoes?: () => void;
}

// Faixa vermelha das áreas logadas: logo, selo do perfil (com troca aluno/tutor),
// ajuda ("?"), sino (professor), "Sair" e, embaixo, o título da tela.
export function Header({ title, onBack, onNotificacoes }: HeaderProps){
    const { user, ehTutor, area, trocarArea, signOut } = useContext(AuthContext);
    const insets = useSafeAreaInsets();
    // A tela "Ajuda" existe em todas as pilhas logadas (professor, aluno e tutor) com o mesmo nome
    const navigation = useNavigation<NativeStackNavigationProp<{ Ajuda: undefined }>>();
    const route = useRoute();

    // Mesmo rótulo do selo do site: professor, ou aluno/tutor conforme a área aberta
    const rotulo = user.perfil === "professor" ? "Professor" : area === "tutor" ? "Tutor" : "Aluno";

    return (
        <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
            <View style={styles.linha}>
                <Image
                source={LOGO_MODO_ESCURO}
                style={styles.logo}
                resizeMode="contain"
                accessibilityLabel="Protutal"
                />

                <View style={styles.acoes}>
                    {user.perfil && (
                        <SeloPerfil rotulo={rotulo} onTrocar={ehTutor ? trocarArea : undefined} />
                    )}

                    {/* Ajuda/FAQ: registrada em todas as pilhas logadas; some na própria tela de Ajuda */}
                    {route.name !== "Ajuda" && (
                        <TouchableOpacity
                        onPress={() => navigation.navigate("Ajuda")}
                        accessibilityRole="button"
                        accessibilityLabel="Ajuda"
                        hitSlop={8}
                        >
                            <Feather name="help-circle" size={22} color={colors.white} />
                        </TouchableOpacity>
                    )}

                    {onNotificacoes && (
                        <TouchableOpacity
                        onPress={onNotificacoes}
                        accessibilityRole="button"
                        accessibilityLabel="Notificações"
                        hitSlop={8}
                        >
                            <Feather name="bell" size={22} color={colors.white} />
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity
                    onPress={signOut}
                    accessibilityRole="button"
                    accessibilityLabel="Sair"
                    hitSlop={8}
                    >
                        <Feather name="log-out" size={22} color={colors.white} />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.linhaTitulo}>
                {onBack && (
                    <TouchableOpacity
                    onPress={onBack}
                    accessibilityRole="button"
                    accessibilityLabel="Voltar"
                    hitSlop={10}
                    >
                        <Feather name="arrow-left" size={24} color={colors.white} />
                    </TouchableOpacity>
                )}

                <Text style={styles.titulo} numberOfLines={1} accessibilityRole="header">{title}</Text>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    header:{
        backgroundColor: colors.red700,
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.md,
        gap: spacing.sm
    },
    linha:{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between"
    },
    logo:{
        width: 130,
        height: 36
    },
    acoes:{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.lg
    },
    linhaTitulo:{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm
    },
    titulo:{
        flex: 1,
        fontFamily: fonts.semibold,
        fontSize: 20,
        color: colors.white
    }
})
