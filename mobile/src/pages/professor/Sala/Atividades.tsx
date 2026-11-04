import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet } from "react-native";

import { Badge } from "../../../components/Badge";
import { ItemLista } from "../../../components/ItemLista";
import { Etapa, FiltroEtapa } from "../../../components/FiltroEtapa";
import { ListaSala } from "./ListaSala";
import { PropsAba } from "./tipos";

import { api } from "../../../services/api";
import { useBuscar } from "../../../lib/useBuscar";
import { MASCOTES } from "../../../lib/mascotes";
import { formatarDataHora, rotuloTipo } from "../../../lib/formatacao";
import { AtividadeSala, TipoAtividadeOpcao } from "../../../lib/types";
import { colors, fonts, fontSizes, spacing } from "../../../styles/theme";

interface Dados {
    atividades: AtividadeSala[];
    // Se a T8 falhar, o rótulo do tipo é montado a partir do valor
    tipos: TipoAtividadeOpcao[];
}

// Atividades > Atividades (Figma "Acompanhamento de atividades"; site: atividades/page.tsx).
// SÓ CONSULTA: quem cria atividade é o tutor, por isso não há botão de criar.
// P11 (GET /salas/:id/atividades?etapa=) e T8 (rótulos dos tipos). Tocar abre as respostas (P12)
export function Atividades({ sala, cabecalho, navigation }: PropsAba){
    const [etapa, setEtapa] = useState<Etapa>("");

    const buscar = useCallback(async (): Promise<Dados> => {
        const [atividades, tipos] = await Promise.all([
            api.get<AtividadeSala[]>(`/salas/${sala.id_sala}/atividades`, { params: etapa ? { etapa } : undefined }).then((r) => r.data),
            api.get<TipoAtividadeOpcao[]>("/tipos-atividade").then((r) => r.data).catch(() => [])
        ]);

        return { atividades, tipos };
    }, [sala.id_sala, etapa])

    const { dados, erro, carregando, atualizando, atualizar, tentarNovamente } = useBuscar(buscar);

    return (
        <ListaSala
        cabecalho={cabecalho}
        topo={
            <>
                <Text style={styles.ajuda}>Atividades criadas pelos tutores desta sala. Toque numa atividade para ver quem enviou e as notas.</Text>
                <FiltroEtapa etapa={etapa} onChange={setEtapa} />
                {dados && !carregando && <Text style={styles.titulo}>Atividades ({dados.atividades.length})</Text>}
            </>
        }
        itens={dados?.atividades ?? []}
        keyExtractor={(item) => String(item.id_atividade)}
        renderItem={({ item }) => (
            <ItemLista
            titulo={item.titulo}
            detalhes={[
                `${rotuloTipo(item.tipo, dados?.tipos ?? [])} · ${item.conteudo?.nome ?? "Sem conteúdo"} · tutor ${item.tutor.nome}`,
                `Prazo: ${formatarDataHora(item.data_entrega)}`
            ]}
            onPress={() => navigation.navigate("DetalheAtividadeProfessor", { id_atividade: item.id_atividade })}
            accessibilityLabel={`${item.titulo}. Ver respostas`}
            >
                <View style={styles.selos}>
                    <Badge label={`${item.etapa}ª etapa`} />
                    <Badge label={`Entregues ${item.total_entregues}/${item.total_destinatarios}`} />
                    <Badge label={`Com nota ${item.total_com_nota}/${item.total_destinatarios}`} />
                </View>
            </ItemLista>
        )}
        carregando={carregando}
        atualizando={atualizando}
        falhou={!dados}
        erro={erro}
        onAtualizar={atualizar}
        onTentarNovamente={tentarNovamente}
        vazio={etapa ? "Nenhuma atividade nesta etapa." : "Os tutores ainda não criaram atividades nesta sala."}
        imagemVazio={MASCOTES.atividades}
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
    selos:{
        flexDirection: "row",
        flexWrap: "wrap",
        gap: spacing.xs,
        marginTop: spacing.xs
    }
})
