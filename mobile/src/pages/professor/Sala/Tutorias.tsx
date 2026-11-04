import React, { useCallback, useContext, useState } from "react";
import { View, Text, StyleSheet, Alert } from "react-native";

import { Badge } from "../../../components/Badge";
import { Button } from "../../../components/Button";
import { Janela } from "../../../components/Janela";
import { TextArea } from "../../../components/TextArea";
import { AbasSegmentadas } from "../../../components/AbasSegmentadas";
import { ToastContext } from "../../../contexts/ToastContext";
import { ListaSala } from "./ListaSala";
import { ModalNovaTutoria } from "./ModalNovaTutoria";
import { PropsAba } from "./tipos";

import { api } from "../../../services/api";
import { useAcao } from "../../../lib/useAcao";
import { useBuscar } from "../../../lib/useBuscar";
import { formatarData } from "../../../lib/formatacao";
import { AlunoSala, StatusTutoria, TutorSala, TutoriaSala } from "../../../lib/types";
import { colors, fonts, fontSizes, radius, shadows, spacing } from "../../../styles/theme";

// "" = todas; "ativa" ou "finalizada" (os valores que a P4 aceita)
type Filtro = "" | StatusTutoria;

interface Dados {
    tutorias: TutoriaSala[];
    // Opções do modal "Nova tutoria"
    tutores: TutorSala[];
    alunos: AlunoSala[];
}

// Tutoria > Tutorias (Figma "Metas, objetivos e critérios"; site: tutorias/components/listaTutorias).
// Objetivos e critérios não existem na API: só a meta de aprendizagem de cada tutoria.
// P4 com o filtro de situação; Nova tutoria (P30), Editar meta (P5), Finalizar (P6) e Reabrir (P7)
export function Tutorias({ sala, cabecalho }: PropsAba){
    const { showToast } = useContext(ToastContext);
    const { executando, executar } = useAcao();

    const [filtro, setFiltro] = useState<Filtro>("");
    const [novaAberta, setNovaAberta] = useState(false);
    const [editarMeta, setEditarMeta] = useState<TutoriaSala | null>(null);
    const [meta, setMeta] = useState("");

    // Reabrir só funciona no ano letivo atual (regra da P7)
    const anoAtualDaSala = sala.ano_letivo === new Date().getFullYear();

    const buscar = useCallback(async (): Promise<Dados> => {
        const id = sala.id_sala;

        const [tutorias, tutores, alunos] = await Promise.all([
            api.get<TutoriaSala[]>(`/salas/${id}/tutorias`, { params: filtro ? { status: filtro } : undefined }).then((r) => r.data),
            api.get<TutorSala[]>(`/salas/${id}/tutores`).then((r) => r.data),
            api.get<AlunoSala[]>(`/salas/${id}/alunos`).then((r) => r.data)
        ]);

        return { tutorias, tutores, alunos };
    }, [sala.id_sala, filtro])

    const { dados, erro, carregando, atualizando, atualizar, tentarNovamente } = useBuscar(buscar);

    function abrirMeta(tutoria: TutoriaSala){
        setMeta(tutoria.meta_aprendizagem ?? "");
        setEditarMeta(tutoria);
    }

    async function salvarMeta(){
        if(!editarMeta) return;
        if(meta.trim() === "") return showToast("erro", "O campo meta_aprendizagem é obrigatório");

        const ok = await executar(
            () => api.patch(`/tutorias/${editarMeta.id_tutoria}/meta`, { meta_aprendizagem: meta.trim() }),
            "Meta de aprendizagem atualizada!",
            atualizar
        );

        if(ok) setEditarMeta(null);
    }

    // Mesmos textos do ConfirmDialog do site
    function confirmarFinalizar(tutoria: TutoriaSala){
        Alert.alert(
            "Finalizar tutoria",
            `Finalizar a tutoria de ${tutoria.tutor.nome} com ${tutoria.aluno.nome}? Depois de finalizada, ela não aceita novas atividades, notas nem mensagens. Se houver contestação de nota pendente, a finalização é bloqueada.`,
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Finalizar",
                    style: "destructive",
                    onPress: () => executar(() => api.patch(`/tutorias/${tutoria.id_tutoria}/finalizar`), "Tutoria finalizada.", atualizar)
                }
            ]
        );
    }

    function confirmarReabrir(tutoria: TutoriaSala){
        Alert.alert(
            "Reabrir tutoria",
            `Reabrir a tutoria de ${tutoria.tutor.nome} com ${tutoria.aluno.nome}? Ela volta a ficar ativa.`,
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Reabrir",
                    onPress: () => executar(() => api.patch(`/tutorias/${tutoria.id_tutoria}/reabrir`), "Tutoria reaberta.", atualizar)
                }
            ]
        );
    }

    function renderTutoria({ item }: { item: TutoriaSala }){
        const ativa = item.status === "ativa";

        return (
            <View style={styles.card}>
                <View style={styles.topo}>
                    <Text style={styles.nome}>{item.tutor.nome} → {item.aluno.nome}</Text>
                    <Badge label={ativa ? "Ativa" : "Finalizada"} variant={ativa ? "sucesso" : "neutro"} />
                </View>

                <Text style={styles.detalhe}>
                    Tutor → tutorado · início {formatarData(item.data_inicio)}
                    {item.data_fim && ` · fim ${formatarData(item.data_fim)}`}
                </Text>

                <Text style={styles.texto}>
                    <Text style={styles.rotulo}>Meta: </Text>{item.meta_aprendizagem || "Sem meta definida"}
                </Text>

                {ativa ? (
                    <View style={styles.acoes}>
                        <Button title="Editar meta" variant="secundario" style={styles.botao} onPress={() => abrirMeta(item)} />
                        <Button title="Finalizar" style={styles.botao} disabled={executando} onPress={() => confirmarFinalizar(item)} />
                    </View>
                ) : (
                    <>
                        <Button
                        title="Reabrir"
                        variant="secundario"
                        disabled={!anoAtualDaSala || executando}
                        onPress={() => confirmarReabrir(item)}
                        />
                        {!anoAtualDaSala && (
                            <Text style={styles.detalhe}>Não dá para reabrir: a sala é do ano letivo {sala.ano_letivo}.</Text>
                        )}
                    </>
                )}
            </View>
        )
    }

    const vazio = filtro === ""
        ? `A sala ainda não tem tutorias. Toque em "Nova tutoria" para ligar um tutor a um aluno.`
        : `Nenhuma tutoria ${filtro === "ativa" ? "ativa" : "finalizada"} nesta sala.`;

    return (
        <>
            <ListaSala
            cabecalho={cabecalho}
            topo={
                <>
                    <AbasSegmentadas
                    opcoes={[
                        { valor: "", rotulo: "Todas" },
                        { valor: "ativa", rotulo: "Ativas" },
                        { valor: "finalizada", rotulo: "Finalizadas" }
                    ]}
                    valor={filtro}
                    onChange={setFiltro}
                    />

                    <Button title="+ Nova tutoria" onPress={() => setNovaAberta(true)} />

                    {dados && !carregando && <Text style={styles.titulo}>Tutorias ({dados.tutorias.length})</Text>}
                </>
            }
            itens={dados?.tutorias ?? []}
            keyExtractor={(item) => String(item.id_tutoria)}
            renderItem={renderTutoria}
            carregando={carregando}
            atualizando={atualizando}
            falhou={!dados}
            erro={erro}
            onAtualizar={atualizar}
            onTentarNovamente={tentarNovamente}
            vazio={vazio}
            />

            <ModalNovaTutoria
            visivel={novaAberta}
            tutores={dados?.tutores ?? []}
            alunos={dados?.alunos ?? []}
            onClose={() => setNovaAberta(false)}
            onCriada={atualizar}
            />

            <Janela visivel={editarMeta !== null} titulo="Editar meta de aprendizagem" onClose={() => { if(!executando) setEditarMeta(null); }}>
                {editarMeta && <Text style={styles.detalhe}>{editarMeta.tutor.nome} → {editarMeta.aluno.nome}</Text>}

                <TextArea label="Meta de aprendizagem" value={meta} onChangeText={setMeta} editable={!executando} />

                <Button title="Salvar meta" titleLoading="Salvando..." loading={executando} onPress={salvarMeta} />
                <Button title="Cancelar" variant="secundario" disabled={executando} onPress={() => setEditarMeta(null)} />
            </Janela>
        </>
    )
}

const styles = StyleSheet.create({
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
        gap: spacing.sm
    },
    nome:{
        flex: 1,
        fontFamily: fonts.semibold,
        fontSize: fontSizes.base,
        color: colors.black
    },
    detalhe:{
        fontFamily: fonts.regular,
        fontSize: 13,
        color: colors.gray700
    },
    texto:{
        fontFamily: fonts.regular,
        fontSize: 14,
        color: colors.black
    },
    rotulo:{
        fontFamily: fonts.semibold
    },
    acoes:{
        flexDirection: "row",
        gap: spacing.md,
        marginTop: spacing.xs
    },
    // Dois botões lado a lado: divide a linha em vez dos 100% do Button
    botao:{
        flex: 1,
        width: "auto"
    }
})
