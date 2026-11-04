import React from "react";
import { View, Text, StyleSheet, Alert } from "react-native";

import { Janela } from "../Janela";
import { Avatar } from "../Avatar";
import { Button } from "../Button";

import { api } from "../../services/api";
import { useAcao } from "../../lib/useAcao";
import { formatarData } from "../../lib/formatacao";
import { PedidoTutoria } from "../../lib/types";
import { colors, fonts, fontSizes, radius, shadows, spacing } from "../../styles/theme";

// Pedidos pendentes para ser tutor (site: professor/components/listaPedidos), usados na aba
// Tutoria > Pedidos da sala e nas Notificações. A lista fica na FlatList de cada tela;
// aqui ficam o item e a janela de decisão

interface ItemPedidoProps {
    pedido: PedidoTutoria;
    // Nas Notificações aparecem pedidos de várias salas: mostra o nome da sala
    mostrarSala?: boolean;
    onVer: () => void;
}

export function ItemPedido({ pedido, mostrarSala = false, onVer }: ItemPedidoProps){
    return (
        <View style={styles.item}>
            <View style={styles.linha}>
                <Avatar nome={pedido.aluno.nome} />
                <View style={styles.dados}>
                    <Text style={styles.nome}>{pedido.aluno.nome} quer ser tutor</Text>
                    <Text style={styles.detalhe}>
                        {mostrarSala && `${pedido.sala_pedido.nome} · `}Pedido em {formatarData(pedido.data_solicitacao)}
                    </Text>
                </View>
            </View>

            <Button title="Ver pedido" variant="secundario" onPress={onVer} />
        </View>
    )
}

interface ModalPedidoProps {
    // null = janela fechada
    pedido: PedidoTutoria | null;
    onClose: () => void;
    // Depois de aceitar ou recusar: a tela busca a lista de novo e o pedido sai dos pendentes
    onDecidido: () => void;
}

// "Pedido para se tornar tutor de: (nome)" com Aceitar (P27) e Recusar (P28).
// Aceitar cria o tutor na sala (sem confirmação, como no site); recusar pede confirmação
export function ModalPedido({ pedido, onClose, onDecidido }: ModalPedidoProps){
    const { executando, executar } = useAcao();

    async function aceitar(){
        if(!pedido) return;

        const ok = await executar(
            () => api.patch(`/pedidos-tutoria/${pedido.id_pedido}/aceitar`, { id_sala: pedido.sala_pedido.id_sala }),
            "Pedido aceito: o aluno agora é tutor da sala.",
            onDecidido
        );

        if(ok) onClose();
    }

    function confirmarRecusa(){
        if(!pedido) return;

        Alert.alert(
            "Recusar pedido",
            `Recusar o pedido de ${pedido.aluno.nome} para ser tutor? O pedido sai da lista e não pode ser aceito depois.`,
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Recusar pedido",
                    style: "destructive",
                    onPress: async () => {
                        const ok = await executar(
                            () => api.patch(`/pedidos-tutoria/${pedido.id_pedido}/recusar`),
                            "Pedido recusado.",
                            onDecidido
                        );

                        if(ok) onClose();
                    }
                }
            ]
        );
    }

    return (
        <Janela
        visivel={pedido !== null}
        titulo={`Pedido para se tornar tutor de: ${pedido?.aluno.nome ?? ""}`}
        onClose={() => { if(!executando) onClose(); }}
        >
            {pedido && (
                <>
                    <View style={styles.dado}>
                        <Text style={styles.rotulo}>Sala do pedido</Text>
                        <Text style={styles.valor}>{pedido.sala_pedido.nome}</Text>
                    </View>

                    <View style={styles.dado}>
                        <Text style={styles.rotulo}>Data do pedido</Text>
                        <Text style={styles.valor}>{formatarData(pedido.data_solicitacao)}</Text>
                    </View>

                    <View style={styles.dado}>
                        <Text style={styles.rotulo}>Salas suas em que o aluno está matriculado</Text>
                        <Text style={styles.valor}>{pedido.salas_matriculado.map((s) => s.nome).join(", ") || "Nenhuma"}</Text>
                    </View>

                    <Text style={styles.detalhe}>
                        Ao aceitar, o aluno vira tutor desta sala, ainda sem permissão para criar atividades.
                    </Text>

                    <Button title="Aceitar" titleLoading="Enviando..." loading={executando} onPress={aceitar} />
                    <Button title="Recusar" variant="secundario" disabled={executando} onPress={confirmarRecusa} />
                </>
            )}
        </Janela>
    )
}

const styles = StyleSheet.create({
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
        alignItems: "center",
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
    dado:{
        gap: 2
    },
    rotulo:{
        fontFamily: fonts.medium,
        fontSize: fontSizes.rotulo,
        color: colors.gray700
    },
    valor:{
        fontFamily: fonts.regular,
        fontSize: 15,
        color: colors.black
    }
})
