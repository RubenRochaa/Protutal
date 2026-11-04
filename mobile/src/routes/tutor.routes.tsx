import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import EmConstrucao from "../pages/EmConstrucao";
import { tabOptions, tabScreenOptions } from "./tabOptions";

// Mesmos itens do menu do tutor no site (design/src/app/tutor/layout.tsx), mais "Início".
// A volta para a área do aluno é o ícone de troca ao lado do selo "Tutor", no Header
export type TutorTabParamsList = {
    Inicio: undefined;
    Atividades: undefined;
    Tutoria: undefined;
    Contestacoes: undefined;
    Feedbacks: undefined;
    Desempenho: undefined;
};

const Tab = createBottomTabNavigator<TutorTabParamsList>();

function TutorRoutes() {
    return(
        <Tab.Navigator screenOptions={tabScreenOptions}>
            <Tab.Screen name="Inicio" options={tabOptions("Início", "home")}>
                {() => <EmConstrucao title="Início" />}
            </Tab.Screen>

            <Tab.Screen name="Atividades" options={tabOptions("Atividades", "clipboard")}>
                {() => <EmConstrucao title="Atividades" />}
            </Tab.Screen>

            <Tab.Screen name="Tutoria" options={tabOptions("Tutoria", "users")}>
                {() => <EmConstrucao title="Tutoria" />}
            </Tab.Screen>

            <Tab.Screen name="Contestacoes" options={tabOptions("Contestações", "flag")}>
                {() => <EmConstrucao title="Contestações" />}
            </Tab.Screen>

            <Tab.Screen name="Feedbacks" options={tabOptions("Feedbacks", "message-square")}>
                {() => <EmConstrucao title="Feedbacks" />}
            </Tab.Screen>

            <Tab.Screen name="Desempenho" options={tabOptions("Desempenho", "bar-chart-2")}>
                {() => <EmConstrucao title="Desempenho" />}
            </Tab.Screen>
        </Tab.Navigator>
    )
}

export default TutorRoutes;
