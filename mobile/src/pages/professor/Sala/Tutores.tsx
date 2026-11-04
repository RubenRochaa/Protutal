import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, Alert } from "react-native";

import { Avatar } from "../../../components/Avatar";
import { Badge } from "../../../components/Badge";
import { Button } from "../../../components/Button";
import { ListaSala } from "./ListaSala";
import { ModalAvaliacao } from "./ModalAvaliacao";
import { PropsAba } from "./tipos";

import { api } from "../../../services/api";
import { useAcao } from "../../../lib/useAcao";
import { useBuscar } from "../../../lib/useBuscar";
import { formatarData } from "../../../lib/formatacao";
import { TutorSala } from "../../../lib/types";
import { colors, fonts, fontSizes, radius, shadows, spacing } from "../../../styles/theme";

// Tutoria > Tutores (Figma "Revogação Tutor" e "Avaliação Tutor"; site: tutores/components/listaTutores):
// tutores ativos (P24), "Avaliar" (P9/P10) e "Remover" (P8).
// O Figma escolhe um "novo tutor" ao revogar: no site e na API não existe, o tutor só é removido
export function Tutores({ sala, cabecalho, atualizarSala }: PropsAba){
    const { executando, executar } = useAcao();
    const [avaliar, setAvaliar] = useState<TutorSala | null>(null);

    const buscar = useCallback(async () => (await api.get<TutorSala[]>(`/salas/${sala.id_sala}/tutores`)).data, [sala.id_sala])
    const { dados, erro, carregando, atualizando, atualizar, tentarNovamente } = useBuscar(buscar);

    // Mesmo texto do ConfirmDialog do site
    function confirmarRemocao(tutor: TutorSala){
        Alert.alert(
            "Remover tutor da sala",
            `Remover ${tutor.aluno.nome} da tutoria desta sala? As tutorias ativas dele serão finalizadas. O histórico deste tutor não passa para um novo tutor.`,
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Remover tutor",
                    style: "destructive",
                    onPress: () => executar(
                        () => api.patch(`/tutores-sala/${tutor.id_tutor_sala}/revogar`),
                        "Tutor removido da sala.",
                        // A moldura também busca de novo: o interruptor de permissão depende dos tutores
                        () => { atualizar(); atualizarSala(); }
                    )
                }
            ]
        );
    }

    return (
        <>
            <ListaSala
            cabecalho={cabecalho}
            topo={
                <>
                    {dados && <Text style={styles.titulo}>Tutores ({dados.length})</Text>}
                    <Text style={styles.ajuda}>A permissão de criar atividades fica no topo da sala e vale para todos os tutores.</Text>
                </>
            }
            itens={dados ?? []}
            keyExtractor={(item) => String(item.id_tutor_sala)}
            renderItem={({ item }) => (
                <View style={styles.item}>
                    <View style={styles.linha}>
                        <Avatar nome={item.aluno.nome} />
                        <View style={styles.dados}>
                            <Text style={styles.nome}>{item.aluno.nome}</Text>
                            <Text style={styles.detalhe}>{item.aluno.email} · tutor desde {formatarData(item.data_definicao)}</Text>
                            <Badge
                            label={item.pode_criar_ativ ? "Pode criar atividades" : "Não cria atividades"}
                            variant={item.pode_criar_ativ ? "sucesso" : "neutro"}
                            />
                        </View>
                    </View>

                    <View style={styles.acoes}>
                        <Button title="Avaliar" variant="secundario" style={styles.botao} onPress={() => setAvaliar(item)} />
                        <Button title="Remover" style={styles.botao} disabled={executando} onPress={() => confirmarRemocao(item)} />
                    </View>
                </View>
            )}
            carregando={carregando}
            atualizando={atualizando}
            falhou={!dados}
            erro={erro}
            onAtualizar={atualizar}
            onTentarNovamente={tentarNovamente}
            vazio={`A sala ainda não tem tutores. Os tutores entram quando você aceita um pedido na aba "Pedidos".`}
            />

            <ModalAvaliacao tutor={avaliar} onClose={() => setAvaliar(null)} />
        </>
    )
}

const styles = StyleSheet.create({
    titulo:{
        fontFamily: fonts.semibold,
        fontSize: fontSizes.tituloCard,
        color: colors.red700
    },
    ajuda:{
        fontFamily: fonts.regular,
        fontSize: 13,
        color: colors.gray700
    },
    item:{
        gap: spacing.md,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: colors.gray300,
        borderRadius: radius.cardSm,
        backgroundColor: colors.white,
        ...shadows.cardLeve
    },
    linha:{
        flexDirection: "row",
        alignItems: "flex-start",
        gap: spacing.md
    },
    dados:{
        flex: 1,
        gap: spacing.xs
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
    acoes:{
        flexDirection: "row",
        gap: spacing.md
    },
    // Dois botões lado a lado: divide a linha em vez dos 100% do Button
    botao:{
        flex: 1,
        width: "auto"
    }
})
