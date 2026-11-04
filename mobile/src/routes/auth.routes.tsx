import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import SignIn from "../pages/SignIn";
import SignUp from "../pages/SignUp";
import ForgotPassword from "../pages/ForgotPassword";

export type AuthStackParamsList = {
    // cadastroConcluido: o cadastro volta para o login para mostrar o aviso de confirmação
    SignIn: {
        cadastroConcluido?: boolean;
        email?: string;
    } | undefined;
    SignUp: undefined;
    ForgotPassword: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamsList>();

function AuthRoutes() {
    return(
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="SignIn" component={SignIn}/>
            <Stack.Screen name="SignUp" component={SignUp}/>
            <Stack.Screen name="ForgotPassword" component={ForgotPassword}/>
        </Stack.Navigator>
    )
}

export default AuthRoutes
