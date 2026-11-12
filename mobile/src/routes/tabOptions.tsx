import React, { ComponentProps } from "react";
import { Text } from "react-native";
import { Feather } from "@expo/vector-icons";
import { BottomTabNavigationOptions } from "@react-navigation/bottom-tabs";

import { textoContador } from "../components/Contador";
import { colors, fonts, fontSizes } from "../styles/theme";

type IconName = ComponentProps<typeof Feather>["name"];

// Visual da barra de abas, igual para professor, aluno e tutor:
// aba ativa em vermelho (como o link ativo do menu do site) e inativa em cinza
export const tabScreenOptions: BottomTabNavigationOptions = {
    headerShown: false,
    tabBarActiveTintColor: colors.red700,
    tabBarInactiveTintColor: colors.gray700,
    tabBarStyle: {
        backgroundColor: colors.white,
        borderTopColor: colors.gray300
    }
}

// Ícone e rótulo de uma aba. O rótulo quebra em até 2 linhas,
// para os nomes do menu do site caberem sem ser cortados (ex.: "Minhas atividades")
export function tabOptions(label: string, icon: IconName): BottomTabNavigationOptions {
    return {
        title: label,
        tabBarAccessibilityLabel: label,
        tabBarIcon: ({ color, size }) => <Feather name={icon} size={size - 2} color={color} />,
        tabBarLabel: ({ color }) => (
            <Text
            numberOfLines={2}
            style={{
                color,
                fontFamily: fonts.medium,
                fontSize: fontSizes.aba,
                textAlign: "center",
                lineHeight: 13
            }}
            >
                {label}
            </Text>
        )
    }
}

// Bolinha de notificação da aba (tabBarBadge), no estilo do Contador: vermelho do app e texto branco,
// "9+" acima de 9. Com 0 não aparece
export function badgeAba(valor: number | undefined): BottomTabNavigationOptions {
    return {
        tabBarBadge: valor && valor > 0 ? textoContador(valor) : undefined,
        tabBarBadgeStyle: {
            backgroundColor: colors.red700,
            color: colors.white,
            fontFamily: fonts.bold,
            fontSize: 10
        }
    }
}
