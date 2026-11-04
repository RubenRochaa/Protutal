import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator, NativeStackScreenProps } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import EmConstrucao from "../pages/EmConstrucao";
import { tabOptions, tabScreenOptions } from "./tabOptions";

// Pilha do professor: as abas e, por cima delas, Notificações (o sino do Header),
// porque no site Notificações também fica fora do menu de texto, ao lado do avatar
export type ProfessorStackParamsList = {
    Abas: undefined;
    Notificacoes: undefined;
};

// Mesmos itens do menu do professor no site (MENU_PROFESSOR), mais "Início" (no site é a logo)
export type ProfessorTabParamsList = {
    Inicio: undefined;
    Salas: undefined;
    Tutoria: undefined;
    Desempenho: undefined;
};

const Stack = createNativeStackNavigator<ProfessorStackParamsList>();
const Tab = createBottomTabNavigator<ProfessorTabParamsList>();

// Tela provisória de uma aba do professor, com o sino que abre Notificações
function TelaProfessor({ title }: { title: string }){
    const navigation = useNavigation<NativeStackNavigationProp<ProfessorStackParamsList>>();

    return <EmConstrucao title={title} onNotificacoes={() => navigation.navigate("Notificacoes")} />
}

function Notificacoes({ navigation }: NativeStackScreenProps<ProfessorStackParamsList, "Notificacoes">){
    return <EmConstrucao title="Notificações" onBack={navigation.goBack} />
}

function ProfessorTabs() {
    return(
        <Tab.Navigator screenOptions={tabScreenOptions}>
            <Tab.Screen name="Inicio" options={tabOptions("Início", "home")}>
                {() => <TelaProfessor title="Início" />}
            </Tab.Screen>

            <Tab.Screen name="Salas" options={tabOptions("Salas", "layers")}>
                {() => <TelaProfessor title="Salas" />}
            </Tab.Screen>

            <Tab.Screen name="Tutoria" options={tabOptions("Tutoria", "users")}>
                {() => <TelaProfessor title="Tutoria" />}
            </Tab.Screen>

            <Tab.Screen name="Desempenho" options={tabOptions("Desempenho", "bar-chart-2")}>
                {() => <TelaProfessor title="Desempenho" />}
            </Tab.Screen>
        </Tab.Navigator>
    )
}

function ProfessorRoutes() {
    return(
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Abas" component={ProfessorTabs} />
            <Stack.Screen name="Notificacoes" component={Notificacoes} />
        </Stack.Navigator>
    )
}

export default ProfessorRoutes;
