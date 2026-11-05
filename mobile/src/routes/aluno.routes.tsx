import React from "react";
import { createBottomTabNavigator, BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator, NativeStackScreenProps } from "@react-navigation/native-stack";
import { CompositeScreenProps, NavigatorScreenParams } from "@react-navigation/native";

import Inicio from "../pages/aluno/Inicio";
import Atividades from "../pages/aluno/Atividades";
import DetalheAtividade from "../pages/aluno/DetalheAtividade";
import ContestarNota from "../pages/aluno/ContestarNota";
import Desempenho from "../pages/aluno/Desempenho";
import Tutoria from "../pages/aluno/Tutoria";
import DetalheTutoria from "../pages/aluno/DetalheTutoria";
import ConteudosAprendidos from "../pages/aluno/ConteudosAprendidos";
import ChatTutoria from "../pages/aluno/ChatTutoria";
import FeedbackTutor from "../pages/aluno/FeedbackTutor";
import Ajuda from "../pages/Ajuda";
import { tabOptions, tabScreenOptions } from "./tabOptions";

// Telas da área do aluno. Cada aba tem a sua pilha; as telas usadas em mais de uma aba
// (ex.: Detalhe da atividade) são registradas em cada pilha, para o "voltar" voltar para onde o aluno estava
export type AlunoStackParamsList = {
    PainelAluno: undefined;
    ListaAtividades: undefined;
    DetalheAtividade: { id_atividade: number };
    ContestarNota: {
        id_nota: number;
        id_atividade: number;
        titulo: string;
        // Ex.: "Relevo · 1ª etapa"
        detalhe: string;
        valor: number;
    };
    MeuDesempenho: undefined;
    MinhaTutoria: undefined;
    DetalheTutoria: { id_tutoria: number };
    ChatTutoria: { id_tutoria: number };
    ConteudosAprendidos: { id_sala: number; nome_sala: string };
    FeedbackTutor: { id_tutoria: number };
    // Ícone "?" do Header
    Ajuda: undefined;
};

// Abas na ordem do Figma, com os nomes do menu do site (MENU_ALUNO) mais "Início"
export type AlunoTabParamsList = {
    Inicio: NavigatorScreenParams<AlunoStackParamsList>;
    Atividades: NavigatorScreenParams<AlunoStackParamsList>;
    Tutoria: NavigatorScreenParams<AlunoStackParamsList>;
    Desempenho: NavigatorScreenParams<AlunoStackParamsList>;
};

// Props de uma tela do aluno: navega na própria pilha e também para as outras abas
export type AlunoScreenProps<T extends keyof AlunoStackParamsList> = CompositeScreenProps<
    NativeStackScreenProps<AlunoStackParamsList, T>,
    BottomTabScreenProps<AlunoTabParamsList>
>;

const Tab = createBottomTabNavigator<AlunoTabParamsList>();
const Stack = createNativeStackNavigator<AlunoStackParamsList>();

// Telas de atividade usadas por várias abas (e a Ajuda, aberta pelo "?" do Header em qualquer aba)
function telasAtividade(){
    return (
        <>
            <Stack.Screen name="DetalheAtividade" component={DetalheAtividade} />
            <Stack.Screen name="ContestarNota" component={ContestarNota} />
            <Stack.Screen name="Ajuda" component={Ajuda} />
        </>
    )
}

function InicioStack(){
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="PainelAluno" component={Inicio} />
            {telasAtividade()}
        </Stack.Navigator>
    )
}

function AtividadesStack(){
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="ListaAtividades" component={Atividades} />
            {telasAtividade()}
        </Stack.Navigator>
    )
}

function TutoriaStack(){
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="MinhaTutoria" component={Tutoria} />
            <Stack.Screen name="DetalheTutoria" component={DetalheTutoria} />
            <Stack.Screen name="ChatTutoria" component={ChatTutoria} />
            <Stack.Screen name="ConteudosAprendidos" component={ConteudosAprendidos} />
            <Stack.Screen name="FeedbackTutor" component={FeedbackTutor} />
            {telasAtividade()}
        </Stack.Navigator>
    )
}

function DesempenhoStack(){
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="MeuDesempenho" component={Desempenho} />
            {telasAtividade()}
        </Stack.Navigator>
    )
}

function AlunoRoutes() {
    return(
        // popToTopOnBlur: ao trocar de aba, a pilha da aba que ficou para trás volta para a primeira tela.
        // tabBarHideOnKeyboard: no Android a barra some com o teclado aberto (campo do chat e formulários)
        <Tab.Navigator screenOptions={{ ...tabScreenOptions, popToTopOnBlur: true, tabBarHideOnKeyboard: true }}>
            <Tab.Screen name="Inicio" component={InicioStack} options={tabOptions("Início", "home")} />
            <Tab.Screen name="Atividades" component={AtividadesStack} options={tabOptions("Minhas atividades", "book")} />
            <Tab.Screen name="Tutoria" component={TutoriaStack} options={tabOptions("Tutoria", "message-circle")} />
            <Tab.Screen name="Desempenho" component={DesempenhoStack} options={tabOptions("Meu desempenho", "trending-up")} />
        </Tab.Navigator>
    )
}

export default AlunoRoutes;
