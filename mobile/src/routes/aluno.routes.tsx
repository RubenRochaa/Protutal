import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import EmConstrucao from "../pages/EmConstrucao";
import { tabOptions, tabScreenOptions } from "./tabOptions";

// Mesmos itens do menu do aluno no site (MENU_ALUNO), mais "Início" (no site é a logo)
export type AlunoTabParamsList = {
    Inicio: undefined;
    Atividades: undefined;
    Desempenho: undefined;
    Tutoria: undefined;
};

const Tab = createBottomTabNavigator<AlunoTabParamsList>();

function AlunoRoutes() {
    return(
        <Tab.Navigator screenOptions={tabScreenOptions}>
            <Tab.Screen name="Inicio" options={tabOptions("Início", "home")}>
                {() => <EmConstrucao title="Início" />}
            </Tab.Screen>

            <Tab.Screen name="Atividades" options={tabOptions("Minhas atividades", "clipboard")}>
                {() => <EmConstrucao title="Minhas atividades" />}
            </Tab.Screen>

            <Tab.Screen name="Desempenho" options={tabOptions("Meu desempenho", "bar-chart-2")}>
                {() => <EmConstrucao title="Meu desempenho" />}
            </Tab.Screen>

            <Tab.Screen name="Tutoria" options={tabOptions("Tutoria", "users")}>
                {() => <EmConstrucao title="Tutoria" />}
            </Tab.Screen>
        </Tab.Navigator>
    )
}

export default AlunoRoutes;
