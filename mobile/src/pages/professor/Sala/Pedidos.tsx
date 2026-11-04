import React, { useCallback, useState } from "react";
import { Text, StyleSheet } from "react-native";

import { ItemPedido, ModalPedido } from "../../../components/ListaPedidos";
import { ListaSala } from "./ListaSala";
import { PropsAba } from "./tipos";

import { api } from "../../../services/api";
import { useBuscar } from "../../../lib/useBuscar";
import { PedidoTutoria } from "../../../lib/types";
import { colors, fonts, fontSizes } from "../../../styles/theme";

// Tutoria > Pedidos (Figma "Solicitações"; site: pedidos/page.tsx). A P26 devolve os pedidos
// de TODAS as salas do professor: aqui fica só esta sala. Aceitar cria o tutor:
// a moldura busca os tutores de novo para o interruptor de permissão
export function Pedidos({ sala, cabecalho, atualizarSala }: PropsAba){
    const [aberto, setAberto] = useState<PedidoTutoria | null>(null);

    const buscar = useCallback(async () => {
        const pedidos = (await api.get<PedidoTutoria[]>("/pedidos-tutoria")).data;

        return pedidos.filter((pedido) => pedido.sala_pedido.id_sala === sala.id_sala);
    }, [sala.id_sala])

    const { dados, erro, carregando, atualizando, atualizar, tentarNovamente } = useBuscar(buscar);

    return (
        <>
            <ListaSala
            cabecalho={cabecalho}
            topo={dados && <Text style={styles.titulo}>Pedidos para ser tutor ({dados.length})</Text>}
            itens={dados ?? []}
            keyExtractor={(item) => String(item.id_pedido)}
            renderItem={({ item }) => <ItemPedido pedido={item} onVer={() => setAberto(item)} />}
            carregando={carregando}
            atualizando={atualizando}
            falhou={!dados}
            erro={erro}
            onAtualizar={atualizar}
            onTentarNovamente={tentarNovamente}
            vazio="Nenhum pedido pendente nesta sala. Os alunos matriculados pedem para ser tutor pela área deles."
            />

            <ModalPedido
            pedido={aberto}
            onClose={() => setAberto(null)}
            onDecidido={() => { atualizar(); atualizarSala(); }}
            />
        </>
    )
}

const styles = StyleSheet.create({
    titulo:{
        fontFamily: fonts.semibold,
        fontSize: fontSizes.tituloCard,
        color: colors.red700
    }
})
