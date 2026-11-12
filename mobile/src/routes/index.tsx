import React, { useContext } from "react";

import { View, StyleSheet } from "react-native";

import AuthRoutes from "./auth.routes";
import ProfessorRoutes from "./professor.routes";
import AlunoRoutes from "./aluno.routes";
import TutorRoutes from "./tutor.routes";

import { AuthContext } from "../contexts/AuthContext";
import { Loader } from "../components/Loader";
import { colors } from "../styles/theme";

function Routes() {
    const { isAuthenticated, loading, user, area } = useContext(AuthContext);

    // Enquanto lê o AsyncStorage (e confere se o aluno é tutor): fundo vermelho com o anel branco
    if(loading){
        return(
            <View style={styles.loading}>
                <Loader size="grande" variant="branco" />
            </View>
        )
    }

    if(!isAuthenticated) return <AuthRoutes/>;

    if(user.perfil === "professor") return <ProfessorRoutes/>;

    // Aluno: abas do tutor só quando ele é tutor e escolheu essa área
    return area === "tutor" ? <TutorRoutes/> : <AlunoRoutes/>;
}

const styles = StyleSheet.create({
    loading:{
        flex: 1,
        backgroundColor: colors.red700,
        justifyContent: "center",
        alignItems: "center"
    }
})

export default Routes
