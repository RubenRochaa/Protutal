import React from "react";
import { View, Text, StyleSheet, Switch } from "react-native";

import { api } from "../../../services/api";
import { useAcao } from "../../../lib/useAcao";
import { TutorSala } from "../../../lib/types";
import { colors, fonts, fontSizes, radius, spacing } from "../../../styles/theme";

interface PermissaoAtividadesProps {
    idSala: number;
    // Tutores ativos (P24): o estado do interruptor sai do pode_criar_ativ deles
    tutores: TutorSala[];
    onAlterada: () => void;
}

// Interruptor "Tutores podem criar atividades" no topo da sala (site: components/permissaoAtividades).
// A P29 liga ou desliga de uma vez para TODOS os tutores ativos da sala
export function PermissaoAtividades({ idSala, tutores, onAlterada }: PermissaoAtividadesProps){
    const { executando, executar } = useAcao();

    const semTutores = tutores.length === 0;
    const todos = !semTutores && tutores.every((tutor) => tutor.pode_criar_ativ);
    const alguns = !todos && tutores.some((tutor) => tutor.pode_criar_ativ);

    // Ligado = todos podem. Misturado ou desligado: o toque concede para todos
    function handleAlterar(){
        const podeCriar = !todos;

        executar(
            () => api.patch(`/salas/${idSala}/permissao-atividades`, { pode_criar_ativ: podeCriar }),
            podeCriar ? "Os tutores da sala agora podem criar atividades." : "Os tutores da sala não podem mais criar atividades.",
            onAlterada
        );
    }

    let explicacao = todos ? "Todos os tutores da sala podem criar atividades." : "Os tutores da sala não podem criar atividades.";
    if(alguns) explicacao = "Alguns tutores têm permissão. Ligue para conceder a todos.";
    if(semTutores) explicacao = "A sala ainda não tem tutores ativos.";

    return (
        <View style={styles.permissao}>
            <View style={styles.linha}>
                <Text style={styles.rotulo}>Tutores podem criar atividades</Text>
                <Switch
                value={todos}
                onValueChange={handleAlterar}
                disabled={executando || semTutores}
                trackColor={{ false: colors.gray300, true: colors.red700 }}
                thumbColor={colors.white}
                accessibilityLabel="Tutores podem criar atividades"
                />
            </View>

            <Text style={styles.explicacao}>{executando ? "Salvando..." : explicacao}</Text>
        </View>
    )
}

const styles = StyleSheet.create({
    permissao:{
        gap: spacing.xs,
        padding: spacing.md,
        borderRadius: radius.cardSm,
        backgroundColor: colors.gray100
    },
    linha:{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: spacing.md
    },
    rotulo:{
        flex: 1,
        fontFamily: fonts.medium,
        fontSize: fontSizes.label,
        color: colors.black
    },
    explicacao:{
        fontFamily: fonts.regular,
        fontSize: 13,
        color: colors.gray700
    }
})
