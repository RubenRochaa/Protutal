import React from "react";
import { createBottomTabNavigator, BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator, NativeStackScreenProps } from "@react-navigation/native-stack";
import { CompositeScreenProps, NavigatorScreenParams } from "@react-navigation/native";

import Inicio from "../pages/tutor/Inicio";
import Tutorados from "../pages/tutor/Tutorados";
import DetalheTutorado from "../pages/tutor/DetalheTutorado";
import ChatTutorado from "../pages/tutor/ChatTutorado";
import MateriaisSala from "../pages/tutor/MateriaisSala";
import AvisosSala from "../pages/tutor/AvisosSala";
import Atividades from "../pages/tutor/Atividades";
import NovaAtividade from "../pages/tutor/NovaAtividade";
import CorrigirAtividade from "../pages/tutor/CorrigirAtividade";
import Contestacoes from "../pages/tutor/Contestacoes";
import Feedbacks from "../pages/tutor/Feedbacks";
import Desempenho from "../pages/tutor/Desempenho";
import Ajuda from "../pages/Ajuda";
import { ProvedorContadores, useContadores } from "../lib/useContadores";
import { useTabOpcoes } from "./tabOptions";

// Telas da área do tutor (menu do site em design/src/app/tutor/layout.tsx).
// Cada aba tem a sua pilha; as telas usadas por mais de uma aba são registradas em cada pilha,
// para o "voltar" voltar para onde o tutor estava
export type TutorStackParamsList = {
    PainelTutor: undefined;
    ListaAtividadesTutor: undefined;
    // id_tutoria: tutorado já escolhido (botão "+ Nova atividade" da Tutoria)
    NovaAtividade: { id_tutoria?: number } | undefined;
    CorrigirAtividade: { id_atividade: number };
    Tutorados: undefined;
    DetalheTutorado: { id_tutoria: number };
    ChatTutorado: { id_tutoria: number };
    MateriaisSala: { id_sala: number; nome_sala: string };
    AvisosSala: { id_sala: number; nome_sala: string };
    // Fora da barra de abas: abre pelo Início e pela correção da atividade
    Contestacoes: undefined;
    FeedbacksRecebidos: undefined;
    DesempenhoTutor: undefined;
    // Ícone "?" do Header
    Ajuda: undefined;
};

// 5 abas: os itens do menu do site mais "Início"; Contestações fica fora da barra
export type TutorTabParamsList = {
    Inicio: NavigatorScreenParams<TutorStackParamsList>;
    Atividades: NavigatorScreenParams<TutorStackParamsList>;
    Tutoria: NavigatorScreenParams<TutorStackParamsList>;
    Feedbacks: NavigatorScreenParams<TutorStackParamsList>;
    Desempenho: NavigatorScreenParams<TutorStackParamsList>;
};

// Props de uma tela do tutor: navega na própria pilha e também para as outras abas
export type TutorScreenProps<T extends keyof TutorStackParamsList> = CompositeScreenProps<
    NativeStackScreenProps<TutorStackParamsList, T>,
    BottomTabScreenProps<TutorTabParamsList>
>;

const Tab = createBottomTabNavigator<TutorTabParamsList>();
const Stack = createNativeStackNavigator<TutorStackParamsList>();

// Telas abertas a partir de várias abas
function telasComuns(){
    return (
        <>
            <Stack.Screen name="CorrigirAtividade" component={CorrigirAtividade} />
            <Stack.Screen name="NovaAtividade" component={NovaAtividade} />
            <Stack.Screen name="Contestacoes" component={Contestacoes} />
            <Stack.Screen name="Ajuda" component={Ajuda} />
        </>
    )
}

function InicioStack(){
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="PainelTutor" component={Inicio} />
            {telasComuns()}
        </Stack.Navigator>
    )
}

function AtividadesStack(){
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="ListaAtividadesTutor" component={Atividades} />
            {telasComuns()}
        </Stack.Navigator>
    )
}

function TutoriaStack(){
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Tutorados" component={Tutorados} />
            <Stack.Screen name="DetalheTutorado" component={DetalheTutorado} />
            <Stack.Screen name="ChatTutorado" component={ChatTutorado} />
            <Stack.Screen name="MateriaisSala" component={MateriaisSala} />
            <Stack.Screen name="AvisosSala" component={AvisosSala} />
            {telasComuns()}
        </Stack.Navigator>
    )
}

function FeedbacksStack(){
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="FeedbacksRecebidos" component={Feedbacks} />
            <Stack.Screen name="Ajuda" component={Ajuda} />
        </Stack.Navigator>
    )
}

function DesempenhoStack(){
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="DesempenhoTutor" component={Desempenho} />
            <Stack.Screen name="Ajuda" component={Ajuda} />
        </Stack.Navigator>
    )
}

// Abas com a bolinha de notificação (mesmos contadores do menu do tutor no site).
// O de Contestações, que não é aba, aparece no card do Início
function AbasTutor() {
    const { menu } = useContadores();
    const { tabScreenOptions, tabOptions, badgeAba } = useTabOpcoes();

    return(
        // Mesmo comportamento da área do aluno: a aba que ficou para trás volta para a primeira tela
        // e a barra some com o teclado aberto
        <Tab.Navigator screenOptions={{ ...tabScreenOptions, popToTopOnBlur: true, tabBarHideOnKeyboard: true }}>
            <Tab.Screen name="Inicio" component={InicioStack} options={tabOptions("Início", "home")} />
            <Tab.Screen name="Atividades" component={AtividadesStack} options={{ ...tabOptions("Atividades", "clipboard"), ...badgeAba(menu.atividades) }} />
            {/* Soma o chat dos tutorados e os avisos das salas */}
            <Tab.Screen name="Tutoria" component={TutoriaStack} options={{ ...tabOptions("Tutoria", "users"), ...badgeAba(menu.tutoria) }} />
            <Tab.Screen name="Feedbacks" component={FeedbacksStack} options={tabOptions("Feedbacks", "message-square")} />
            <Tab.Screen name="Desempenho" component={DesempenhoStack} options={tabOptions("Desempenho", "bar-chart-2")} />
        </Tab.Navigator>
    )
}

function TutorRoutes() {
    return(
        // Contadores da área do tutor, separados dos da área do aluno
        <ProvedorContadores area="tutor">
            <AbasTutor />
        </ProvedorContadores>
    )
}

export default TutorRoutes;
