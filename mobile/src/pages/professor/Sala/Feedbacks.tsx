import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Linking } from "react-native";
import { Feather } from "@expo/vector-icons";

import { Badge } from "../../../components/Badge";
import { Select } from "../../../components/Select";
import { Etapa, FiltroEtapa } from "../../../components/FiltroEtapa";
import { ListaSala } from "./ListaSala";
import { PropsAba } from "./tipos";

import { api } from "../../../services/api";
import { useBuscar } from "../../../lib/useBuscar";
import { formatarData, formatarMedia, formatarNota } from "../../../lib/formatacao";
import { FeedbacksTutor, TutorSala } from "../../../lib/types";
import { colors, fonts, fontSizes, radius, shadows, spacing } from "../../../styles/theme";

type Feedback = FeedbacksTutor["feedbacks"][number];

interface Dados {
    feedbacks: FeedbacksTutor;
    // null = a P24 falhou: o filtro de tutor não aparece
    tutores: TutorSala[] | null;
}

// Tutoria > Feedbacks (sem Figma; site: feedbacks/page.tsx): o que os alunos tutorados escreveram
// sobre os tutores (T7 - GET /feedbacks?id_sala=&etapa=&id_tutor_sala=), com a rubrica.
// O filtro de ano não entra: todos os feedbacks de uma sala são do mesmo ano letivo
export function Feedbacks({ sala, cabecalho }: PropsAba){
    const [etapa, setEtapa] = useState<Etapa>("");
    const [tutor, setTutor] = useState("");

    const buscar = useCallback(async (): Promise<Dados> => {
        const params: Record<string, string | number> = { id_sala: sala.id_sala };
        if(etapa) params.etapa = etapa;
        if(tutor) params.id_tutor_sala = tutor;

        const [feedbacks, tutores] = await Promise.all([
            api.get<FeedbacksTutor>("/feedbacks", { params }).then((r) => r.data),
            api.get<TutorSala[]>(`/salas/${sala.id_sala}/tutores`).then((r) => r.data).catch(() => null)
        ]);

        return { feedbacks, tutores };
    }, [sala.id_sala, etapa, tutor])

    const { dados, erro, carregando, atualizando, atualizar, tentarNovamente } = useBuscar(buscar);

    function renderFeedback({ item }: { item: Feedback }){
        return (
            <View style={styles.card}>
                <View style={styles.topo}>
                    <View style={styles.dados}>
                        <Text style={styles.nome}>Tutor {item.tutor.nome}</Text>
                        <Text style={styles.detalhe}>por {item.aluno.nome} · {formatarData(item.data)}</Text>
                    </View>
                    <Text style={styles.nota}>{formatarNota(item.nota)}</Text>
                </View>

                {item.comentario && <Text style={styles.texto}>{item.comentario}</Text>}

                <View style={styles.rodape}>
                    <Badge label={`${item.etapa}ª etapa`} />

                    {item.rubrica_file && (
                        <TouchableOpacity
                        style={styles.link}
                        onPress={() => Linking.openURL(item.rubrica_file!)}
                        accessibilityRole="link"
                        hitSlop={8}
                        >
                            <Feather name="download" size={14} color={colors.red700} />
                            <Text style={styles.textoLink}>Baixar rubrica</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        )
    }

    const resumo = dados?.feedbacks.resumo;

    return (
        <ListaSala
        cabecalho={cabecalho}
        topo={
            <>
                <Text style={styles.ajuda}>Avaliações que os alunos tutorados fizeram dos tutores, com a rubrica enviada.</Text>

                <FiltroEtapa etapa={etapa} onChange={setEtapa} />

                {dados?.tutores && (
                    <Select
                    label="Tutor"
                    options={[
                        { value: "", label: "Todos os tutores" },
                        ...dados.tutores.map((t) => ({ value: String(t.id_tutor_sala), label: t.aluno.nome }))
                    ]}
                    value={tutor}
                    onChange={setTutor}
                    />
                )}

                {resumo && !carregando && (
                    <>
                        <View style={styles.resumo}>
                            <Text style={styles.texto}>Total: <Text style={styles.forte}>{resumo.total_feedbacks}</Text></Text>
                            <Text style={styles.texto}>
                                Média das notas: <Text style={styles.forte}>{formatarMedia(resumo.media_notas, "Sem feedback")}</Text>
                            </Text>
                        </View>

                        <Text style={styles.titulo}>Feedbacks ({dados.feedbacks.feedbacks.length})</Text>
                    </>
                )}
            </>
        }
        itens={dados?.feedbacks.feedbacks ?? []}
        keyExtractor={(item) => String(item.id_feedback)}
        renderItem={renderFeedback}
        carregando={carregando}
        atualizando={atualizando}
        falhou={!dados}
        erro={erro}
        onAtualizar={atualizar}
        onTentarNovamente={tentarNovamente}
        vazio={etapa || tutor
            ? "Nenhum feedback com esses filtros."
            : "Os alunos ainda não enviaram feedback sobre os tutores desta sala."}
        />
    )
}

const styles = StyleSheet.create({
    ajuda:{
        fontFamily: fonts.regular,
        fontSize: 14,
        color: colors.gray700
    },
    resumo:{
        flexDirection: "row",
        flexWrap: "wrap",
        gap: spacing.lg,
        padding: spacing.md,
        borderRadius: radius.cardSm,
        backgroundColor: colors.gray100
    },
    forte:{
        fontFamily: fonts.semibold
    },
    titulo:{
        fontFamily: fonts.semibold,
        fontSize: fontSizes.tituloCard,
        color: colors.red700
    },
    card:{
        gap: spacing.sm,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: colors.gray300,
        borderRadius: radius.cardSm,
        backgroundColor: colors.white,
        ...shadows.cardLeve
    },
    topo:{
        flexDirection: "row",
        alignItems: "flex-start",
        gap: spacing.md
    },
    dados:{
        flex: 1
    },
    nome:{
        fontFamily: fonts.semibold,
        fontSize: fontSizes.base,
        color: colors.black
    },
    detalhe:{
        fontFamily: fonts.regular,
        fontSize: 13,
        color: colors.gray700
    },
    nota:{
        fontFamily: fonts.bold,
        fontSize: fontSizes.destaque,
        color: colors.red700
    },
    texto:{
        fontFamily: fonts.regular,
        fontSize: 14,
        color: colors.black
    },
    rodape:{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: spacing.md
    },
    link:{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.xs
    },
    textoLink:{
        fontFamily: fonts.medium,
        fontSize: 13,
        color: colors.red700
    }
})
