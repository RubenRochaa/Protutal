import React, { useCallback } from "react";
import { Text, StyleSheet, TouchableOpacity } from "react-native";

import { ListaSala } from "./ListaSala";
import { PropsAba } from "./tipos";
import { SubAbaSala } from "./abas";

import { api } from "../../../services/api";
import { useBuscar } from "../../../lib/useBuscar";
import { AlunoSala, AtividadeSala, ContestacaoTutor, PedidoTutoria, TutorSala, TutoriaSala } from "../../../lib/types";
import { colors, fonts, fontSizes, radius, shadows, spacing } from "../../../styles/theme";

const SETE_DIAS_MS = 7 * 24 * 60 * 60 * 1000;

interface Indicador {
    rotulo: string;
    subaba: SubAbaSala;
    // null = a rota daquele indicador falhou: só ele mostra "—"
    valor: number | null;
    // Pedidos e contestações: o número fica vermelho quando há algo esperando o professor
    pedeAcao?: boolean;
}

// Busca a lista e devolve só a quantidade (null se a rota falhar)
function contar<T>(promessa: Promise<{ data: T[] }>, filtro?: (item: T) => boolean): Promise<number | null> {
    return promessa
        .then((r) => (filtro ? r.data.filter(filtro) : r.data).length)
        .catch(() => null);
}

// Aba "Visão geral" (site: components/resumoSala): 6 indicadores, cada um abre a sub-aba
// com a lista completa. Cada indicador busca a sua rota: se uma falhar, os outros continuam
export function VisaoGeral({ sala, cabecalho, irPara }: PropsAba){
    const id = sala.id_sala;

    const buscar = useCallback(async (): Promise<Indicador[]> => {
        const agora = Date.now();

        const [alunos, tutores, tutorias, pedidos, contestacoes, atividades] = await Promise.all([
            contar(api.get<AlunoSala[]>(`/salas/${id}/alunos`)),
            contar(api.get<TutorSala[]>(`/salas/${id}/tutores`)),
            contar(api.get<TutoriaSala[]>(`/salas/${id}/tutorias`, { params: { status: "ativa" } })),
            // A P26 devolve os pedidos de TODAS as salas do professor: fica só esta
            contar(api.get<PedidoTutoria[]>("/pedidos-tutoria"), (pedido) => pedido.sala_pedido.id_sala === id),
            contar(api.get<ContestacaoTutor[]>("/contestacoes", { params: { id_sala: id, status: "pendente" } })),
            // Prazo entre agora e daqui a 7 dias (a P11 não filtra por data)
            contar(api.get<AtividadeSala[]>(`/salas/${id}/atividades`), (atividade) => {
                const prazo = new Date(atividade.data_entrega).getTime();
                return prazo >= agora && prazo <= agora + SETE_DIAS_MS;
            })
        ]);

        return [
            { rotulo: "Alunos matriculados", subaba: "alunos", valor: alunos },
            { rotulo: "Tutores ativos", subaba: "tutores", valor: tutores },
            { rotulo: "Tutorias ativas", subaba: "tutorias", valor: tutorias },
            { rotulo: "Pedidos de tutoria pendentes", subaba: "pedidos", valor: pedidos, pedeAcao: true },
            { rotulo: "Contestações pendentes", subaba: "contestacoes", valor: contestacoes, pedeAcao: true },
            { rotulo: "Atividades com prazo nos próximos 7 dias", subaba: "atividades", valor: atividades },
        ];
    }, [id])

    const { dados, erro, carregando, atualizando, atualizar, tentarNovamente } = useBuscar(buscar);

    return (
        <ListaSala
        cabecalho={cabecalho}
        itens={dados ?? []}
        keyExtractor={(item) => item.subaba}
        numColumns={2}
        renderItem={({ item }) => {
            const destaque = item.pedeAcao && item.valor !== null && item.valor > 0;

            return (
                <TouchableOpacity
                style={styles.card}
                onPress={() => irPara(item.subaba)}
                accessibilityRole="button"
                accessibilityLabel={`${item.rotulo}: ${item.valor ?? "não foi possível carregar"}`}
                >
                    <Text style={[styles.numero, destaque && styles.numeroDestaque]}>{item.valor ?? "—"}</Text>
                    <Text style={styles.rotulo}>{item.rotulo}</Text>
                    {item.valor === null && <Text style={styles.erro}>Não foi possível carregar</Text>}
                </TouchableOpacity>
            )
        }}
        carregando={carregando}
        atualizando={atualizando}
        falhou={!dados}
        erro={erro}
        onAtualizar={atualizar}
        onTentarNovamente={tentarNovamente}
        vazio=""
        />
    )
}

const styles = StyleSheet.create({
    card:{
        flex: 1,
        gap: spacing.xs,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: colors.gray300,
        borderRadius: radius.cardSm,
        backgroundColor: colors.white,
        ...shadows.cardLeve
    },
    numero:{
        fontFamily: fonts.bold,
        fontSize: fontSizes.indicador,
        color: colors.black
    },
    numeroDestaque:{
        color: colors.red700
    },
    rotulo:{
        fontFamily: fonts.medium,
        fontSize: 13,
        color: colors.gray700
    },
    erro:{
        fontFamily: fonts.regular,
        fontSize: 12,
        color: colors.red700
    }
})
