import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet } from "react-native";

import { Badge } from "../../../components/Badge";
import { Select } from "../../../components/Select";
import { Etapa, FiltroEtapa } from "../../../components/FiltroEtapa";
import { BotaoExportarNotas } from "../../../components/BotaoExportarNotas";
import { ListaSala } from "./ListaSala";
import { PropsAba } from "./tipos";

import { api } from "../../../services/api";
import { useBuscar } from "../../../lib/useBuscar";
import { formatarData, formatarNota } from "../../../lib/formatacao";
import { AlunoSala, NotaSala, TutorSala } from "../../../lib/types";
import { colors, fonts, fontSizes, radius, shadows, spacing } from "../../../styles/theme";

interface Dados {
    notas: NotaSala[];
    // Os selects são só ajuda: se a P23 ou a P24 falhar, o filtro correspondente some
    alunos: AlunoSala[] | null;
    tutores: TutorSala[] | null;
}

// Atividades > Notas (sem Figma para a tabela; site: notas/page.tsx). SÓ CONSULTA: quem lança nota é o tutor.
// P14 (GET /salas/:id/notas) na ordem da API (aluno -> etapa -> prazo), com filtros de etapa, aluno e tutor.
// A tabela do site vira um card por nota. "Exportar" usa a P15 com os mesmos filtros
export function Notas({ sala, cabecalho }: PropsAba){
    const [etapa, setEtapa] = useState<Etapa>("");
    const [aluno, setAluno] = useState("");
    const [tutor, setTutor] = useState("");

    const filtros = { etapa, id_aluno: aluno, id_tutor_sala: tutor };

    const buscar = useCallback(async (): Promise<Dados> => {
        const id = sala.id_sala;
        const params = Object.fromEntries(
            Object.entries({ etapa, id_aluno: aluno, id_tutor_sala: tutor }).filter(([, valor]) => valor !== "")
        );

        const [notas, alunos, tutores] = await Promise.all([
            api.get<NotaSala[]>(`/salas/${id}/notas`, { params }).then((r) => r.data),
            api.get<AlunoSala[]>(`/salas/${id}/alunos`).then((r) => r.data).catch(() => null),
            api.get<TutorSala[]>(`/salas/${id}/tutores`).then((r) => r.data).catch(() => null)
        ]);

        return { notas, alunos, tutores };
    }, [sala.id_sala, etapa, aluno, tutor])

    const { dados, erro, carregando, atualizando, atualizar, tentarNovamente } = useBuscar(buscar);

    const comFiltro = etapa !== "" || aluno !== "" || tutor !== "";

    function renderNota({ item }: { item: NotaSala }){
        return (
            <View style={styles.card}>
                <View style={styles.topo}>
                    <View style={styles.dados}>
                        <Text style={styles.nome}>{item.aluno.nome}</Text>
                        <Text style={styles.texto}>{item.atividade.titulo}</Text>
                    </View>

                    <View style={styles.direita}>
                        <Text style={styles.nota}>{formatarNota(item.valor)}</Text>
                        {item.contestacao_pendente && <Badge label="Contestada" variant="destaque" />}
                    </View>
                </View>

                <Text style={styles.detalhe}>
                    {item.atividade.etapa}ª etapa · {item.conteudo?.nome ?? "Sem conteúdo"} · tutor {item.tutor.nome}
                </Text>
                <Text style={styles.detalhe}>Lançada em {formatarData(item.data_lancamento)}</Text>
            </View>
        )
    }

    return (
        <ListaSala
        cabecalho={cabecalho}
        topo={
            <>
                <Text style={styles.ajuda}>Notas lançadas pelos tutores nesta sala. Aluno sem nota não aparece na lista.</Text>

                <FiltroEtapa etapa={etapa} onChange={setEtapa} />

                {dados?.alunos && (
                    <Select
                    label="Aluno"
                    options={[
                        { value: "", label: "Todos os alunos" },
                        ...dados.alunos.map((a) => ({ value: String(a.id_aluno), label: a.nome }))
                    ]}
                    value={aluno}
                    onChange={setAluno}
                    />
                )}

                {/* A P24 só traz tutores ativos: notas de tutores revogados aparecem com "Todos os tutores" */}
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

                <BotaoExportarNotas idSala={sala.id_sala} filtros={filtros} />

                {dados && !carregando && <Text style={styles.titulo}>Notas ({dados.notas.length})</Text>}
            </>
        }
        itens={dados?.notas ?? []}
        keyExtractor={(item) => String(item.id_nota)}
        renderItem={renderNota}
        carregando={carregando}
        atualizando={atualizando}
        falhou={!dados}
        erro={erro}
        onAtualizar={atualizar}
        onTentarNovamente={tentarNovamente}
        vazio={comFiltro
            ? "Nenhuma nota encontrada com esses filtros."
            : "Ainda não há notas lançadas nesta sala. As notas aparecem aqui quando os tutores corrigem as atividades."}
        />
    )
}

const styles = StyleSheet.create({
    ajuda:{
        fontFamily: fonts.regular,
        fontSize: 14,
        color: colors.gray700
    },
    titulo:{
        fontFamily: fonts.semibold,
        fontSize: fontSizes.tituloCard,
        color: colors.red700
    },
    card:{
        gap: spacing.xs,
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
    direita:{
        alignItems: "flex-end",
        gap: spacing.xs
    },
    nome:{
        fontFamily: fonts.semibold,
        fontSize: fontSizes.base,
        color: colors.black
    },
    texto:{
        fontFamily: fonts.regular,
        fontSize: 14,
        color: colors.black
    },
    nota:{
        fontFamily: fonts.bold,
        fontSize: fontSizes.destaque,
        color: colors.red700
    },
    detalhe:{
        fontFamily: fonts.regular,
        fontSize: 13,
        color: colors.gray700
    }
})
