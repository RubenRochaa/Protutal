import React from "react";
import { createBottomTabNavigator, BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator, NativeStackScreenProps } from "@react-navigation/native-stack";
import { CompositeScreenProps, NavigatorScreenParams } from "@react-navigation/native";

import PainelProfessor from "../pages/professor/Inicio";
import ListaSalas from "../pages/professor/Salas";
import Sala from "../pages/professor/Sala";
import DetalheAtividadeProfessor from "../pages/professor/DetalheAtividade";
import ExportarNotas from "../pages/professor/ExportarNotas";
import TutoriaAnos from "../pages/professor/Tutoria";
import HistoricoTutoria from "../pages/professor/HistoricoTutoria";
import DesempenhoSalas from "../pages/professor/DesempenhoSalas";
import Notificacoes from "../pages/professor/Notificacoes";
import Ajuda from "../pages/Ajuda";
import { SubAbaSala } from "../pages/professor/Sala/abas";
import { StatusContestacao } from "../lib/types";
import { ProvedorContadores } from "../lib/useContadores";
import { useTabOpcoes } from "./tabOptions";

// Telas da área do professor (menu do site em design/src/lib/menus.ts).
// Cada aba tem a sua pilha; as telas abertas de mais de uma aba (sala, notificações...)
// são registradas em cada pilha, para o "voltar" voltar para onde o professor estava
export type ProfessorStackParamsList = {
    PainelProfessor: undefined;
    ListaSalas: undefined;
    TutoriaAnos: undefined;
    HistoricoTutoria: undefined;
    DesempenhoSalas: undefined;
    // subaba: abre direto numa sub-aba (ex.: Notificações -> Contestações pendentes)
    Sala: { id_sala: number; nome?: string; subaba?: SubAbaSala; status?: StatusContestacao };
    DetalheAtividadeProfessor: { id_atividade: number };
    // Sino do Header (no site fica ao lado do avatar, fora do menu de texto)
    Notificacoes: undefined;
    // id_sala: sala já escolhida
    ExportarNotas: { id_sala?: number } | undefined;
    // Ícone "?" do Header
    Ajuda: undefined;
};

// Mesmos itens do menu do professor no site, mais "Início" (no site é a logo)
export type ProfessorTabParamsList = {
    Inicio: NavigatorScreenParams<ProfessorStackParamsList>;
    Salas: NavigatorScreenParams<ProfessorStackParamsList>;
    Tutoria: NavigatorScreenParams<ProfessorStackParamsList>;
    Desempenho: NavigatorScreenParams<ProfessorStackParamsList>;
};

// Props de uma tela do professor: navega na própria pilha e também para as outras abas
export type ProfessorScreenProps<T extends keyof ProfessorStackParamsList> = CompositeScreenProps<
    NativeStackScreenProps<ProfessorStackParamsList, T>,
    BottomTabScreenProps<ProfessorTabParamsList>
>;

const Tab = createBottomTabNavigator<ProfessorTabParamsList>();
const Stack = createNativeStackNavigator<ProfessorStackParamsList>();

// Telas abertas a partir de várias abas
function telasComuns(){
    return (
        <>
            {/* Uma tela por sala: abrir outra sala não reaproveita a tela da anterior */}
            <Stack.Screen name="Sala" component={Sala} getId={({ params }) => String(params.id_sala)} />
            <Stack.Screen name="DetalheAtividadeProfessor" component={DetalheAtividadeProfessor} />
            <Stack.Screen name="Notificacoes" component={Notificacoes} />
            <Stack.Screen name="ExportarNotas" component={ExportarNotas} />
            <Stack.Screen name="Ajuda" component={Ajuda} />
        </>
    )
}

function InicioStack(){
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="PainelProfessor" component={PainelProfessor} />
            {telasComuns()}
        </Stack.Navigator>
    )
}

function SalasStack(){
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="ListaSalas" component={ListaSalas} />
            {telasComuns()}
        </Stack.Navigator>
    )
}

function TutoriaStack(){
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="TutoriaAnos" component={TutoriaAnos} />
            <Stack.Screen name="HistoricoTutoria" component={HistoricoTutoria} />
            {telasComuns()}
        </Stack.Navigator>
    )
}

function DesempenhoStack(){
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="DesempenhoSalas" component={DesempenhoSalas} />
            {telasComuns()}
        </Stack.Navigator>
    )
}

function ProfessorRoutes() {
    const { tabScreenOptions, tabOptions } = useTabOpcoes();

    return(
        // Contador do sino do Header (pedidos + contestações pendentes)
        <ProvedorContadores area="professor">
            {/* Mesmo comportamento das áreas do aluno e do tutor: a aba que ficou para trás volta
                para a primeira tela e a barra some com o teclado aberto */}
            <Tab.Navigator screenOptions={{ ...tabScreenOptions, popToTopOnBlur: true, tabBarHideOnKeyboard: true }}>
                <Tab.Screen name="Inicio" component={InicioStack} options={tabOptions("Início", "home")} />
                <Tab.Screen name="Salas" component={SalasStack} options={tabOptions("Salas", "layers")} />
                <Tab.Screen name="Tutoria" component={TutoriaStack} options={tabOptions("Tutoria", "users")} />
                <Tab.Screen name="Desempenho" component={DesempenhoStack} options={tabOptions("Desempenho", "bar-chart-2")} />
            </Tab.Navigator>
        </ProvedorContadores>
    )
}

export default ProfessorRoutes;
