import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";

import { Badge } from "../../../components/Badge";
import { Janela } from "../../../components/Janela";
import { GraficoEtapas } from "../../../components/GraficoEtapas";
import { AbasSegmentadas } from "../../../components/AbasSegmentadas";
import { ListaSala } from "./ListaSala";
import { PropsAba } from "./tipos";

import { api } from "../../../services/api";
import { useBuscar } from "../../../lib/useBuscar";
import { calcularMedia } from "../../../lib/media";
import { MASCOTES } from "../../../lib/mascotes";
import { formatarMedia } from "../../../lib/formatacao";
import { DesempenhoTutorSala, MediaEtapa, NotaSala } from "../../../lib/types";
import { colors, fonts, fontSizes, radius, shadows, spacing } from "../../../styles/theme";

const ETAPAS = [1, 2, 3];

type Grupo = "tutorados" | "tutores";

// Médias de um aluno, montadas a partir da P14
interface DesempenhoAlunoSala {
    id_aluno: number;
    nome: string;
    media_geral: number | null;
    quantidade: number;
    por_etapa: MediaEtapa[];
}

interface Dados {
    alunos: DesempenhoAlunoSala[];
    tutores: DesempenhoTutorSala[];
}

// Item de uma das duas listas (tutorado ou tutor)
type Item = { tipo: "aluno"; aluno: DesempenhoAlunoSala } | { tipo: "tutor"; tutor: DesempenhoTutorSala };

// Agrupa as notas da P14 por aluno e calcula as médias com a mesma regra do back-end (igual ao site).
// Aluno sem nota não aparece na P14, então também não aparece aqui
function mediasPorAluno(notas: NotaSala[]): DesempenhoAlunoSala[] {
    const porAluno = new Map<number, { nome: string; notas: NotaSala[] }>();

    for(const nota of notas){
        const atual = porAluno.get(nota.aluno.id_aluno) ?? { nome: nota.aluno.nome, notas: [] };
        atual.notas.push(nota);
        porAluno.set(nota.aluno.id_aluno, atual);
    }

    return [...porAluno.entries()].map(([id_aluno, { nome, notas: lista }]) => {
        const porEtapa = ETAPAS.map((etapa) => lista.filter((n) => n.atividade.etapa === etapa));

        return {
            id_aluno,
            nome,
            media_geral: calcularMedia(lista.map((n) => n.valor)),
            quantidade: lista.length,
            por_etapa: ETAPAS.map((etapa, i) => ({
                etapa,
                media: calcularMedia(porEtapa[i].map((n) => n.valor)),
                quantidade: porEtapa[i].length
            }))
        };
    });
}

// Aba "Desempenho" (Figma "Desempenho dos alunos" e "dos tutores"; site: desempenho/components/painelDesempenho).
// Tutores: P13 (GET /salas/:id/desempenho-tutores). Tutorados: médias montadas a partir da P14.
// Só por etapa (3 etapas): o professor não tem desempenho por conteúdo no site.
// Tocar num nome abre o gráfico por etapa (no site ele aparece embaixo das colunas)
export function Desempenho({ sala, cabecalho }: PropsAba){
    const [grupo, setGrupo] = useState<Grupo>("tutorados");
    const [selecionado, setSelecionado] = useState<Item | null>(null);

    const buscar = useCallback(async (): Promise<Dados> => {
        const [tutores, notas] = await Promise.all([
            api.get<DesempenhoTutorSala[]>(`/salas/${sala.id_sala}/desempenho-tutores`).then((r) => r.data),
            api.get<NotaSala[]>(`/salas/${sala.id_sala}/notas`).then((r) => r.data)
        ]);

        return { tutores, alunos: mediasPorAluno(notas) };
    }, [sala.id_sala])

    const { dados, erro, carregando, atualizando, atualizar, tentarNovamente } = useBuscar(buscar);

    const itens: Item[] = grupo === "tutorados"
        ? (dados?.alunos ?? []).map((aluno) => ({ tipo: "aluno", aluno }))
        : (dados?.tutores ?? []).map((tutor) => ({ tipo: "tutor", tutor }));

    function renderItem({ item }: { item: Item }){
        if(item.tipo === "aluno"){
            const { aluno } = item;

            return (
                <TouchableOpacity style={styles.item} onPress={() => setSelecionado(item)} accessibilityRole="button" accessibilityLabel={`${aluno.nome}. Ver gráfico por etapa`}>
                    <View style={styles.dados}>
                        <Text style={styles.nome}>{aluno.nome}</Text>
                        <Text style={styles.detalhe}>{aluno.quantidade} nota(s)</Text>
                    </View>
                    <Text style={styles.valor}>{formatarMedia(aluno.media_geral)}</Text>
                    <Feather name="bar-chart-2" size={20} color={colors.gray700} />
                </TouchableOpacity>
            )
        }

        const { tutor } = item;

        return (
            <TouchableOpacity style={styles.item} onPress={() => setSelecionado(item)} accessibilityRole="button" accessibilityLabel={`${tutor.nome}. Ver gráfico por etapa`}>
                <View style={styles.dados}>
                    <Text style={styles.nome}>{tutor.nome}</Text>
                    <Text style={styles.detalhe}>
                        Feedback dos alunos: {formatarMedia(tutor.feedback.media_geral, "Sem feedback")} ({tutor.feedback.quantidade})
                    </Text>
                    <Text style={styles.detalhe}>
                        Avaliação do professor: {formatarMedia(tutor.avaliacoes_professor.media_geral, "Sem avaliação")} ({tutor.avaliacoes_professor.quantidade})
                    </Text>
                    {tutor.revogado && <Badge label="Removido da sala" />}
                </View>
                <Feather name="bar-chart-2" size={20} color={colors.gray700} />
            </TouchableOpacity>
        )
    }

    return (
        <>
            <ListaSala
            cabecalho={cabecalho}
            topo={
                <>
                    <Text style={styles.ajuda}>
                        Toque num aluno ou tutor para ver o gráfico por etapa. A média dos tutorados é a média das notas lançadas.
                    </Text>

                    <AbasSegmentadas
                    opcoes={[{ valor: "tutorados", rotulo: "Tutorados" }, { valor: "tutores", rotulo: "Tutores" }]}
                    valor={grupo}
                    onChange={setGrupo}
                    />
                </>
            }
            itens={itens}
            keyExtractor={(item) => item.tipo === "aluno" ? `a${item.aluno.id_aluno}` : `t${item.tutor.id_tutor_sala}`}
            renderItem={renderItem}
            carregando={carregando}
            atualizando={atualizando}
            falhou={!dados}
            erro={erro}
            onAtualizar={atualizar}
            onTentarNovamente={tentarNovamente}
            vazio={grupo === "tutorados" ? "Ainda não há notas lançadas nesta sala." : "A sala ainda não tem tutores."}
            imagemVazio={MASCOTES.desempenho}
            />

            <Janela
            visivel={selecionado !== null}
            titulo={selecionado?.tipo === "aluno"
                ? `Média por etapa: ${selecionado.aluno.nome}`
                : `Feedback dos alunos por etapa: ${selecionado?.tipo === "tutor" ? selecionado.tutor.nome : ""}`}
            onClose={() => setSelecionado(null)}
            >
                {selecionado?.tipo === "aluno" && <GraficoEtapas etapas={selecionado.aluno.por_etapa} />}

                {selecionado?.tipo === "tutor" && (
                    <>
                        <GraficoEtapas etapas={selecionado.tutor.feedback.por_etapa} />
                        <Text style={styles.detalhe}>
                            A avaliação do professor só tem média geral: {formatarMedia(selecionado.tutor.avaliacoes_professor.media_geral, "Sem avaliação")}.
                        </Text>
                    </>
                )}
            </Janela>
        </>
    )
}

const styles = StyleSheet.create({
    ajuda:{
        fontFamily: fonts.regular,
        fontSize: 14,
        color: colors.gray700
    },
    item:{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: colors.gray300,
        borderRadius: radius.cardSm,
        backgroundColor: colors.white,
        ...shadows.cardLeve
    },
    dados:{
        flex: 1,
        gap: 2
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
    valor:{
        fontFamily: fonts.bold,
        fontSize: fontSizes.destaque,
        color: colors.red700
    }
})
