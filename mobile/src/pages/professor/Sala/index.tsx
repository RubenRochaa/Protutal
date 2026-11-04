import React, { ComponentType, useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";

import { Header } from "../../../components/Header";
import { Button } from "../../../components/Button";
import { Loader } from "../../../components/Loader";
import { EmptyState } from "../../../components/EmptyState";
import { ErrorState } from "../../../components/ErrorState";
import { AbasSegmentadas } from "../../../components/AbasSegmentadas";
import { PermissaoAtividades } from "./PermissaoAtividades";
import { VisaoGeral } from "./VisaoGeral";
import { Alunos } from "./Alunos";
import { Conteudos } from "./Conteudos";
import { Avisos } from "./Avisos";
import { Pedidos } from "./Pedidos";
import { Tutores } from "./Tutores";
import { Tutorias } from "./Tutorias";
import { Feedbacks } from "./Feedbacks";
import { Atividades } from "./Atividades";
import { Materiais } from "./Materiais";
import { Contestacoes } from "./Contestacoes";
import { Notas } from "./Notas";
import { Desempenho } from "./Desempenho";
import { GRUPOS_ABAS_SALA, SubAbaSala, grupoDa } from "./abas";
import { PropsAba } from "./tipos";

import { api } from "../../../services/api";
import { useBuscar } from "../../../lib/useBuscar";
import { getErrorMessage, getErrorStatus } from "../../../lib/getErrorMessage";
import { MASCOTES } from "../../../lib/mascotes";
import { SalaDetalhe, StatusContestacao, TutorSala } from "../../../lib/types";
import { ProfessorScreenProps } from "../../../routes/professor.routes";
import { colors, fonts, fontSizes, spacing } from "../../../styles/theme";

// Respostas da P1 que significam "esta sala não pode ser aberta":
// 400 (id inválido), 403 (sala de outro professor) e 404 (sala não existe)
const SALA_INDISPONIVEL = [400, 403, 404];

// Componente de cada sub-aba
const SUBABAS: Record<SubAbaSala, ComponentType<PropsAba>> = {
    visao_geral: VisaoGeral,
    alunos: Alunos,
    conteudos: Conteudos,
    avisos: Avisos,
    pedidos: Pedidos,
    tutores: Tutores,
    tutorias: Tutorias,
    feedbacks: Feedbacks,
    atividades: Atividades,
    materiais: Materiais,
    notas: Notas,
    contestacoes: Contestacoes,
    desempenho: Desempenho,
}

interface Dados {
    sala: SalaDetalhe;
    // null = a P24 falhou: o interruptor não aparece (a sub-aba mostra o erro dela)
    tutores: TutorSala[] | null;
}

// Tela da sala (site: professor/salas/[id_sala]/layout.tsx): série e ano, o interruptor de
// permissão de criar atividades e as 5 abas com as sub-abas do site. O topo vai no começo da
// lista de cada sub-aba e rola junto, para sobrar espaço na tela do celular
export default function Sala({ navigation, route }: ProfessorScreenProps<"Sala">){
    const { id_sala, nome } = route.params;

    const [subaba, setSubaba] = useState<SubAbaSala>(route.params.subaba ?? "visao_geral");
    // Filtro inicial da aba Contestações (vindo das Notificações); some quando o professor troca de aba
    const [status, setStatus] = useState<StatusContestacao | undefined>(route.params.status);

    // Abriu de novo com outra sub-aba (ex.: Notificações -> Contestações desta mesma sala)
    useEffect(() => {
        if(route.params.subaba){
            setSubaba(route.params.subaba);
            setStatus(route.params.status);
        }
    }, [route.params.subaba, route.params.status])

    const buscar = useCallback(async (): Promise<Dados> => {
        const [sala, tutores] = await Promise.all([
            api.get<SalaDetalhe>(`/salas/${id_sala}`).then((r) => r.data),
            api.get<TutorSala[]>(`/salas/${id_sala}/tutores`).then((r) => r.data).catch(() => null)
        ]);

        return { sala, tutores };
    }, [id_sala])

    const { dados, erro, carregando, atualizar, tentarNovamente } = useBuscar(buscar);

    function irPara(nova: SubAbaSala){
        setStatus(undefined);
        setSubaba(nova);
    }

    const titulo = dados ? `Detalhes ${dados.sala.nome}` : nome ? `Detalhes ${nome}` : "Detalhes da sala";
    const header = (
        <Header title={titulo} onBack={navigation.goBack} onNotificacoes={() => navigation.navigate("Notificacoes")} />
    );

    if(carregando){
        return (
            <View style={styles.container}>
                {header}
                <Loader />
            </View>
        )
    }

    if(!dados){
        const codigo = getErrorStatus(erro);
        const indisponivel = codigo !== null && SALA_INDISPONIVEL.includes(codigo);

        return (
            <View style={styles.container}>
                {header}

                <ScrollView contentContainerStyle={styles.conteudo}>
                    {!indisponivel && <ErrorState message={getErrorMessage(erro)} onRetry={tentarNovamente} />}

                    {/* 403 = sala de outro professor: mesmo texto e caminho de volta do site */}
                    {codigo === 403 && (
                        <>
                            <EmptyState image={MASCOTES.badRequest} title="Você não tem permissão para ver esta página." />
                            <Button title="Voltar ao início" onPress={() => navigation.navigate("Inicio", { screen: "PainelProfessor" })} />
                        </>
                    )}

                    {indisponivel && codigo !== 403 && (
                        <>
                            <EmptyState image={MASCOTES.badRequest} title={getErrorMessage(erro)} />
                            <Button title="Voltar para Minhas salas" onPress={() => navigation.navigate("Salas", { screen: "ListaSalas" })} />
                        </>
                    )}
                </ScrollView>
            </View>
        )
    }

    const { sala, tutores } = dados;
    const grupo = grupoDa(subaba);
    const Aba = SUBABAS[subaba];

    const cabecalho = (
        <View style={styles.cabecalho}>
            <Text style={styles.info}>{sala.serie}ª série · {sala.ano_letivo}</Text>

            {tutores && <PermissaoAtividades idSala={sala.id_sala} tutores={tutores} onAlterada={atualizar} />}

            <AbasSegmentadas
            rolavel
            opcoes={GRUPOS_ABAS_SALA.map((item) => ({ valor: item.valor, rotulo: item.rotulo }))}
            valor={grupo.valor}
            onChange={(valor) => irPara(GRUPOS_ABAS_SALA.find((item) => item.valor === valor)!.subabas[0].valor)}
            />

            {/* Sub-abas só quando o grupo tem mais de uma, como no site */}
            {grupo.subabas.length > 1 && (
                <AbasSegmentadas rolavel opcoes={grupo.subabas} valor={subaba} onChange={irPara} />
            )}
        </View>
    );

    return (
        <View style={styles.container}>
            {header}

            <Aba
            key={subaba}
            sala={sala}
            tutores={tutores ?? []}
            cabecalho={cabecalho}
            atualizarSala={atualizar}
            irPara={irPara}
            status={status}
            navigation={navigation}
            />
        </View>
    )
}

const styles = StyleSheet.create({
    container:{
        flex: 1,
        backgroundColor: colors.white
    },
    conteudo:{
        flexGrow: 1,
        gap: spacing.md,
        padding: spacing.lg
    },
    cabecalho:{
        gap: spacing.md
    },
    info:{
        fontFamily: fonts.semibold,
        fontSize: fontSizes.tituloCard,
        color: colors.red700
    }
})
